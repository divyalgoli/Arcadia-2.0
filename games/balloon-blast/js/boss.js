/**
 * boss.js
 * ------------------------------------------------------------------
 * Decides WHEN a Boss Balloon appears and reacts to what happens to
 * it. Actual balloon creation is delegated to spawnBossBalloon() in
 * balloons.js; hit detection is handled generically by collision.js
 * (Boss Balloons already support multi-hit via Balloon.registerHit()).
 *
 * Only one Boss Balloon is ever allowed on screen at a time.
 * ------------------------------------------------------------------
 */


class BossManager {
  /**
   * @param {object} deps
   * @param {HTMLElement} deps.container - #game-area
   * @param {import('./movement.js').MovementController} deps.movement
   * @param {import('./audio.js').AudioManager} deps.audio
   */
  constructor({ container, movement, audio }) {
    this.container = container;
    this.movement = movement;
    this.audio = audio;
    this.activeBoss = null; // the current Boss Balloon instance, or null if none alive

    this._onHit = this._onHit.bind(this);
    this._onPopped = this._onPopped.bind(this);
    this._onMissed = this._onMissed.bind(this);
    document.addEventListener('balloon:hit', this._onHit);
    document.addEventListener('balloon:popped', this._onPopped);
    document.addEventListener('balloon:missed', this._onMissed);
  }

  /** Stops listening (round teardown). */
  destroy() {
    document.removeEventListener('balloon:hit', this._onHit);
    document.removeEventListener('balloon:popped', this._onPopped);
    document.removeEventListener('balloon:missed', this._onMissed);
  }

  /** Clears boss tracking for a fresh round (Restart / Play Again). */
  reset() {
    this.activeBoss = null;
  }

  /**
   * Called by game.js on every spawn tick, right alongside the normal
   * balloon spawn roll. Rolls `config.bossSpawnChance` and spawns a
   * Boss Balloon if none is currently active.
   *
   * @param {object} config - result of DifficultyManager.getConfigForLevel()
   */
  maybeSpawnBoss(config) {
    if (this.activeBoss) return; // never more than one at a time
    if (Math.random() >= config.bossSpawnChance) return;

    const boss = spawnBossBalloon(this.container, config, this.movement.getActiveBalloons());
    this.movement.addBalloon(boss);
    this.activeBoss = boss;

    document.dispatchEvent(new CustomEvent('boss:spawned', { detail: { boss } }));
  }

  // ---------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------

  _onHit(e) {
    const { balloon, fullyPopped } = e.detail;
    if (balloon.type.id !== 'boss' || fullyPopped) return;

    // A hit that didn't finish the boss off — play feedback and let
    // effects.js show a "hits remaining" cue if it wants to.
    this.audio.playBossHit();
    document.dispatchEvent(new CustomEvent('boss:hit', {
      detail: { hitsTaken: balloon.hitsTaken, hitsRequired: balloon.hitsRequired },
    }));
  }

  _onPopped(e) {
    const balloon = e.detail.balloon;
    if (balloon.type.id !== 'boss') return;

    this.activeBoss = null;
    document.dispatchEvent(new CustomEvent('boss:defeated', { detail: { balloon } }));
  }

  _onMissed(e) {
    const balloon = e.detail.balloon;
    if (balloon.type.id === 'boss' && this.activeBoss === balloon) {
      this.activeBoss = null; // floated away unpopped — allow another to spawn
    }
  }
}