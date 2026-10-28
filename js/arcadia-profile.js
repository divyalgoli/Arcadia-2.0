/**
 * ARCADIA 2.0 — Player Profile & Achievement UI (Phase 3B)
 * ------------------------------------------------------------------
 * Manages the Player Profile modal, Achievement Gallery with filters,
 * and Progression Notification toasts.
 * Dependency-free, fully responsive, accessible, and supports both
 * authenticated and guest players.
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  var MODAL_ID = 'profile-modal';
  var BACKDROP_ID = 'profile-modal-backdrop';
  var CLOSE_BTN_ID = 'profile-modal-close';
  var TOAST_CONTAINER_ID = 'progression-toast-container';

  var activeFilter = 'all'; // 'all' | 'unlocked' | 'locked'
  var previousActiveElement = null;
  var notificationHistory = {}; // deduping cache: key -> timestamp

  // Friendly title map for game slugs
  var GAME_TITLES = {
    'ping-pong': 'Ping Pong',
    'ping-pong-v2': 'Ping Pong',
    'balloon-blast': 'Balloon Blast',
    'fruit-slash': 'Fruit Slash',
    'fruit-slash-survival': 'Fruit Slash (Survival)',
    'fruit-slash-time-attack': 'Fruit Slash (Time Attack)',
    'gravity-run': 'Gravity Run',
    'memory-card': 'Memory Card',
    'outbound': 'Outbound',
    'paint-tag-arena': 'Paint Tag Arena',
    'superman-swing': 'Superman Swing',
    'tank-wars': 'Tank Wars',
    'tic-tac-toe-candyland': 'Candyland Tic-Tac-Toe'
  };

  /* ---------------- Modal Control ---------------- */

  function isModalOpen() {
    var modal = document.getElementById(MODAL_ID);
    return modal && modal.classList.contains('open');
  }

  function openProfile() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal || isModalOpen()) return;

    previousActiveElement = document.activeElement;
    renderProfileContent();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    // Focus the close button for accessibility
    var closeBtn = document.getElementById(CLOSE_BTN_ID);
    if (closeBtn && typeof closeBtn.focus === 'function') {
      closeBtn.focus();
    }

    // Trap focus inside modal
    modal.addEventListener('keydown', trapFocus);
  }

  function closeProfile() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeEventListener('keydown', trapFocus);

    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      try {
        previousActiveElement.focus();
      } catch (e) {}
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    var focusables = modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  /* ---------------- Profile Content Rendering ---------------- */

  function renderProfileContent() {
    var engine = window.ArcadiaProgression;
    if (!engine || typeof engine.getProfile !== 'function') return;

    var profile = engine.getProfile();
    var user = (window.Arcadia && typeof window.Arcadia.getCurrentUser === 'function') ? window.Arcadia.getCurrentUser() : null;

    // 1. Player Identity
    var nameEl = document.getElementById('profile-name');
    var subtitleEl = document.getElementById('profile-subtitle');
    var avatarEl = document.getElementById('profile-avatar');
    var navAvatarEl = document.getElementById('nav-avatar');
    var loginBtnRow = document.getElementById('profile-auth-actions');

    var displayName = 'Guest Player';
    var isGuest = !user;

    if (user) {
      displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Arcadia Player');
    }

    if (nameEl) nameEl.textContent = displayName;

    if (subtitleEl) {
      if (user) {
        subtitleEl.innerHTML = '<span class="status-dot online"></span> ' + escapeHtml(user.email || 'Cloud Profile Active');
      } else {
        subtitleEl.innerHTML = '<span class="status-dot guest"></span> Local Profile <span class="profile-guest-note">(Saved on this browser)</span>';
      }
    }

    // Avatar presentation
    var avatarChar = isGuest ? '🎮' : displayName.charAt(0).toUpperCase();
    if (avatarEl) {
      avatarEl.textContent = avatarChar;
      avatarEl.className = 'profile-avatar badge-tier-' + (profile.badgeTier || 'bronze');
    }

    // Update nav avatar initial and badge tier
    if (navAvatarEl) {
      if (!user) {
        navAvatarEl.textContent = 'G';
        navAvatarEl.title = 'Player Profile (Level ' + profile.level + ' ' + (profile.rankTitle || 'Rookie') + ')';
      } else {
        navAvatarEl.textContent = displayName.charAt(0).toUpperCase();
        navAvatarEl.title = displayName + ' (Level ' + profile.level + ' ' + (profile.rankTitle || 'Rookie') + ')';
      }
    }

    // Auth actions inside profile modal
    if (loginBtnRow) {
      if (user) {
        loginBtnRow.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" id="profile-modal-logout">Log Out</button>';
        var logoutBtn = document.getElementById('profile-modal-logout');
        if (logoutBtn) {
          logoutBtn.onclick = function () {
            if (confirm('Log out of Arcadia?')) {
              window.Arcadia.signOutUser().then(function () {
                closeProfile();
                if (window.ArcadiaToast) window.ArcadiaToast('Logged out');
              });
            }
          };
        }
      } else {
        loginBtnRow.innerHTML = '<button type="button" class="btn btn-primary btn-sm" id="profile-modal-login">Sign In / Register</button>';
        var loginBtn = document.getElementById('profile-modal-login');
        if (loginBtn) {
          loginBtn.onclick = function () {
            closeProfile();
            var authModal = document.getElementById('auth-modal');
            if (authModal) {
              authModal.classList.add('open');
              authModal.setAttribute('aria-hidden', 'false');
            }
          };
        }
      }
    }

    // 2. Level, Rank, and XP Progress
    var levelEl = document.getElementById('profile-level');
    var rankEl = document.getElementById('profile-rank');
    var badgeChipEl = document.getElementById('profile-badge-chip');
    var totalXpEl = document.getElementById('profile-total-xp');
    var curXpEl = document.getElementById('profile-cur-xp');
    var nextXpEl = document.getElementById('profile-next-xp');
    var xpFillEl = document.getElementById('profile-xp-fill');
    var xpPercentEl = document.getElementById('profile-xp-percent');
    var xpBarContainer = document.getElementById('profile-xp-bar');
    var dailyXpEl = document.getElementById('profile-daily-xp');

    if (levelEl) levelEl.textContent = profile.level;
    if (rankEl) rankEl.textContent = profile.rankTitle || 'Rookie';
    if (badgeChipEl) {
      badgeChipEl.textContent = capitalizeFirstLetter(profile.badgeTier || 'bronze');
      badgeChipEl.className = 'profile-badge-chip tier-' + (profile.badgeTier || 'bronze');
    }

    var totalXpFormatted = Number(profile.totalXp || 0).toLocaleString();
    if (totalXpEl) totalXpEl.textContent = totalXpFormatted + ' XP';

    if (curXpEl) curXpEl.textContent = (profile.levelProgressXp || 0).toLocaleString();
    if (nextXpEl) nextXpEl.textContent = (profile.levelRequiredXp || 300).toLocaleString();

    var pct = Math.max(0, Math.min(100, profile.progressPercent || 0));
    if (xpFillEl) xpFillEl.style.width = pct + '%';
    if (xpPercentEl) xpPercentEl.textContent = pct + '%';
    if (xpBarContainer) {
      xpBarContainer.setAttribute('aria-valuenow', pct);
      xpBarContainer.setAttribute('aria-valuetext', pct + '% toward Level ' + (profile.level + 1));
    }

    if (dailyXpEl) {
      var dailyEarned = profile.daily ? profile.daily.xp : 0;
      dailyXpEl.textContent = dailyEarned.toLocaleString() + ' / 2,500 XP';
    }

    // 3. Platform & Game Stats
    var statSessions = document.getElementById('profile-stat-sessions');
    var statGames = document.getElementById('profile-stat-games');
    var statFavorite = document.getElementById('profile-stat-favorite');
    var statAchCount = document.getElementById('profile-stat-achievements');

    if (statSessions) {
      statSessions.textContent = profile.stats ? (profile.stats.sessionsPlayed || 0) : 0;
    }

    if (statGames) {
      var count = 0;
      if (profile.stats && profile.stats.gamesPlayedCount) {
        count = Object.keys(profile.stats.gamesPlayedCount).length;
      }
      statGames.textContent = count + ' / 10';
    }

    if (statFavorite) {
      var favSlug = profile.stats ? profile.stats.favoriteGame : null;
      statFavorite.textContent = favSlug && GAME_TITLES[favSlug] ? GAME_TITLES[favSlug] : (favSlug || 'None yet');
    }

    // 4. Achievement Gallery
    renderAchievementGallery(profile);
  }

  /* ---------------- Achievement Gallery ---------------- */

  function renderAchievementGallery(profile) {
    var engine = window.ArcadiaProgression;
    if (!engine || typeof engine.getAchievements !== 'function') return;

    var catalog = engine.getAchievements();
    var listContainer = document.getElementById('profile-achievements-list');
    var unlockedCountEl = document.getElementById('profile-ach-unlocked-count');
    var tabAllCount = document.getElementById('ach-tab-count-all');
    var tabUnlockedCount = document.getElementById('ach-tab-count-unlocked');
    var tabLockedCount = document.getElementById('ach-tab-count-locked');

    var unlockedCount = 0;
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].unlocked) unlockedCount++;
    }
    var lockedCount = catalog.length - unlockedCount;

    if (unlockedCountEl) unlockedCountEl.textContent = unlockedCount + ' / ' + catalog.length;
    var statAch = document.getElementById('profile-stat-achievements');
    if (statAch) statAch.textContent = unlockedCount + ' / ' + catalog.length;

    if (tabAllCount) tabAllCount.textContent = catalog.length;
    if (tabUnlockedCount) tabUnlockedCount.textContent = unlockedCount;
    if (tabLockedCount) tabLockedCount.textContent = lockedCount;

    if (!listContainer) return;

    // Filter achievements
    var filtered = catalog.filter(function (item) {
      if (activeFilter === 'unlocked') return item.unlocked;
      if (activeFilter === 'locked') return !item.unlocked;
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div class="ach-empty-state">No achievements in this filter.</div>';
      return;
    }

    var html = '';
    for (var j = 0; j < filtered.length; j++) {
      var ach = filtered[j];
      var isUnlocked = !!ach.unlocked;
      var cardClass = 'ach-card ' + (isUnlocked ? 'unlocked' : 'locked');

      // Date string if unlocked
      var dateHtml = '';
      if (isUnlocked && ach.unlockedAt) {
        var dateFormatted = formatDateString(ach.unlockedAt);
        dateHtml = '<div class="ach-date">✓ Unlocked ' + escapeHtml(dateFormatted) + '</div>';
      } else {
        dateHtml = '<div class="ach-date locked-label">🔒 Locked</div>';
      }

      // Progress string where accurately calculable
      var progressHtml = getAchievementProgressHtml(ach, profile);

      var categoryBadge = formatCategoryName(ach.category);

      html += [
        '<div class="' + cardClass + '" data-ach-id="' + escapeHtml(ach.id) + '">',
        '  <div class="ach-icon-col">',
        '    <div class="ach-icon-circle">' + (ach.icon || '🏆') + '</div>',
        '  </div>',
        '  <div class="ach-info-col">',
        '    <div class="ach-header-row">',
        '      <span class="ach-title">' + escapeHtml(ach.title) + '</span>',
        '      <span class="ach-category-tag">' + escapeHtml(categoryBadge) + '</span>',
        '      <span class="ach-xp-tag">+' + Number(ach.xpReward || 0) + ' XP</span>',
        '    </div>',
        '    <p class="ach-desc">' + escapeHtml(ach.description) + '</p>',
        progressHtml,
        dateHtml,
        '  </div>',
        '</div>'
      ].join('\n');
    }

    listContainer.innerHTML = html;
  }

  function getAchievementProgressHtml(ach, profile) {
    if (ach.unlocked || !profile) return '';

    var current = 0;
    var target = 0;
    var unit = '';

    if (ach.id === 'CENTURION') {
      current = profile.stats ? (profile.stats.sessionsPlayed || 0) : 0;
      target = 50;
      unit = 'sessions';
    } else if (ach.id === 'ALL_ROUNDER') {
      current = profile.stats && profile.stats.gamesPlayedCount ? Object.keys(profile.stats.gamesPlayedCount).length : 0;
      target = 5;
      unit = 'games';
    } else if (ach.id === 'PLATFORM_MASTER') {
      current = profile.stats && profile.stats.gamesPlayedCount ? Object.keys(profile.stats.gamesPlayedCount).length : 0;
      target = 10;
      unit = 'games';
    } else if (ach.id === 'LEVEL_FIVE') {
      current = profile.level || 1;
      target = 5;
      unit = 'levels';
    } else if (ach.id === 'LEVEL_TEN') {
      current = profile.level || 1;
      target = 10;
      unit = 'levels';
    }

    if (target > 0) {
      var pct = Math.min(100, Math.floor((current / target) * 100));
      return [
        '<div class="ach-progress-row">',
        '  <div class="ach-mini-bar"><div class="ach-mini-fill" style="width:' + pct + '%;"></div></div>',
        '  <span class="ach-progress-text">' + current + ' / ' + target + ' ' + unit + '</span>',
        '</div>'
      ].join('');
    }

    return '';
  }

  /* ---------------- Progression Notifications ---------------- */

  function showProgressionNotification(type, data) {
    var container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = TOAST_CONTAINER_ID;
      container.className = 'progression-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      document.body.appendChild(container);
    }

    var dedupeKey = type + ':' + (data.id || data.level || data.xp || '');
    var now = Date.now();
    if (notificationHistory[dedupeKey] && now - notificationHistory[dedupeKey] < 8000) {
      return; // prevent duplicate alert within 8 seconds
    }
    notificationHistory[dedupeKey] = now;

    var toast = document.createElement('div');
    toast.className = 'progression-toast ' + type;

    var icon = '⚡';
    var title = 'Progression Update';
    var subtitle = '';

    if (type === 'level-up') {
      icon = '⭐';
      title = 'LEVEL UP! Level ' + (data.level || 1);
      subtitle = (data.rankTitle ? data.rankTitle + ' • ' : '') + 'Keep playing to unlock higher ranks!';
    } else if (type === 'achievement') {
      icon = data.icon || '🏆';
      title = 'Achievement Unlocked!';
      subtitle = data.title + ' (+' + (data.xpReward || 0) + ' XP)';
    } else if (type === 'xp') {
      icon = '⚡';
      title = '+' + (data.xp || 0) + ' XP Earned';
      var gameName = data.slug && GAME_TITLES[data.slug] ? GAME_TITLES[data.slug] : 'Arcadia Session';
      subtitle = gameName + ' • ' + (data.totalXp ? Number(data.totalXp).toLocaleString() + ' Total XP' : '');
    }

    toast.innerHTML = [
      '<div class="progression-toast-icon">' + icon + '</div>',
      '<div class="progression-toast-content">',
      '  <div class="progression-toast-title">' + escapeHtml(title) + '</div>',
      '  <div class="progression-toast-sub">' + escapeHtml(subtitle) + '</div>',
      '</div>',
      '<button type="button" class="progression-toast-close" aria-label="Dismiss">&times;</button>'
    ].join('');

    var closeBtn = (typeof toast.querySelector === 'function') ? toast.querySelector('.progression-toast-close') : null;
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.add('dismissing');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }

    if (closeBtn) closeBtn.onclick = dismiss;
    toast.onclick = function (e) {
      if (e.target !== closeBtn) {
        // Clicking toast opens profile modal
        openProfile();
        dismiss();
      }
    };

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(dismiss, 4000);
  }

  /* ---------------- Helper Utilities ---------------- */

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatCategoryName(cat) {
    if (!cat) return 'General';
    if (cat === 'platform') return 'Platform';
    if (cat === 'progression') return 'Milestone';
    if (GAME_TITLES[cat]) return GAME_TITLES[cat];
    return cat.split('-').map(capitalizeFirstLetter).join(' ');
  }

  function formatDateString(isoString) {
    try {
      var d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  }

  /* ---------------- Event Listeners & Initialization ---------------- */

  function init() {
    var modal = document.getElementById(MODAL_ID);
    var navAvatar = document.getElementById('nav-avatar');
    var closeBtn = document.getElementById(CLOSE_BTN_ID);
    var backdrop = document.getElementById(BACKDROP_ID);

    // Rewire nav avatar click to open profile modal
    if (navAvatar && !navAvatar.getAttribute('data-profile-wired')) {
      navAvatar.setAttribute('data-profile-wired', 'true');
      navAvatar.addEventListener('click', function (e) {
        e.preventDefault();
        openProfile();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeProfile);
    if (backdrop) backdrop.addEventListener('click', closeProfile);

    // Keyboard ESC listener
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isModalOpen()) {
        closeProfile();
      }
    });

    // Achievement Filter Tabs delegation
    var filterTabs = document.querySelectorAll('[data-ach-tab]');
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeFilter = tab.getAttribute('data-ach-tab') || 'all';
        var engine = window.ArcadiaProgression;
        if (engine && typeof engine.getProfile === 'function') {
          renderAchievementGallery(engine.getProfile());
        }
      });
    });

    // Listen to progression events from Phase 3A engine
    if (window.ArcadiaProgression && typeof window.ArcadiaProgression.onProgressionChange === 'function') {
      window.ArcadiaProgression.onProgressionChange(function (evt) {
        if (!evt) return;

        // 1. Level-up notification
        if (evt.isLevelUp) {
          var levelInfo = window.ArcadiaProgression.getLevelInfo(evt.newTotalXp || 0);
          showProgressionNotification('level-up', {
            level: evt.level || levelInfo.level,
            rankTitle: levelInfo.rankTitle
          });
        }

        // 2. Newly unlocked achievements notifications
        if (Array.isArray(evt.unlockedAchievements) && evt.unlockedAchievements.length > 0) {
          for (var i = 0; i < evt.unlockedAchievements.length; i++) {
            showProgressionNotification('achievement', evt.unlockedAchievements[i]);
          }
        } else if (evt.xpEarned > 0 && !evt.isLevelUp) {
          // 3. XP earned notification
          showProgressionNotification('xp', {
            xp: evt.xpEarned,
            slug: evt.slug,
            totalXp: evt.newTotalXp
          });
        }

        // Re-render profile modal if currently open
        if (isModalOpen()) {
          renderProfileContent();
        }

        // Refresh nav avatar badge
        renderProfileContent();
      });
    }

    // Initial render of nav avatar badge
    renderProfileContent();
  }

  // Safe DOM ready execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public interface
  window.ArcadiaProfile = {
    open: openProfile,
    close: closeProfile,
    render: renderProfileContent,
    notify: showProgressionNotification,
    isOpen: isModalOpen
  };
})();
