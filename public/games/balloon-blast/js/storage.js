/**
 * storage.js
 * ------------------------------------------------------------------
 * Single source of truth for everything persisted to Local Storage:
 *   - High Score
 *   - Best Combo
 *   - Settings (music, sound, difficulty, theme, volume)
 *
 * Every other module talks to localStorage ONLY through this class,
 * so key names, JSON parsing, and error handling live in one place.
 * ------------------------------------------------------------------
 */

const STORAGE_PREFIX = 'balloonBlast_';

const KEYS = {
  HIGH_SCORE: `${STORAGE_PREFIX}highScore`,
  BEST_COMBO: `${STORAGE_PREFIX}bestCombo`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
};

// Defaults used the very first time the game runs, or if saved
// settings are ever missing/corrupted.
const DEFAULT_SETTINGS = {
  music: true,
  sound: true,
  difficulty: 'normal', // 'easy' | 'normal' | 'hard'
  theme: 'sky',         // 'sky' | 'sunset' | 'candy'
  volume: 0.8,          // 0.0 - 1.0
};

class StorageManager {
  constructor() {
    // Some environments (private browsing, disabled storage) throw
    // when touching localStorage at all. We detect that once up
    // front so every call afterward can fail gracefully.
    this.available = this._checkAvailability();
  }

  _checkAvailability() {
    try {
      const testKey = `${STORAGE_PREFIX}__test__`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      console.warn('Balloon Blast: Local Storage unavailable, progress will not be saved.', err);
      return false;
    }
  }

  /** Low-level safe read. Returns null if missing/unavailable. */
  _read(key) {
    if (!this.available) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  /** Low-level safe write. Silently no-ops if storage is unavailable. */
  _write(key, value) {
    if (!this.available) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn('Balloon Blast: failed to save to Local Storage.', err);
    }
  }

  // ---------------------------------------------------------------
  // High Score
  // ---------------------------------------------------------------

  /** Returns the saved high score (0 if none yet). */
  getHighScore() {
    const raw = this._read(KEYS.HIGH_SCORE);
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  }

  /**
   * Saves `score` as the new high score ONLY if it beats the current one.
   * Returns true if a new high score was set.
   */
  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      this._write(KEYS.HIGH_SCORE, String(score));
      return true;
    }
    return false;
  }

  /** Resets the high score back to 0 (used by the Settings "Reset" button). */
  resetHighScore() {
    this._write(KEYS.HIGH_SCORE, '0');
  }

  // ---------------------------------------------------------------
  // Best Combo
  // ---------------------------------------------------------------

  getBestCombo() {
    const raw = this._read(KEYS.BEST_COMBO);
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  }

  /** Saves `combo` as the new best combo only if it beats the current one. */
  setBestCombo(combo) {
    const current = this.getBestCombo();
    if (combo > current) {
      this._write(KEYS.BEST_COMBO, String(combo));
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------

  /** Returns the full settings object, merged with defaults so new
   *  keys added later never come back as `undefined`. */
  getSettings() {
    const raw = this._read(KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (err) {
      console.warn('Balloon Blast: saved settings were corrupted, resetting to defaults.', err);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Merges `partialSettings` into the existing saved settings and persists
   * the result. Returns the full merged settings object.
   */
  saveSettings(partialSettings) {
    const merged = { ...this.getSettings(), ...partialSettings };
    this._write(KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  }
}