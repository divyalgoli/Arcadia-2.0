/**
 * settings.js
 * ------------------------------------------------------------------
 * Controls the Settings modal (#settings-modal), which uses the exact
 * same markup on index.html and game.html. Responsibilities:
 *   - Load saved settings on page load and reflect them in the UI.
 *   - Handle Music / Sound toggles, Difficulty segments, Theme swatches,
 *     and the Reset High Score button.
 *   - Persist every change via StorageManager.
 *   - Open/close the modal (gear icon, X button, Done button, backdrop click).
 *   - Notify the rest of the app (via CustomEvents on `document`) when
 *     something changes, so game.js can react (e.g. pause while the
 *     modal is open, or pick up a new difficulty) without settings.js
 *     needing to import game.js directly.
 * ------------------------------------------------------------------
 */

class SettingsManager {
  constructor(storage, audio) {
    this.storage = storage;
    this.audio = audio;
    this.settings = storage.getSettings();
  }

  /** Call once on page load. Finds all relevant elements and wires them up. */
  init() {
    this.modal = document.getElementById('settings-modal');
    if (!this.modal) return; // Page has no settings modal at all — nothing to do.

    // The Music/Sound checkboxes have no IDs in the markup, so we grab
    // them positionally: 1st toggle in the list = Music, 2nd = Sound.
    const toggles = this.modal.querySelectorAll('.settings-list .toggle-switch input[type="checkbox"]');
    this.musicToggle = toggles[0] || null;
    this.soundToggle = toggles[1] || null;

    this.difficultySegments = this.modal.querySelectorAll('.segmented-control .segment');
    this.themeSwatches = this.modal.querySelectorAll('.theme-selector .theme-swatch');
    this.resetHighScoreBtn = document.getElementById('reset-highscore-btn');
    this.closeBtn = document.getElementById('settings-close-btn');
    this.doneBtn = document.getElementById('settings-close-bottom-btn');

    // Both pages have a button that opens the modal, just with
    // different IDs (home screen vs in-game gear icon).
    this.openBtns = [
      document.getElementById('settings-open-btn'),
      document.getElementById('game-settings-btn'),
    ].filter(Boolean);

    this._applySettingsToUI();
    this._bindEvents();
  }

  // ---------------------------------------------------------------
  // Public helpers other modules can call
  // ---------------------------------------------------------------

  /** Returns the current difficulty string: 'easy' | 'normal' | 'hard'. */
  getDifficulty() {
    return this.settings.difficulty;
  }

  /** True if the modal is currently visible. */
  isOpen() {
    return !!this.modal && !this.modal.classList.contains('hidden');
  }

  // ---------------------------------------------------------------
  // Internal: reflect saved settings in the DOM
  // ---------------------------------------------------------------

  _applySettingsToUI() {
    if (this.musicToggle) this.musicToggle.checked = this.settings.music;
    if (this.soundToggle) this.soundToggle.checked = this.settings.sound;

    this.difficultySegments.forEach((btn) => {
      btn.classList.toggle('segment--active', btn.dataset.value === this.settings.difficulty);
    });

    this.themeSwatches.forEach((swatch) => {
      const isActive = this._themeNameFromSwatch(swatch) === this.settings.theme;
      // No CSS class exists for "selected theme", so we highlight the
      // active swatch with a small inline outline instead of touching CSS.
      swatch.style.outline = isActive ? '3px solid var(--yellow, gold)' : '';
      swatch.style.outlineOffset = isActive ? '2px' : '';
    });

    // Tag <body> with the current theme so future CSS (data-theme
    // selectors) can hook into it without any JS changes needed later.
    document.body.dataset.theme = this.settings.theme;
  }

  _themeNameFromSwatch(swatch) {
    // theme-swatch--sky / theme-swatch--sunset / theme-swatch--candy
    const match = [...swatch.classList].find((c) => c.startsWith('theme-swatch--'));
    return match ? match.replace('theme-swatch--', '') : null;
  }

  // ---------------------------------------------------------------
  // Internal: event bindings
  // ---------------------------------------------------------------

  _bindEvents() {
    this.openBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.open();
      });
    });

    if (this.closeBtn) this.closeBtn.addEventListener('click', () => { this.audio.playClick(); this.close(); });
    if (this.doneBtn) this.doneBtn.addEventListener('click', () => { this.audio.playClick(); this.close(); });

    // Clicking the dimmed backdrop (but not the modal card itself) closes it.
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    if (this.musicToggle) {
      this.musicToggle.addEventListener('change', () => {
        this.audio.playClick();
        this._update({ music: this.musicToggle.checked });
        this.audio.setMusicEnabled(this.musicToggle.checked);
      });
    }

    if (this.soundToggle) {
      this.soundToggle.addEventListener('change', () => {
        this._update({ sound: this.soundToggle.checked });
        this.audio.setSoundEnabled(this.soundToggle.checked);
        this.audio.playClick(); // played after enabling, so toggling ON gives audible feedback
      });
    }

    this.difficultySegments.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        const difficulty = btn.dataset.value;
        this.difficultySegments.forEach((b) => b.classList.toggle('segment--active', b === btn));
        this._update({ difficulty });
        document.dispatchEvent(new CustomEvent('settings:difficultychange', { detail: { difficulty } }));
      });
    });

    this.themeSwatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        this.audio.playClick();
        const theme = this._themeNameFromSwatch(swatch);
        this._update({ theme });
        this._applySettingsToUI();
      });
    });

    if (this.resetHighScoreBtn) {
      this.resetHighScoreBtn.addEventListener('click', () => {
        this.audio.playClick();
        if (!confirm('Reset your high score to 0? This cannot be undone.')) return;
        this.storage.resetHighScore();
        // Both pages share the #high-score id, so update it directly
        // if it happens to be visible right now.
        const highScoreEl = document.getElementById('high-score');
        if (highScoreEl) highScoreEl.textContent = '0';
        document.dispatchEvent(new CustomEvent('settings:highscorereset'));
      });
    }
  }

  _update(partial) {
    this.settings = this.storage.saveSettings(partial);
  }

  // ---------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    document.dispatchEvent(new CustomEvent('settings:open'));
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    document.dispatchEvent(new CustomEvent('settings:close'));
  }
}