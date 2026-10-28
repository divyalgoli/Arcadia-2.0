/**
 * game.js
 * ------------------------------------------------------------------
 * The orchestrator for game.html. Every other gameplay module
 * (player, timer, difficulty, movement, collision, scoring, powerups,
 * boss, effects) is self-contained and talks to the rest of the app
 * only through CustomEvents on `document` — this file is what wires
 * them together into an actual playable round:
 *
 *   - Boots all the managers for a fresh round.
 *   - Runs the balloon spawn loop (using DifficultyManager's config,
 *     which itself scales with the in-round level).
 *   - Wires the Pause / Restart / Settings buttons in the top bar.
 *   - Listens for `player:gameover` and `timer:ended` to end the round.
 *   - Shows the Game Over modal with the final stats and wires its
 *     Play Again / Home / Share buttons.
 *   - Pauses the round automatically while the Settings modal is open.
 * ------------------------------------------------------------------
 */


class Game {
  /**
   * @param {object} deps
   * @param {import('./storage.js').StorageManager} deps.storage
   * @param {import('./audio.js').AudioManager} deps.audio
   * @param {import('./settings.js').SettingsManager} deps.settings
   */
  constructor({ storage, audio, settings }) {
    this.storage = storage;
    this.audio = audio;
    this.settings = settings;
    this.difficulty = new DifficultyManager(settings);

    // DOM references.
    this.gameArea = document.getElementById('game-area');
    this.pauseBtn = document.getElementById('pause-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.difficultyBadge = document.getElementById('difficulty-badge');
    this.levelBadge = document.getElementById('level-badge');
    this.levelProgressFill = document.querySelector('.level-progress-fill');

    this.gameOverModal = document.getElementById('game-over-modal');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.bestComboEl = document.getElementById('best-combo');
    this.accuracyEl = document.getElementById('accuracy');
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.homeBtn = document.getElementById('home-btn');
    this.shareBtn = document.getElementById('share-score-btn');

    this.spawnTimeoutId = null;
    this.isPaused = false;
    this.isGameOver = false;
    this._pausedBySettings = false;

    // Player, TimerManager, and ScoreManager are each built to be
    // instantiated ONCE and reused across rounds via their .reset()
    // methods (ScoreManager in particular binds its own `document`
    // listeners with no matching destroy(), so recreating it on every
    // restart would stack duplicate listeners and double-count score).
    // Everything else (movement, collision, powerups, boss, effects)
    // is cheap to tear down and rebuild fresh each round instead.
    this.player = new Player(this.difficulty.getBaseConfig().startingLives, 5);
    this.timer = new TimerManager(this.difficulty.getBaseConfig().gameDurationSec);
    this.scoring = new ScoreManager(this.storage);

    this._bindEventHandlers();
  }

  // ---------------------------------------------------------------
  // Boot / teardown
  // ---------------------------------------------------------------

  /** Boots a brand-new round. Safe to call again later for Restart. */
  start() {
    this.isGameOver = false;
    this.isPaused = false;
    this._pausedBySettings = false;
    this._clearSpawnLoop();

    if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
    this._setPauseIcon(false);

    const config = this.difficulty.getConfigForLevel(1);

    // Remove any leftover balloons from a previous round before
    // building fresh managers (avoids double-counting/duplicate DOM).
    if (this.gameArea) {
      this.gameArea.querySelectorAll('.game-balloon').forEach((el) => el.remove());
    }

    this.player.reset(config.startingLives);
    this.timer.reset(config.gameDurationSec);
    this.scoring.reset();

    this.movement = new MovementController(this.gameArea);
    this.collision = new CollisionManager(this.gameArea, this.movement);
    this.powerups = new PowerupManager({
      timer: this.timer,
      scoring: this.scoring,
      player: this.player,
      movement: this.movement,
    });
    this.boss = new BossManager({ container: this.gameArea, movement: this.movement, audio: this.audio });
    this.effects = new EffectsManager(this.gameArea);

    this._updateDifficultyBadge();
    this._updateLevelUI(0);

    this.timer.start();
    this.movement.start();
    this.audio.startBackgroundMusic();

    this._scheduleNextSpawn();
  }

  /** Tears down all per-round managers (called before a restart or on game-over). */
  _teardown() {
    this._clearSpawnLoop();
    if (this.timer) this.timer.stop();
    if (this.movement) this.movement.stop();
    if (this.collision) this.collision.destroy();
    if (this.powerups) this.powerups.destroy();
    if (this.boss) this.boss.destroy();
    if (this.effects) this.effects.destroy();
  }

  // ---------------------------------------------------------------
  // Spawn loop
  // ---------------------------------------------------------------

  _scheduleNextSpawn() {
    if (this.isGameOver) return;

    const { level } = this.difficulty.getLevelProgress(this.scoring.score);
    const config = this.difficulty.getConfigForLevel(level);

    this.spawnTimeoutId = setTimeout(() => {
      if (!this.isPaused && !this.isGameOver) {
        const balloon = spawnBalloon(this.gameArea, config, this.movement.getActiveBalloons());
        this.movement.addBalloon(balloon);
        this.boss.maybeSpawnBoss(config);
      }
      this._scheduleNextSpawn();
    }, config.spawnIntervalMs);
  }

  _clearSpawnLoop() {
    if (this.spawnTimeoutId) {
      clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = null;
    }
  }

  // ---------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------

  _bindEventHandlers() {
    if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.togglePause());
    if (this.restartBtn) this.restartBtn.addEventListener('click', () => this.restart());

    if (this.playAgainBtn) this.playAgainBtn.addEventListener('click', () => {
      this.audio.playClick();
      this.restart();
    });

    if (this.shareBtn) {
      this.shareBtn.addEventListener('click', () => this._shareScore());
    }

    // Sound feedback + game-over-relevant reactions to gameplay events.
    document.addEventListener('balloon:popped', (e) => {
      const isBomb = e.detail.balloon.type.effect === 'bomb';
      if (isBomb) this.audio.playExplosion();
      else this.audio.playPop();
    });

    document.addEventListener('score:changed', (e) => {
      this._updateLevelUI(e.detail.total);
    });

    document.addEventListener('player:gameover', () => this._scheduleEndRound());
    document.addEventListener('timer:ended', () => this._scheduleEndRound());

    // Auto-pause gameplay while the shared Settings modal is open.
    document.addEventListener('settings:open', () => {
      if (this.isGameOver) return;
      this._pausedBySettings = true;
      this._pauseGameplay();
    });
    document.addEventListener('settings:close', () => {
      if (this.isGameOver) return;
      this._pausedBySettings = false;
      if (!this.isPaused) this._resumeGameplay();
    });

    // Picking a new difficulty mid-round only affects future spawns —
    // the level-scaled config is re-read on every spawn tick already.
    document.addEventListener('settings:difficultychange', () => {
      this._updateDifficultyBadge();
    });
  }

