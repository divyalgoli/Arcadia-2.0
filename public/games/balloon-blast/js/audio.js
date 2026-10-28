/**
 * audio.js
 * ------------------------------------------------------------------
 * Centralized audio playback for Balloon Blast: pop sound, explosion,
 * button clicks, background music, and win music.
 *
 * IMPORTANT — audio files are NOT included in this project. Drop your
 * own files at the paths below (or edit SOUND_PATHS to match yours):
 *
 *   assets/audio/pop.mp3
 *   assets/audio/explosion.mp3
 *   assets/audio/click.mp3
 *   assets/audio/bg-music.mp3
 *   assets/audio/win-music.mp3
 *
 * Everything here fails silently (with a console warning) if a file
 * is missing, so a missing sound file will never crash the game.
 * ------------------------------------------------------------------
 */

const SOUND_PATHS = {
  pop: 'assets/audio/pop.mp3',
  explosion: 'assets/audio/explosion.mp3',
  click: 'assets/audio/click.mp3',
  bgMusic: 'assets/audio/bg-music.mp3',
  winMusic: 'assets/audio/win-music.mp3',
};

class AudioManager {
  constructor(storage) {
    this.storage = storage;
    this.settings = storage.getSettings();

    // Most browsers block audio from playing before the user has
    // interacted with the page at all. We queue background music
    // requests until that first interaction happens.
    this.unlocked = false;
    this._pendingMusic = false;

    // Short, potentially-overlapping sound effects. Each is a
    // "template" Audio element — we clone it on every play so rapid
    // pops don't cut each other off.
    this.sfx = {
      pop: this._createAudio(SOUND_PATHS.pop),
      explosion: this._createAudio(SOUND_PATHS.explosion),
      click: this._createAudio(SOUND_PATHS.click),
    };

    // Long-running single-instance tracks.
    this.bgMusic = this._createAudio(SOUND_PATHS.bgMusic, { loop: true });
    this.winMusic = this._createAudio(SOUND_PATHS.winMusic, { loop: false });

    this._applyVolumes();
    this._bindUnlockListener();
  }

  // ---------------------------------------------------------------
  // Setup helpers
  // ---------------------------------------------------------------

  _createAudio(src, { loop = false } = {}) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.preload = 'auto';
    // Log once if the file 404s / fails to decode, but never throw.
    audio.addEventListener('error', () => {
      console.warn(`Balloon Blast: audio file failed to load: ${src}`);
    }, { once: true });
    return audio;
  }

  /** The first click/keydown anywhere "unlocks" audio for the session. */
  _bindUnlockListener() {
    const unlock = () => {
      this.unlocked = true;
      if (this._pendingMusic) {
        this._pendingMusic = false;
        this.startBackgroundMusic();
      }
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  _applyVolumes() {
    const vol = this.settings.volume;
    Object.values(this.sfx).forEach((a) => { a.volume = vol; });
    this.bgMusic.volume = vol;
    this.winMusic.volume = vol;
  }

  // ---------------------------------------------------------------
  // Sound effects
  // ---------------------------------------------------------------

  /** Plays a short sound effect by name ('pop' | 'explosion' | 'click'). */
  _playSfx(name) {
    if (!this.settings.sound) return;
    const template = this.sfx[name];
    if (!template) return;

    // Clone so overlapping plays (e.g. two quick pops) don't cut off.
    const instance = template.cloneNode(true);
    instance.volume = template.volume;
    instance.play().catch(() => {
      // Autoplay blocked or file missing — fail silently, game continues.
    });
  }

  playPop() { this._playSfx('pop'); }
  playExplosion() { this._playSfx('explosion'); }
  playClick() { this._playSfx('click'); }
  /** Boss balloons reuse the pop sound for each hit — keeps asset list small. */
  playBossHit() { this._playSfx('pop'); }

  // ---------------------------------------------------------------
  // Music
  // ---------------------------------------------------------------

  startBackgroundMusic() {
    if (!this.settings.music) return;
    if (!this.unlocked) {
      this._pendingMusic = true; // try again after first user interaction
      return;
    }
    this.winMusic.pause();
    this.bgMusic.currentTime = 0;
    this.bgMusic.play().catch(() => {});
  }

  stopBackgroundMusic() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }

  pauseBackgroundMusic() {
    this.bgMusic.pause();
  }

  resumeBackgroundMusic() {
    if (!this.settings.music || !this.unlocked) return;
    this.bgMusic.play().catch(() => {});
  }

  /** Plays the win/celebration jingle once, pausing background music for it. */
  playWinMusic() {
    if (!this.settings.music) return;
    this.stopBackgroundMusic();
    this.winMusic.currentTime = 0;
    this.winMusic.play().catch(() => {});
  }

  // ---------------------------------------------------------------
  // Settings hooks (called by settings.js)
  // ---------------------------------------------------------------

  setMusicEnabled(enabled) {
    this.settings.music = enabled;
    if (enabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
      this.winMusic.pause();
    }
  }

  setSoundEnabled(enabled) {
    this.settings.sound = enabled;
  }

  /** Sets and persists master volume (0.0 - 1.0) for every track. */
  setVolume(volume) {
    const clamped = Math.min(1, Math.max(0, volume));
    this.settings = this.storage.saveSettings({ volume: clamped });
    this._applyVolumes();
  }
}