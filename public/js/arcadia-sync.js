/**
 * ARCADIA 2.0 — Cloud Progression Synchronization & Migration Controller (Phase 3C)
 * ------------------------------------------------------------------
 * Manages:
 *   - Bidirectional cloud synchronization for authenticated users
 *   - Explicit user-confirmed guest-to-account progression migration
 *   - Deterministic high-water mark & union conflict resolution
 *   - Offline event queueing and reconnection sync
 *   - Non-destructive guest data isolation and local backups
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  var MIGRATION_MODAL_ID = 'migration-modal';
  var GUEST_STORAGE_KEY = 'arcadia_guest_progression';
  var SYNC_DEBOUNCE_MS = 3000;

  var syncTimeout = null;
  var isSyncing = false;
  var currentAuthUser = null;

  /* ---------------- Pure Helper Functions: Merging ---------------- */

  /**
   * Deterministic High-Water Mark and Union Merge.
   * Merges guest progression into an existing or new cloud profile.
   */
  function mergeProfiles(cloud, guest) {
    cloud = cloud || {};
    guest = guest || {};

    var cloudXp = typeof cloud.xp === 'number' && isFinite(cloud.xp) && cloud.xp >= 0 ? Math.floor(cloud.xp) : 0;
    var guestXp = typeof guest.xp === 'number' && isFinite(guest.xp) && guest.xp >= 0 ? Math.floor(guest.xp) : 0;

    // 1. High-water mark XP policy
    var mergedXp = Math.max(cloudXp, guestXp);

    // 2. Level and rank derived deterministically from merged XP
    var engine = window.ArcadiaProgression;
    var levelInfo = engine && typeof engine.getLevelInfo === 'function' ? engine.getLevelInfo(mergedXp) : { level: 1, rankTitle: 'Rookie', badgeTier: 'bronze' };

    // 3. Achievements: set union preserving earliest unlock timestamp
    var achMap = {};
    var cloudAchs = Array.isArray(cloud.achievements) ? cloud.achievements : [];
    var guestAchs = Array.isArray(guest.achievements) ? guest.achievements : [];

    function processAchList(list) {
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!item || !item.id) continue;
        var id = String(item.id).trim();
        var dateStr = item.unlockedAt || new Date().toISOString();
        if (!achMap[id]) {
          achMap[id] = { id: id, unlockedAt: dateStr };
        } else {
          // Keep earliest timestamp
          var prevTime = new Date(achMap[id].unlockedAt).getTime();
          var curTime = new Date(dateStr).getTime();
          if (!isNaN(curTime) && curTime < prevTime) {
            achMap[id].unlockedAt = dateStr;
          }
        }
      }
    }
    processAchList(cloudAchs);
    processAchList(guestAchs);

    var mergedAchievements = [];
    for (var k in achMap) {
      if (Object.prototype.hasOwnProperty.call(achMap, k)) {
        mergedAchievements.push(achMap[k]);
      }
    }

    // 4. Statistics: high-water mark for sessions and per-game play counts
    var cloudStats = cloud.stats || {};
    var guestStats = guest.stats || {};

    var sessionsPlayed = Math.max(
      typeof cloudStats.sessionsPlayed === 'number' ? cloudStats.sessionsPlayed : 0,
      typeof guestStats.sessionsPlayed === 'number' ? guestStats.sessionsPlayed : 0
    );

    var cloudLastTime = cloudStats.lastPlayed ? new Date(cloudStats.lastPlayed).getTime() : 0;
    var guestLastTime = guestStats.lastPlayed ? new Date(guestStats.lastPlayed).getTime() : 0;
    var latestTime = Math.max(isNaN(cloudLastTime) ? 0 : cloudLastTime, isNaN(guestLastTime) ? 0 : guestLastTime);
    var lastPlayed = latestTime > 0 ? new Date(latestTime).toISOString() : new Date().toISOString();

    var gamesPlayedCount = {};
    var allSlugs = {};
    if (cloudStats.gamesPlayedCount) {
      for (var s1 in cloudStats.gamesPlayedCount) allSlugs[s1] = true;
    }
    if (guestStats.gamesPlayedCount) {
      for (var s2 in guestStats.gamesPlayedCount) allSlugs[s2] = true;
    }

    var favoriteGame = null;
    var maxPlays = 0;
    for (var slug in allSlugs) {
      var cCount = (cloudStats.gamesPlayedCount && cloudStats.gamesPlayedCount[slug]) || 0;
      var gCount = (guestStats.gamesPlayedCount && guestStats.gamesPlayedCount[slug]) || 0;
      var mergedCount = Math.max(cCount, gCount);
      gamesPlayedCount[slug] = mergedCount;
      if (mergedCount > maxPlays) {
        maxPlays = mergedCount;
        favoriteGame = slug;
      }
    }

    // 5. Daily XP: preserve current day's progress
    var todayStr = new Date().toISOString().slice(0, 10);
    var dailyXp = 0;
    if (cloud.daily && cloud.daily.date === todayStr) dailyXp = Math.max(dailyXp, cloud.daily.xp || 0);
    if (guest.daily && guest.daily.date === todayStr) dailyXp = Math.max(dailyXp, guest.daily.xp || 0);

    return {
      xp: mergedXp,
      totalXp: mergedXp,
      level: levelInfo.level,
      rankTitle: levelInfo.rankTitle,
      badgeTier: levelInfo.badgeTier,
      achievements: mergedAchievements,
      stats: {
        sessionsPlayed: sessionsPlayed,
        lastPlayed: lastPlayed,
        favoriteGame: favoriteGame,
        gamesPlayedCount: gamesPlayedCount
      },
      daily: {
        date: todayStr,
        xp: dailyXp
      },
      lastAwardedAt: Object.assign({}, guest.lastAwardedAt, cloud.lastAwardedAt),
      version: (cloud.version || 0) + 1
    };
  }

  /* ---------------- Local Cache & Offline Queue ---------------- */

  function getUserCacheKey(uid) {
    return 'arcadia_user_cache_' + uid;
  }

  function getSyncQueueKey(uid) {
    return 'arcadia_sync_queue_' + uid;
  }

  function loadUserCache(uid) {
    try {
      var raw = localStorage.getItem(getUserCacheKey(uid));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveUserCache(uid, data) {
    try {
      localStorage.setItem(getUserCacheKey(uid), JSON.stringify(data));
    } catch (e) {}
  }

  function enqueueSync(uid, data) {
    try {
      var qKey = getSyncQueueKey(uid);
      var queue = JSON.parse(localStorage.getItem(qKey) || '[]');
      queue.push({
        data: data,
        enqueuedAt: Date.now()
      });
      // Cap queue size to 20 items to avoid storage exhaustion
      if (queue.length > 20) queue.shift();
      localStorage.setItem(qKey, JSON.stringify(queue));
    } catch (e) {}
  }

  function drainSyncQueue(uid) {
    if (!uid || isSyncing) return Promise.resolve();
    try {
      var qKey = getSyncQueueKey(uid);
      var queue = JSON.parse(localStorage.getItem(qKey) || '[]');
      if (!queue.length) return Promise.resolve();

      var latestItem = queue[queue.length - 1];
      if (!latestItem || !latestItem.data) {
        localStorage.removeItem(qKey);
        return Promise.resolve();
      }

      isSyncing = true;
      return window.Arcadia.saveCloudProgression(uid, latestItem.data)
        .then(function (res) {
          if (res && res.success) {
            localStorage.removeItem(qKey);
          }
          isSyncing = false;
        })
        .catch(function () {
          isSyncing = false;
        });
    } catch (e) {
      isSyncing = false;
      return Promise.resolve();
    }
  }

  /* ---------------- Migration Modal UI ---------------- */

  function isMigrationModalOpen() {
    var modal = document.getElementById(MIGRATION_MODAL_ID);
    return modal && modal.classList.contains('open');
  }

  function showMigrationModal(user, guestProfile, cloudProfile) {
    var modal = document.getElementById(MIGRATION_MODAL_ID);
    if (!modal) return;

    var guestXp = guestProfile.xp || 0;
    var guestLevel = guestProfile.level || 1;
    var guestAchs = Array.isArray(guestProfile.achievements) ? guestProfile.achievements.length : 0;

    var cloudXp = (cloudProfile && cloudProfile.xp) || 0;
    var cloudLevel = (cloudProfile && cloudProfile.level) || 1;
    var cloudAchs = (cloudProfile && Array.isArray(cloudProfile.achievements)) ? cloudProfile.achievements.length : 0;

    var merged = mergeProfiles(cloudProfile, guestProfile);

    // Populate UI elements
    var guestInfoEl = document.getElementById('migration-guest-info');
    var cloudInfoEl = document.getElementById('migration-cloud-info');
    var mergedInfoEl = document.getElementById('migration-merged-info');

    if (guestInfoEl) {
      guestInfoEl.innerHTML = 'Level <strong>' + guestLevel + '</strong> (' + guestXp.toLocaleString() + ' XP) • ' + guestAchs + ' Badges';
    }
    if (cloudInfoEl) {
      if (cloudProfile && cloudProfile.xp > 0) {
        cloudInfoEl.innerHTML = 'Level <strong>' + cloudLevel + '</strong> (' + cloudXp.toLocaleString() + ' XP) • ' + cloudAchs + ' Badges';
      } else {
        cloudInfoEl.innerHTML = '<em>Brand New Cloud Profile</em> (0 XP)';
      }
    }
    if (mergedInfoEl) {
      mergedInfoEl.innerHTML = 'Level <strong>' + merged.level + ' ' + (merged.rankTitle || '') + '</strong> (' + merged.xp.toLocaleString() + ' XP) • ' + merged.achievements.length + ' Badges';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    // Wire buttons
    var confirmBtn = document.getElementById('migration-confirm-btn');
    var skipBtn = document.getElementById('migration-skip-btn');
    var laterBtn = document.getElementById('migration-later-btn');
    var closeBtn = document.getElementById('migration-close-btn');

    function closeMigration() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (closeBtn) closeBtn.onclick = closeMigration;
    if (laterBtn) laterBtn.onclick = closeMigration;

    if (skipBtn) {
      skipBtn.onclick = function () {
        // User elects to keep cloud profile and ignore guest data
        closeMigration();
        // Mark as dismissed for this account so modal does not re-appear every login
        try {
          localStorage.setItem('arcadia_migration_dismissed_' + user.uid, 'true');
        } catch (e) {}
        if (window.ArcadiaToast) window.ArcadiaToast('Using cloud profile.');
        syncActiveUserProfile(user.uid, cloudProfile || {});
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = function () {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Transferring...';

        // 1. Archive guest backup
        try {
          localStorage.setItem('arcadia_guest_backup_' + Date.now(), JSON.stringify(guestProfile));
          localStorage.setItem('arcadia_migration_dismissed_' + user.uid, 'true');
        } catch (e) {}

        // 2. Perform merge & save
        executeMigration(user.uid, merged).then(function () {
          closeMigration();
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Transfer Progress';
          if (window.ArcadiaToast) window.ArcadiaToast('Progress successfully migrated to your account!');
        }).catch(function (err) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Transfer Progress';
          console.warn('[ArcadiaSync] Migration failed:', err);
          if (window.ArcadiaToast) window.ArcadiaToast('Transfer failed to reach cloud. Saved locally.');
          closeMigration();
        });
      };
    }
  }

  function executeMigration(uid, mergedProfile) {
    saveUserCache(uid, mergedProfile);
    syncActiveUserProfile(uid, mergedProfile);

    // Persist to Firestore
    if (window.Arcadia && typeof window.Arcadia.saveCloudProgression === 'function') {
      return window.Arcadia.saveCloudProgression(uid, mergedProfile)
        .then(function (res) {
          if (!res || !res.success) {
            enqueueSync(uid, mergedProfile);
          }
          return res;
        });
    }
    enqueueSync(uid, mergedProfile);
    return Promise.resolve({ success: true, localOnly: true });
  }

  /* ---------------- Active Profile Switching ---------------- */

  function syncActiveUserProfile(uid, profileData) {
    if (profileData && Object.keys(profileData).length > 0) {
      saveUserCache(uid, profileData);
    }
    if (window.ArcadiaProgression && typeof window.ArcadiaProgression.setActiveUser === 'function') {
      window.ArcadiaProgression.setActiveUser(uid);
    }
    if (window.ArcadiaProfile && typeof window.ArcadiaProfile.render === 'function') {
      window.ArcadiaProfile.render();
    }
  }

  /* ---------------- Debounced Cloud Sync on Progression Event ---------------- */

  function handleProgressionEvent(evt) {
    if (!currentAuthUser) return; // Guest progression is already managed in localStorage by Phase 3A
    if (evt && (evt.type === 'user_switched' || evt.type === 'reset')) return;

    var uid = currentAuthUser.uid;
    var engine = window.ArcadiaProgression;
    if (!engine || typeof engine.getProfile !== 'function') return;

    var currentProfile = engine.getProfile();
    saveUserCache(uid, currentProfile);

    // Debounce cloud write
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(function () {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        enqueueSync(uid, currentProfile);
        return;
      }

      if (window.Arcadia && typeof window.Arcadia.saveCloudProgression === 'function') {
        window.Arcadia.saveCloudProgression(uid, currentProfile)
          .then(function (res) {
            if (!res || !res.success) {
              enqueueSync(uid, currentProfile);
            }
          })
          .catch(function () {
            enqueueSync(uid, currentProfile);
          });
      }
    }, SYNC_DEBOUNCE_MS);
  }

  /* ---------------- Authentication Lifecycle Hook ---------------- */

  function handleAuthChange(user) {
    currentAuthUser = user;

    if (!user) {
      // Revert to guest mode
      clearTimeout(syncTimeout);
      if (window.ArcadiaProgression && typeof window.ArcadiaProgression.setActiveUser === 'function') {
        window.ArcadiaProgression.setActiveUser(null);
      }
      if (window.ArcadiaProfile && typeof window.ArcadiaProfile.render === 'function') {
        window.ArcadiaProfile.render();
      }
      return;
    }

    var uid = user.uid;

    // Check for offline sync queue draining
    drainSyncQueue(uid);

    // Check guest progression status
    var rawGuest = null;
    try {
      rawGuest = JSON.parse(localStorage.getItem(GUEST_STORAGE_KEY) || 'null');
    } catch (e) {}

    var hasGuestProgress = rawGuest && (rawGuest.xp > 0 || (Array.isArray(rawGuest.achievements) && rawGuest.achievements.length > 0));
    var isDismissed = false;
    try {
      isDismissed = localStorage.getItem('arcadia_migration_dismissed_' + uid) === 'true';
    } catch (e) {}

    // Fetch cloud progression
    if (window.Arcadia && typeof window.Arcadia.getCloudProgression === 'function') {
      console.log('[ArcadiaSync:Diag]', {
        authUidPrefix: uid ? uid.substring(0, 5) + '...' : null,
        hasGuestProgress: !!hasGuestProgress,
        isDismissed: !!isDismissed
      });

      window.Arcadia.getCloudProgression(uid).then(function (cloudData) {
        console.log('[ArcadiaSync:Diag] getCloudProgression result:', cloudData ? {
          keys: Object.keys(cloudData),
          xp: cloudData.xp,
          totalXp: cloudData.totalXp,
          level: cloudData.level,
          achievementsLength: Array.isArray(cloudData.achievements) ? cloudData.achievements.length : typeof cloudData.achievements
        } : 'null (document does not exist under progression/' + (uid ? uid.substring(0, 5) + '...' : 'null') + ')');

        if (hasGuestProgress && !isDismissed) {
          console.log('[ArcadiaSync:Diag] Branch: showMigrationModal');
          showMigrationModal(user, rawGuest, cloudData);
        } else if (cloudData) {
          console.log('[ArcadiaSync:Diag] Branch: syncActiveUserProfile');
          syncActiveUserProfile(uid, cloudData);
        } else {
          console.log('[ArcadiaSync:Diag] Branch: No cloudData and no guestProgress to migrate');
        }
      });
    }
  }

  /* ---------------- Initialization ---------------- */

  function init() {
    // Listen to network status for offline sync recovery
    if (typeof window !== 'undefined') {
      window.addEventListener('online', function () {
        if (currentAuthUser) {
          drainSyncQueue(currentAuthUser.uid);
        }
      });
    }

    // Connect to ArcadiaProgression events
    if (window.ArcadiaProgression && typeof window.ArcadiaProgression.onProgressionChange === 'function') {
      window.ArcadiaProgression.onProgressionChange(handleProgressionEvent);
    }

    // Connect to Arcadia Auth events
    if (window.Arcadia && typeof window.Arcadia.onAuthChange === 'function') {
      window.Arcadia.onAuthChange(handleAuthChange);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Export public API
  var ArcadiaSync = {
    mergeProfiles: mergeProfiles,
    showMigrationModal: showMigrationModal,
    isMigrationModalOpen: isMigrationModalOpen,
    drainSyncQueue: drainSyncQueue,
    syncActiveUserProfile: syncActiveUserProfile,
    executeMigration: executeMigration,
    enqueueSync: enqueueSync,
    init: init
  };

  if (typeof window !== 'undefined') {
    window.ArcadiaSync = ArcadiaSync;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArcadiaSync;
  }
})();