  // ---------------------------------------------------------------
  // Pause / Resume
  // ---------------------------------------------------------------

  togglePause() {
    if (this.isGameOver) return;
    this.audio.playClick();
    if (this.isPaused) {
      this.isPaused = false;
      if (!this._pausedBySettings) this._resumeGameplay();
    } else {
      this.isPaused = true;
      this._pauseGameplay();
    }
    this._setPauseIcon(this.isPaused);
  }

  _pauseGameplay() {
    if (this.timer) this.timer.pause();
    if (this.movement) this.movement.pause();
    if (this.collision) this.collision.setEnabled(false);
    this.audio.pauseBackgroundMusic();
  }

  _resumeGameplay() {
    if (this.timer) this.timer.resume();
    if (this.movement) this.movement.resume();
    if (this.collision) this.collision.setEnabled(true);
    this.audio.resumeBackgroundMusic();
  }

  _setPauseIcon(isPaused) {
    if (this.pauseBtn) this.pauseBtn.textContent = isPaused ? '▶' : '⏸';
  }

  // ---------------------------------------------------------------
  // Restart
  // ---------------------------------------------------------------

  restart() {
    this._teardown();
    this.start();
  }

  // ---------------------------------------------------------------
  // Game over
  // ---------------------------------------------------------------

  /**
   * Entry point for both `player:gameover` and `timer:ended`. Marks the
   * round over immediately (synchronously) so no further spawns/state
   * changes happen, but defers the actual teardown to a fresh task via
   * setTimeout(0).
   *
   * This matters because `player:gameover` can itself be dispatched
   * *from inside* a `balloon:popped` dispatch (Bomb Balloon -> loseLife()
   * -> gameover, all synchronous). If `_endRound()` ran immediately, its
   * `_teardown()` call would remove boss.js's and effects.js's
   * `balloon:popped` listeners while that very dispatch is still in
   * progress — per how EventTarget works, listeners removed mid-dispatch
   * are skipped for the rest of that dispatch, so the balloon that
   * ended the game would never get its pop animation or be removed
   * from the DOM. Deferring lets every listener for the triggering
   * event finish first.
   */
  _scheduleEndRound() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    setTimeout(() => this._endRound(), 0);
  }

  _endRound() {
    this._teardown(); // stops the timer/movement loops and removes collision's click listener
    this.audio.stopBackgroundMusic();

    const result = this.scoring.finalizeRound();

    if (this.finalScoreEl) this.finalScoreEl.textContent = String(result.score);
    if (this.bestScoreEl) this.bestScoreEl.textContent = String(result.highScore);
    if (this.bestComboEl) this.bestComboEl.textContent = String(result.bestCombo);
    if (this.accuracyEl) this.accuracyEl.textContent = `${result.accuracy}%`;

    if (this.gameOverModal) this.gameOverModal.classList.remove('hidden');

    if (window.Arcadia) Arcadia.submitScore('balloon-blast', 'Balloon Blast', result.score);

    if (result.isNewHighScore) {
      this.effects.celebrateWin();
      this.audio.playWinMusic();
    }
  }

  // ---------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------

  _updateDifficultyBadge() {
    if (this.difficultyBadge) this.difficultyBadge.textContent = this.difficulty.getBaseConfig().label;
  }

  _updateLevelUI(score) {
    const { level, progressPercent } = this.difficulty.getLevelProgress(score);
    if (this.levelBadge) this.levelBadge.textContent = String(level);
    if (this.levelProgressFill) this.levelProgressFill.style.width = `${progressPercent}%`;
  }

  _shareScore() {
    this.audio.playClick();
    const score = this.scoring ? this.scoring.score : 0;
    const text = `I scored ${score} points in Balloon Blast! 🎈`;

    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Score copied to clipboard!');
      }).catch(() => {
        alert(text);
      });
    } else {
      alert(text);
    }
  }
}
