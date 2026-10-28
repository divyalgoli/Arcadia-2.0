// storage.js — all localStorage reads/writes live here
const CandyStorage = (() => {
  const KEYS = {
    SETTINGS: 'ctt_settings',
    BEST_STREAK: 'ctt_best_streak',
    CURRENT_STREAK: 'ctt_current_streak',
    MATCH_CONFIG: 'ctt_match_config',
    MATCH_STATE: 'ctt_match_state',
    LAST_RESULT: 'ctt_last_result'
  };

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable, fail silently */ }
  }

  return {
    KEYS,
    get,
    set,
    getSettings: () => get(KEYS.SETTINGS, { sound: true, music: true }),
    setSettings: (s) => set(KEYS.SETTINGS, s),
    getBestStreak: () => get(KEYS.BEST_STREAK, 0),
    setBestStreak: (n) => set(KEYS.BEST_STREAK, n),
    getCurrentStreak: () => get(KEYS.CURRENT_STREAK, 0),
    setCurrentStreak: (n) => set(KEYS.CURRENT_STREAK, n),
    getMatchConfig: () => get(KEYS.MATCH_CONFIG, { mode: 'ai', difficulty: 'medium' }),
    setMatchConfig: (c) => set(KEYS.MATCH_CONFIG, c),
    getMatchState: () => get(KEYS.MATCH_STATE, null),
    setMatchState: (s) => set(KEYS.MATCH_STATE, s),
    getLastResult: () => get(KEYS.LAST_RESULT, null),
    setLastResult: (r) => set(KEYS.LAST_RESULT, r)
  };
})();
