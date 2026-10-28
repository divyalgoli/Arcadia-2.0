/**
 * main.js
 * ------------------------------------------------------------------
 * Entry point for Balloon Blast.
 *
 * Architecture: this is a MULTI-PAGE app.
 *   - index.html  -> Home screen (menu, settings, exit)
 *   - game.html   -> Gameplay screen (balloons, scoring, timer, result)
 *
 * Both pages load this SAME file via:
 *   <script type="module" src="js/main.js"></script>
 *
 * main.js detects which page it's on by checking for #home-screen
 * (only present in index.html). Everything page-specific is wired
 * up here; the heavy gameplay logic lives in game.js and is only
 * instantiated when we're actually on game.html.
 * ------------------------------------------------------------------
 */


class App {
  constructor() {
    // Core services needed on every page.
    this.storage = new StorageManager();
    this.audio = new AudioManager(this.storage);
    this.settings = new SettingsManager(this.storage, this.audio);

    // Page detection.
    this.isHomePage = !!document.getElementById('home-screen');
    this.isGamePage = !this.isHomePage && !!document.getElementById('game-screen');

    this.loadingOverlay = document.getElementById('loading-overlay');
  }

  /** Boots the app once the DOM is ready. */
  init() {
    // Settings modal markup/behaviour is identical on both pages,
    // so it's always safe to initialize.
    this.settings.init();

    if (this.isHomePage) {
      this.initHomePage();
    } else if (this.isGamePage) {
      this.initGamePage();
    }
  }

  /** Wires up the home screen menu (index.html). */
  initHomePage() {
    const playBtn = document.getElementById('play-btn');
    const exitBtn = document.getElementById('exit-btn');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.audio.playClick();
        this.showLoading('Loading game...');
        // Small delay so the loading spinner + click sound are felt
        // before the browser navigates away.
        setTimeout(() => {
          window.location.href = 'game.html';
        }, 350);
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.audio.playClick();
        window.location.href = '../../index.html';
      });
    }
  }

  /** Boots the actual gameplay (game.html). */
  initGamePage() {
    this.game = new Game({
      storage: this.storage,
      audio: this.audio,
      settings: this.settings,
    });
    this.game.start();
  }

  /** Shows the shared loading overlay with an optional message. */
  showLoading(text) {
    if (!this.loadingOverlay) return;
    const label = this.loadingOverlay.querySelector('.loading-text');
    if (label && text) label.textContent = text;
    this.loadingOverlay.classList.remove('hidden');
  }

  /** Hides the shared loading overlay. */
  hideLoading() {
    if (this.loadingOverlay) this.loadingOverlay.classList.add('hidden');
  }
}

// Boot once the DOM is parsed.
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
