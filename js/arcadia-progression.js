/**
 * ARCADIA 2.0 — Central Player Progression Engine (Phase 3A)
 * ------------------------------------------------------------------
 * Centralized, dependency-free XP, leveling, and achievement engine.
 * Handles:
 *   - Deterministic XP awards based on verified gameplay
 *   - Provisional XP curve and level thresholds (Levels 1 to 50+)
 *   - Anti-abuse: session ceilings, cooldowns, and daily caps
 *   - Duplicate submission protection
 *   - Fault-tolerant storage with in-memory fallback if localStorage is disabled
 *   - Safe normalization against corrupted / invalid stored data
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  // Prevent re-initialization if script is loaded multiple times
  if (typeof window !== 'undefined' && window.ArcadiaProgression) {
    return;
  }

  var GUEST_STORAGE_KEY = 'arcadia_guest_progression';
  var activeUserUid = null;

  function getActiveStorageKey() {
    if (activeUserUid) {
      return 'arcadia_user_cache_' + activeUserUid;
    }
    return GUEST_STORAGE_KEY;
  }

  // Anti-abuse limits
  var MAX_SESSION_XP = 200;       // Hard cap on XP awarded from a single game session
  var MAX_DAILY_XP = 2500;        // Hard cap on total XP earned per 24-hour day
  var COOLDOWN_MS = 15000;        // 15 seconds minimum elapsed between session awards for the same game
  var MIN_SESSION_DURATION_MS = 10000; // 10 seconds minimum between any session records across the platform

  // In-memory fallback if localStorage is restricted (private browsing, disabled storage)
  var inMemoryStore = {};

  // Registered progression listeners
  var listeners = [];

  function safeGet(key, fallback) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) {
        return inMemoryStore[key] || fallback;
      }
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === 'object' ? parsed : fallback;
    } catch (e) {
      return inMemoryStore[key] || fallback;
    }
  }

  function safeSet(key, value) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      inMemoryStore[key] = value;
    } catch (e) {
      inMemoryStore[key] = value;
    }
  }

  function getTodayDateString() {
    var now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
  }

  function defaultProfile() {
    return {
      xp: 0,
      achievements: [],
      stats: {
        sessionsPlayed: 0,
        lastPlayed: null,
        favoriteGame: null,
        gamesPlayedCount: {}
      },
      daily: {
        date: getTodayDateString(),
        xp: 0
      },
      lastAwardedAt: {}, // map of slug -> timestamp
      lastGlobalAwardedAt: 0
    };
  }

  function sanitizeProfile(data) {
    if (!data || typeof data !== 'object') {
      return defaultProfile();
    }

    var xp = typeof data.xp === 'number' && isFinite(data.xp) && data.xp >= 0 ? Math.floor(data.xp) : 0;

    var achievements = [];
    if (Array.isArray(data.achievements)) {
      for (var i = 0; i < data.achievements.length; i++) {
        var item = data.achievements[i];
        if (typeof item === 'string' && item.trim().length > 0) {
          achievements.push({ id: item.trim(), unlockedAt: new Date().toISOString() });
        } else if (item && typeof item === 'object' && typeof item.id === 'string' && item.id.trim().length > 0) {
          achievements.push({
            id: item.id.trim(),
            unlockedAt: typeof item.unlockedAt === 'string' ? item.unlockedAt : new Date().toISOString()
          });
        }
      }
    }

    var stats = data.stats && typeof data.stats === 'object' ? data.stats : {};
    var sessionsPlayed = typeof stats.sessionsPlayed === 'number' && stats.sessionsPlayed >= 0 ? stats.sessionsPlayed : 0;
    var gamesPlayedCount = {};
    if (stats.gamesPlayedCount && typeof stats.gamesPlayedCount === 'object') {
      for (var k in stats.gamesPlayedCount) {
        if (Object.prototype.hasOwnProperty.call(stats.gamesPlayedCount, k)) {
          var count = stats.gamesPlayedCount[k];
          if (typeof count === 'number' && count >= 0) {
            gamesPlayedCount[k] = Math.floor(count);
          }
        }
      }
    }

    var daily = data.daily && typeof data.daily === 'object' ? data.daily : {};
    var todayStr = getTodayDateString();
    var dailyDate = typeof daily.date === 'string' ? daily.date : todayStr;
    var dailyXp = typeof daily.xp === 'number' && daily.xp >= 0 ? Math.floor(daily.xp) : 0;

    // Reset daily if date has rolled over
    if (dailyDate !== todayStr) {
      dailyDate = todayStr;
      dailyXp = 0;
    }

    var lastAwardedAt = {};
    if (data.lastAwardedAt && typeof data.lastAwardedAt === 'object') {
      for (var s in data.lastAwardedAt) {
        if (Object.prototype.hasOwnProperty.call(data.lastAwardedAt, s)) {
          var ts = data.lastAwardedAt[s];
          if (typeof ts === 'number' && ts > 0) {
            lastAwardedAt[s] = ts;
          }
        }
      }
    }

    return {
      xp: xp,
      achievements: achievements,
      stats: {
        sessionsPlayed: sessionsPlayed,
        lastPlayed: typeof stats.lastPlayed === 'string' ? stats.lastPlayed : null,
        favoriteGame: typeof stats.favoriteGame === 'string' ? stats.favoriteGame : null,
        gamesPlayedCount: gamesPlayedCount
      },
      daily: {
        date: dailyDate,
        xp: dailyXp
      },
      lastAwardedAt: lastAwardedAt,
      lastGlobalAwardedAt: typeof data.lastGlobalAwardedAt === 'number' && data.lastGlobalAwardedAt > 0 ? data.lastGlobalAwardedAt : 0
    };
  }

  /* ---------------- Level Curve & Rank Titles ---------------- */
  var LEVEL_TITLES = [
    { minLevel: 1, title: 'Rookie', tier: 'bronze' },
    { minLevel: 3, title: 'Challenger', tier: 'bronze' },
    { minLevel: 5, title: 'Contender', tier: 'silver' },
    { minLevel: 8, title: 'Arcade Knight', tier: 'silver' },
    { minLevel: 12, title: 'Veteran', tier: 'gold' },
    { minLevel: 16, title: 'Champion', tier: 'platinum' },
    { minLevel: 20, title: 'Master', tier: 'amethyst' },
    { minLevel: 25, title: 'Legend', tier: 'legend' }
  ];

  function getLevelThreshold(level) {
    if (level <= 1) return 0;
    // Cumulative curve: 300 * (level - 1)^1.5 rounded down
    return Math.floor(300 * Math.pow(level - 1, 1.5));
  }

  function getLevelInfo(totalXp) {
    totalXp = Math.max(0, Math.floor(totalXp || 0));
    var level = 1;
    while (getLevelThreshold(level + 1) <= totalXp && level < 100) {
      level++;
    }
    var currentBase = getLevelThreshold(level);
    var nextThreshold = getLevelThreshold(level + 1);
    var levelSpan = nextThreshold - currentBase;
    var currentProgress = totalXp - currentBase;
    var percent = levelSpan > 0 ? Math.min(100, Math.floor((currentProgress / levelSpan) * 100)) : 100;

    var titleObj = LEVEL_TITLES[0];
    for (var i = 0; i < LEVEL_TITLES.length; i++) {
      if (level >= LEVEL_TITLES[i].minLevel) {
        titleObj = LEVEL_TITLES[i];
      }
    }

    return {
      level: level,
      totalXp: totalXp,
      currentBaseXp: currentBase,
      nextLevelXp: nextThreshold,
      levelProgressXp: currentProgress,
      levelRequiredXp: levelSpan,
      progressPercent: percent,
      rankTitle: titleObj.title,
      title: titleObj.title,
      badgeTier: titleObj.tier
    };
  }

  /* ---------------- Initial Achievement Catalog ---------------- */
  var ACHIEVEMENTS = [
    {
      id: 'FIRST_STEPS',
      title: 'First Steps',
      description: 'Complete your first game session on Arcadia',
      xpReward: 50,
      icon: '🎮',
      category: 'platform'
    },
    {
      id: 'ALL_ROUNDER',
      title: 'Arcade Explorer',
      description: 'Play at least 5 different games on Arcadia',
      xpReward: 150,
      icon: '🧭',
      category: 'platform'
    },
    {
      id: 'PLATFORM_MASTER',
      title: 'Master of All',
      description: 'Play all 10 Arcadia games',
      xpReward: 300,
      icon: '🌟',
      category: 'platform'
    },
    {
      id: 'CENTURION',
      title: 'Arcade Fiend',
      description: 'Complete 50 total game sessions',
      xpReward: 500,
      icon: '💯',
      category: 'platform'
    },
    {
      id: 'LEVEL_FIVE',
      title: 'Arcade Knight',
      description: 'Reach Level 5 in player progression',
      xpReward: 200,
      icon: '⚔️',
      category: 'progression'
    },
    {
      id: 'LEVEL_TEN',
      title: 'Decathlon Champion',
      description: 'Reach Level 10 in player progression',
      xpReward: 300,
      icon: '🏆',
      category: 'progression'
    },
    // Game specific achievements
    {
      id: 'PP_SHUTOUT',
      title: 'Table Domination',
      description: 'Win a Ping Pong match by a margin of 7 or more',
      xpReward: 100,
      icon: '🏓',
      category: 'ping-pong'
    },
    {
      id: 'BB_POPMCA',
      title: 'Balloon Popper',
      description: 'Score 1,000+ points in Balloon Blast',
      xpReward: 100,
      icon: '🎈',
      category: 'balloon-blast'
    },
    {
      id: 'BB_COMBO',
      title: 'Combo King',
      description: 'Score 3,000+ points in Balloon Blast',
      xpReward: 150,
      icon: '💥',
      category: 'balloon-blast'
    },
    {
      id: 'MC_PERFECT',
      title: 'Photographic Mind',
      description: 'Achieve a score of 1,400+ in Memory Card',
      xpReward: 150,
      icon: '🧠',
      category: 'memory-card'
    },
    {
      id: 'PTA_CHAMP',
      title: 'Tag Champion',
      description: 'Win a full 5-round Paint Tag Arena match',
      xpReward: 100,
      icon: '🎨',
      category: 'paint-tag-arena'
    },
    {
      id: 'TTT_STREAK5',
      title: 'Sugar Rush',
      description: 'Reach a win streak of 5 in Candyland Tic-Tac-Toe',
      xpReward: 150,
      icon: '🍬',
      category: 'tic-tac-toe-candyland'
    },
    {
      id: 'FS_SURVIVOR',
      title: 'Ninja Reflexes',
      description: 'Score 200+ in Fruit Slash Survival Mode',
      xpReward: 100,
      icon: '🍉',
      category: 'fruit-slash'
    },
    {
      id: 'FS_TIMECUT',
      title: 'Speed Slicer',
      description: 'Score 150+ in Fruit Slash Time Attack Mode',
      xpReward: 100,
      icon: '⏱️',
      category: 'fruit-slash'
    },
    {
      id: 'SS_FLIGHT',
      title: 'Skyward Ace',
      description: 'Clear 20 obstacles in Superman Swing',
      xpReward: 100,
      icon: '🦸',
      category: 'superman-swing'
    },
    {
      id: 'TW_TACTICIAN',
      title: 'Desert Victor',
      description: 'Complete a local Tank Wars battle',
      xpReward: 80,
      icon: '🛡️',
      category: 'tank-wars'
    },
    {
      id: 'OUT_ESCAPE',
      title: 'Master Escapee',
      description: 'Reach Level 5 in Outbound',
      xpReward: 120,
      icon: '🏹',
      category: 'outbound'
    },
    {
      id: 'GR_RUNNER',
      title: 'Gravity Defier',
      description: 'Win 2 or more rounds in a Gravity Run match',
      xpReward: 80,
      icon: '🦖',
      category: 'gravity-run'
    }
  ];

  /* ---------------- Core Engine ---------------- */
  function loadRawProfile() {
    var raw = safeGet(getActiveStorageKey(), null);
    return sanitizeProfile(raw);
  }

  function saveRawProfile(profile) {
    safeSet(getActiveStorageKey(), profile);
  }

  function setActiveUser(uid) {
    activeUserUid = uid || null;
    emitProgressionEvent({ type: 'user_switched', uid: activeUserUid });
  }

  function getActiveUser() {
    return activeUserUid;
  }

  function getProfile() {
    var profile = loadRawProfile();
    var levelInfo = getLevelInfo(profile.xp);

    // Compute favorite game
    var favorite = null;
    var maxCount = 0;
    for (var slug in profile.stats.gamesPlayedCount) {
      if (profile.stats.gamesPlayedCount[slug] > maxCount) {
        maxCount = profile.stats.gamesPlayedCount[slug];
        favorite = slug;
      }
    }

    return {
      xp: profile.xp,
      totalXp: profile.xp,
      level: levelInfo.level,
      currentBaseXp: levelInfo.currentBaseXp,
      nextLevelXp: levelInfo.nextLevelXp,
      levelProgressXp: levelInfo.levelProgressXp,
      levelRequiredXp: levelInfo.levelRequiredXp,
      progressPercent: levelInfo.progressPercent,
      rankTitle: levelInfo.rankTitle,
      title: levelInfo.rankTitle,
      badgeTier: levelInfo.badgeTier,
      achievements: profile.achievements.slice(),
      unlockedAchievements: profile.achievements.slice(),
      stats: {
        sessionsPlayed: profile.stats.sessionsPlayed,
        lastPlayed: profile.stats.lastPlayed,
        favoriteGame: favorite,
        gamesPlayedCount: Object.assign({}, profile.stats.gamesPlayedCount)
      },
      daily: {
        date: profile.daily.date,
        xp: profile.daily.xp,
        remainingXp: Math.max(0, MAX_DAILY_XP - profile.daily.xp)
      }
    };
  }

  function getAchievementsCatalog() {
    var profile = loadRawProfile();
    var unlockedMap = {};
    for (var i = 0; i < profile.achievements.length; i++) {
      unlockedMap[profile.achievements[i].id] = profile.achievements[i].unlockedAt;
    }

    return ACHIEVEMENTS.map(function (item) {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        xpReward: item.xpReward,
        icon: item.icon,
        category: item.category,
        unlocked: !!unlockedMap[item.id],
        unlockedAt: unlockedMap[item.id] || null
      };
    });
  }

  function emitProgressionEvent(event) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](event);
      } catch (err) {
        console.warn('[ArcadiaProgression] Listener error:', err);
      }
    }
  }

  /* ---------------- Deterministic Score Performance Evaluation ---------------- */
  function calculateSessionXp(slug, score) {
    var baseXP = 40; // Base completion XP for any game
    var performanceXP = 0;

    score = typeof score === 'number' && isFinite(score) ? score : 0;

    switch (slug) {
      case 'ping-pong':
      case 'ping-pong-v2':
        // score is winning margin (1-11)
        if (score >= 7) performanceXP = 60;
        else if (score >= 4) performanceXP = 40;
        else if (score >= 1) performanceXP = 20;
        break;

      case 'balloon-blast':
        if (score >= 2000) performanceXP = 70;
        else if (score >= 800) performanceXP = 40;
        else if (score >= 200) performanceXP = 20;
        break;

      case 'memory-card':
        if (score >= 1400) performanceXP = 70;
        else if (score >= 1000) performanceXP = 40;
        else if (score >= 400) performanceXP = 20;
        break;

      case 'paint-tag-arena':
        if (score >= 5) performanceXP = 70;
        else if (score >= 3) performanceXP = 40;
        else if (score >= 1) performanceXP = 20;
        break;

      case 'tic-tac-toe-candyland':
        if (score >= 5) performanceXP = 70;
        else if (score >= 3) performanceXP = 40;
        else if (score >= 1) performanceXP = 20;
        break;

      case 'fruit-slash':
      case 'fruit-slash-survival':
      case 'fruit-slash-time-attack':
        if (score >= 300) performanceXP = 70;
        else if (score >= 150) performanceXP = 40;
        else if (score >= 50) performanceXP = 20;
        break;

      case 'superman-swing':
        if (score >= 20) performanceXP = 70;
        else if (score >= 10) performanceXP = 40;
        else if (score >= 3) performanceXP = 20;
        break;

      case 'outbound':
        if (score >= 5) performanceXP = 70;
        else if (score >= 3) performanceXP = 40;
        else if (score >= 1) performanceXP = 20;
        break;

      case 'gravity-run':
        if (score >= 3) performanceXP = 60;
        else if (score >= 2) performanceXP = 40;
        else if (score >= 1) performanceXP = 20;
        break;

      case 'tank-wars':
        performanceXP = 30;
        break;

      default:
        if (score > 0) performanceXP = 20;
        break;
    }

    var totalSessionXp = baseXP + performanceXP;
    // Strict clamp per session
    return Math.min(MAX_SESSION_XP, totalSessionXp);
  }

  /* ---------------- Achievement Checking Rules ---------------- */
  function evaluateAchievements(profile, slug, score) {
    var newAchievements = [];
    var existingUnlocked = {};
    for (var i = 0; i < profile.achievements.length; i++) {
      existingUnlocked[profile.achievements[i].id] = true;
    }

    function check(id, condition) {
      if (!existingUnlocked[id] && condition) {
        var catalogItem = ACHIEVEMENTS.find(function (a) { return a.id === id; });
        var nowStr = new Date().toISOString();
        var entry = { id: id, unlockedAt: nowStr };
        profile.achievements.push(entry);
        existingUnlocked[id] = true;
        newAchievements.push(Object.assign({}, catalogItem, entry));
      }
    }

    // Platform achievements
    check('FIRST_STEPS', profile.stats.sessionsPlayed >= 1);
    var distinctGamesCount = Object.keys(profile.stats.gamesPlayedCount).length;
    check('ALL_ROUNDER', distinctGamesCount >= 5);
    check('PLATFORM_MASTER', distinctGamesCount >= 10);
    check('CENTURION', profile.stats.sessionsPlayed >= 50);

    // Level checks
    var currentLevel = getLevelInfo(profile.xp).level;
    check('LEVEL_FIVE', currentLevel >= 5);
    check('LEVEL_TEN', currentLevel >= 10);

    // Game specific checks
    if (slug === 'ping-pong-v2' || slug === 'ping-pong') {
      check('PP_SHUTOUT', score >= 7);
    } else if (slug === 'balloon-blast') {
      check('BB_POPMCA', score >= 1000);
      check('BB_COMBO', score >= 3000);
    } else if (slug === 'memory-card') {
      check('MC_PERFECT', score >= 1400);
    } else if (slug === 'paint-tag-arena') {
      check('PTA_CHAMP', score >= 5);
    } else if (slug === 'tic-tac-toe-candyland') {
      check('TTT_STREAK5', score >= 5);
    } else if (slug === 'fruit-slash-survival' || slug === 'fruit-slash') {
      check('FS_SURVIVOR', score >= 200);
    } else if (slug === 'fruit-slash-time-attack') {
      check('FS_TIMECUT', score >= 150);
    } else if (slug === 'superman-swing') {
      check('SS_FLIGHT', score >= 20);
    } else if (slug === 'tank-wars') {
      check('TW_TACTICIAN', true);
    } else if (slug === 'outbound') {
      check('OUT_ESCAPE', score >= 5);
    } else if (slug === 'gravity-run') {
      check('GR_RUNNER', score >= 2);
    }

    return newAchievements;
  }

  /* ---------------- Record Game Session / Score Event ---------------- */
  function recordGameSession(slug, options) {
    if (!slug || typeof slug !== 'string') {
      return { awarded: false, reason: 'invalid-slug', xpEarned: 0 };
    }

    options = options || {};
    var score = typeof options.score === 'number' ? options.score : 0;
    var now = Date.now();
    var profile = loadRawProfile();

    // 1. Anti-abuse: Cooldown check for the same game slug
    var lastAwarded = profile.lastAwardedAt[slug] || 0;
    if (now - lastAwarded < COOLDOWN_MS) {
      return {
        awarded: false,
        reason: 'cooldown-active',
        cooldownActive: true,
        cooldownRemainingMs: COOLDOWN_MS - (now - lastAwarded),
        xpEarned: 0
      };
    }

    // Platform-wide minimum session duration check (spam protection across different games)
    var lastGlobalAwarded = profile.lastGlobalAwardedAt || 0;
    if (now - lastGlobalAwarded < MIN_SESSION_DURATION_MS) {
      return {
        awarded: false,
        reason: 'platform-cooldown-active',
        cooldownActive: true,
        cooldownRemainingMs: MIN_SESSION_DURATION_MS - (now - lastGlobalAwarded),
        xpEarned: 0
      };
    }

    // 2. Anti-abuse: Daily Cap check
    var dailyRemaining = Math.max(0, MAX_DAILY_XP - profile.daily.xp);
    if (dailyRemaining <= 0) {
      return {
        awarded: false,
        reason: 'daily-cap-reached',
        dailyCapReached: true,
        xpEarned: 0
      };
    }

    // 3. Calculate Session XP
    var rawEarnedXp = calculateSessionXp(slug, score);
    var actualXpAwarded = Math.min(rawEarnedXp, dailyRemaining);

    var prevLevel = getLevelInfo(profile.xp).level;

    // Apply awards
    profile.xp += actualXpAwarded;
    profile.daily.xp += actualXpAwarded;
    profile.lastAwardedAt[slug] = now;
    profile.lastGlobalAwardedAt = now;

    // Update stats
    profile.stats.sessionsPlayed += 1;
    profile.stats.lastPlayed = new Date().toISOString();
    profile.stats.gamesPlayedCount[slug] = (profile.stats.gamesPlayedCount[slug] || 0) + 1;

    // Evaluate achievements
    var unlockedAchievements = evaluateAchievements(profile, slug, score);

    // Add achievement XP if any were unlocked (also subject to daily cap)
    for (var a = 0; a < unlockedAchievements.length; a++) {
      var achXp = unlockedAchievements[a].xpReward || 0;
      var curDailyRemaining = Math.max(0, MAX_DAILY_XP - profile.daily.xp);
      var achXpAwarded = Math.min(achXp, curDailyRemaining);
      profile.xp += achXpAwarded;
      profile.daily.xp += achXpAwarded;
      actualXpAwarded += achXpAwarded;
    }

    var newLevelInfo = getLevelInfo(profile.xp);
    var isLevelUp = newLevelInfo.level > prevLevel;

    // Persist
    saveRawProfile(profile);

    var isDailyCapReached = profile.daily.xp >= MAX_DAILY_XP;

    // Emit events
    var eventResult = {
      awarded: true,
      slug: slug,
      xpEarned: actualXpAwarded,
      sessionXp: rawEarnedXp,
      newTotalXp: profile.xp,
      level: newLevelInfo.level,
      isLevelUp: isLevelUp,
      cooldownActive: false,
      dailyCapReached: isDailyCapReached,
      unlockedAchievements: unlockedAchievements
    };

    emitProgressionEvent(eventResult);

    return eventResult;
  }

  function recordScoreEvent(slug, title, score) {
    // Adapter called by Arcadia.submitScore
    return recordGameSession(slug, { score: score, title: title });
  }

  function onProgressionChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
      return function unsubscribe() {
        var idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }
    return function () {};
  }

  function resetProgression() {
    safeSet(getActiveStorageKey(), defaultProfile());
    emitProgressionEvent({ type: 'reset' });
  }

  // Export globally
  var ArcadiaProgression = {
    getProfile: getProfile,
    getLevelInfo: getLevelInfo,
    getLevelThreshold: getLevelThreshold,
    getAchievements: getAchievementsCatalog,
    recordGameSession: recordGameSession,
    recordScoreEvent: recordScoreEvent,
    onProgressionChange: onProgressionChange,
    resetProgression: resetProgression,
    setActiveUser: setActiveUser,
    getActiveUser: getActiveUser,
    // Configuration constants for testing and transparency
    CONSTANTS: {
      MAX_SESSION_XP: MAX_SESSION_XP,
      MAX_DAILY_XP: MAX_DAILY_XP,
      COOLDOWN_MS: COOLDOWN_MS
    }
  };

  window.ArcadiaProgression = ArcadiaProgression;

  // Auto-connect to window.Arcadia if loaded
  if (window.Arcadia && typeof window.Arcadia === 'object') {
    try {
      if (window.Arcadia.progression !== ArcadiaProgression) {
        window.Arcadia.progression = ArcadiaProgression;
      }
    } catch (e) {
      // Ignored if window.Arcadia exposes progression via getter
    }
  }
})();
