/**
 * timer.js
 * ------------------------------------------------------------------
 * Drives the round countdown shown in #timer-value. Uses the same
 * requestAnimationFrame + delta-time pattern as movement.js (rather
 * than setInterval) so it pauses/resumes cleanly and stays accurate
 * even if the tab is briefly throttled.
 *
 * Dispatches `timer:ended` on `document` when it hits zero — game.js
 * listens for that (alongside `player:gameover` from player.js) to
 * end the round.
 * ------------------------------------------------------------------
 */

const LOW_TIME_THRESHOLD_SEC = 10;
const LOW_TIME_COLOR = '#FF6B6B';

class TimerManager {
  /** @param {number} durationSec - starting round length, from difficulty.js */
  constructor(durationSec) {
    this.duration = durationSec;
    this.remaining = durationSec;
    this.running = false;
    this.paused = false;

    this._lastTimestamp = null;
    this._rafId = null;
    this._tickBound = this._tick.bind(this);

    this.timerEl = document.getElementById('timer-value');
    this._renderTime();
  }

  /** Starts (or restarts) the countdown. */
  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this._lastTimestamp = null;
    this._renderTime();
    this._rafId = requestAnimationFrame(this._tickBound);
  }

  /** Fully stops the countdown (round over). */
  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  /** Freezes the countdown without losing its place (Pause button). */
  pause() {
    this.paused = true;
  }

  /** Resumes after pause(). Resets the delta-time clock to avoid a jump. */
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._lastTimestamp = null;
  }

  /** Adds seconds to the clock (Blue Balloon: +5 Seconds). */
  addTime(seconds) {
    this.remaining += seconds;
    this._renderTime();
    document.dispatchEvent(new CustomEvent('timer:added', {
      detail: { seconds, remaining: this.remaining },
    }));
  }

  /** Restarts the countdown from a fresh duration (Restart / Play Again). */
  reset(durationSec = this.duration) {
    this.duration = durationSec;
    this.remaining = durationSec;
    this._renderTime();
  }

  /** Whole seconds remaining, for anything that needs the raw number. */
  getRemainingSeconds() {
    return Math.max(0, Math.ceil(this.remaining));
  }

  // ---------------------------------------------------------------
  // Internal loop
  // ---------------------------------------------------------------

  _tick(timestamp) {
    if (!this.running) return;

    if (this._lastTimestamp == null) this._lastTimestamp = timestamp;
    const dt = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;

    if (!this.paused) {
      this.remaining -= dt;

      if (this.remaining <= 0) {
        this.remaining = 0;
        this._renderTime();
        this.running = false;
        document.dispatchEvent(new CustomEvent('timer:ended'));
        return; // don't reschedule — the round is over
      }

      this._renderTime();
    }

    this._rafId = requestAnimationFrame(this._tickBound);
  }

  _renderTime() {
    if (!this.timerEl) return;
    const displaySeconds = Math.ceil(this.remaining);
    this.timerEl.textContent = String(displaySeconds);
    // Simple low-time warning — tints the number red in the final
    // stretch. No CSS changes needed since it's just an inline color.
    this.timerEl.style.color = displaySeconds <= LOW_TIME_THRESHOLD_SEC ? LOW_TIME_COLOR : '';
  }
}