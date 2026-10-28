/**
 * collision.js
 * ------------------------------------------------------------------
 * Turns a click/tap into a resolved balloon hit. Uses ONE delegated
 * pointerdown listener on the game area (instead of one listener per
 * balloon) so performance stays fine even with many balloons on screen.
 *
 * This file deliberately does NOT know about scoring, audio, effects,
 * or powerups — it just figures out WHICH balloon was hit and whether
 * that hit finished it off (instant for normal balloons, multiple hits
 * for Boss Balloons), then announces the result via CustomEvents.
 * game.js listens for these and applies the actual consequences.
 * ------------------------------------------------------------------
 */

class CollisionManager {
  /**
   * @param {HTMLElement} container - #game-area
   * @param {import('./movement.js').MovementController} movement
   */
  constructor(container, movement) {
    this.container = container;
    this.movement = movement;
    this.enabled = true; // set to false while paused so clicks don't register

    this._handlePointerDown = this._handlePointerDown.bind(this);
    this.container.addEventListener('pointerdown', this._handlePointerDown);
  }

  /** Call when the game is paused/resumed so clicks are ignored while paused. */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /** Stops listening entirely (round teardown). */
  destroy() {
    this.container.removeEventListener('pointerdown', this._handlePointerDown);
  }

  // ---------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------

  _handlePointerDown(e) {
    if (!this.enabled) return;

    const el = e.target.closest('.game-balloon');
    if (!el) return;

    const balloonId = Number(el.dataset.balloonId);
    const balloon = this.movement.getActiveBalloons().find((b) => b.id === balloonId);
    if (!balloon || balloon.popped) return;

    // Boss Balloons need multiple hits before they actually pop.
    if (balloon.type.id === 'boss') {
      const fullyPopped = balloon.registerHit();

      // Every hit (even a non-fatal one) gets announced so boss.js can
      // play a "thunk" sound/visual pulse and update a hit-progress cue.
      document.dispatchEvent(new CustomEvent('balloon:hit', {
        detail: { balloon, fullyPopped },
      }));

      if (!fullyPopped) {
        this._pulse(el);
        return;
      }
    }

    balloon.popped = true;
    this.movement.removeBalloon(balloon);

    document.dispatchEvent(new CustomEvent('balloon:popped', { detail: { balloon } }));
  }

  /** Quick squash-and-release feedback for a Boss Balloon hit that didn't finish it. */
  _pulse(el) {
    el.style.transform = 'scale(0.85)';
    setTimeout(() => {
      el.style.transform = '';
    }, 100);
  }
}