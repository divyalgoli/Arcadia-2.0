/**
 * movement.js
 * ------------------------------------------------------------------
 * Owns the requestAnimationFrame loop that moves every active balloon
 * upward each frame. Also owns the "active balloons" list itself, so
 * balloons.js/collision.js/boss.js all go through this controller
 * rather than each keeping their own array.
 *
 * Does NOT decide scoring or pop balloons — collision.js handles taps,
 * this file only handles positions, pausing, freezing (Mystery Balloon
 * / powerup effect), and detecting balloons that floated off-screen
 * unpopped ("missed").
 * ------------------------------------------------------------------
 */

class MovementController {
  constructor(container) {
    this.container = container;
    this.balloons = []; // active Balloon instances (see balloons.js)

    this.running = false;
    this.paused = false;
    this.freezeUntil = 0; // performance.now() timestamp until which movement is frozen

    this._lastTimestamp = null;
    this._rafId = null;
    this._tickBound = this._tick.bind(this);
  }

  /** Registers a newly-spawned balloon so it starts animating. */
  addBalloon(balloon) {
    this.balloons.push(balloon);
  }

  /**
   * Removes a balloon from tracking WITHOUT destroying its DOM element —
   * collision.js/effects.js call this after a pop, once they're done
   * with any pop animation, and handle the actual `balloon.destroy()`
   * themselves so a fade-out/scale animation can play first if desired.
   */
  removeBalloon(balloon) {
    const index = this.balloons.indexOf(balloon);
    if (index !== -1) this.balloons.splice(index, 1);
  }

  /** Current list of balloons still alive on screen. */
  getActiveBalloons() {
    return this.balloons;
  }

  /** Starts the animation loop. */
  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this._lastTimestamp = null;
    this._rafId = requestAnimationFrame(this._tickBound);
  }

  /** Fully stops the loop (round over / leaving the page). */
  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  /** Freezes balloon positions in place without stopping the loop (Pause button). */
  pause() {
    this.paused = true;
  }

  /** Resumes after pause(). Resets the delta-time clock to avoid a big jump. */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._lastTimestamp = null;
  }

  /**
   * Freezes ALL balloons in place for `durationMs` (used by the Mystery
   * Balloon's "Freeze Balloons" reward). Purely visual/gameplay — the
   * loop keeps running so timers elsewhere stay accurate.
   */
  freeze(durationMs) {
    this.freezeUntil = performance.now() + durationMs;
  }

  /** Removes every balloon immediately (Restart / Play Again). */
  clearAll() {
    this.balloons.forEach((b) => b.destroy());
    this.balloons = [];
  }

  // ---------------------------------------------------------------
  // Internal loop
  // ---------------------------------------------------------------

  _tick(timestamp) {
    if (!this.running) return;

    if (this._lastTimestamp == null) this._lastTimestamp = timestamp;
    const dt = (timestamp - this._lastTimestamp) / 1000; // seconds elapsed
    this._lastTimestamp = timestamp;

    if (!this.paused) {
      const isFrozen = timestamp < this.freezeUntil;
      const containerHeight = this.container.clientHeight;

      // Iterate backwards so splicing missed balloons out mid-loop is safe.
      for (let i = this.balloons.length - 1; i >= 0; i--) {
        const balloon = this.balloons[i];
        if (balloon.popped) continue; // being handled by collision/effects already

        if (!isFrozen) {
          balloon.setY(balloon.y + balloon.speed * dt);
        }

        if (balloon.hasLeftContainer(containerHeight)) {
          this.balloons.splice(i, 1);
          balloon.destroy();
          // Let game.js/scoring.js react (e.g. reset combo) without a direct import.
          document.dispatchEvent(new CustomEvent('balloon:missed', { detail: { balloon } }));
        }
      }
    }

    this._rafId = requestAnimationFrame(this._tickBound);
  }
}