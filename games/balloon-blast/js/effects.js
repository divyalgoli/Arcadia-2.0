/**
 * effects.js
 * ------------------------------------------------------------------
 * All purely-visual polish lives here, driven entirely by the Web
 * Animations API (`element.animate()`) rather than new CSS classes —
 * so none of your CSS files needed to change.
 *
 * Listens for events already dispatched elsewhere (balloon:popped,
 * score:changed, combo:changed, powerup:mystery, boss:defeated) and
 * is also the module that ACTUALLY removes a popped balloon's DOM
 * element, once its pop/explosion animation finishes. collision.js
 * intentionally leaves that step to us.
 * ------------------------------------------------------------------
 */

const TOAST_VISIBLE_MS = 2600;
const CONFETTI_PIECES = 16;
const CONFETTI_EMOJI = ['🎉', '✨', '🎊', '⭐'];

class EffectsManager {
  /** @param {HTMLElement} container - #game-area, used to position floating score text */
  constructor(container) {
    this.container = container;
    this._toastTimeoutId = null;

    this._onBalloonPopped = this._onBalloonPopped.bind(this);
    this._onScoreChanged = this._onScoreChanged.bind(this);
    this._onComboChanged = this._onComboChanged.bind(this);
    this._onMysteryToast = this._onMysteryToast.bind(this);
    this._onBossDefeated = this._onBossDefeated.bind(this);

    document.addEventListener('balloon:popped', this._onBalloonPopped);
    document.addEventListener('score:changed', this._onScoreChanged);
    document.addEventListener('combo:changed', this._onComboChanged);
    document.addEventListener('powerup:mystery', this._onMysteryToast);
    document.addEventListener('boss:defeated', this._onBossDefeated);
  }

  /** Removes all listeners (round teardown). */
  destroy() {
    document.removeEventListener('balloon:popped', this._onBalloonPopped);
    document.removeEventListener('score:changed', this._onScoreChanged);
    document.removeEventListener('combo:changed', this._onComboChanged);
    document.removeEventListener('powerup:mystery', this._onMysteryToast);
    document.removeEventListener('boss:defeated', this._onBossDefeated);
    clearTimeout(this._toastTimeoutId);
  }

  /** Public: called by game.js/result.js at game-over on a new high score. */
  celebrateWin() {
    this._showToast('🏆', 'New High Score!', 'Amazing popping streak!');
    this._confettiBurst();
  }

  // ---------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------

  /** Plays the pop/explosion animation, then destroys the balloon's element. */
  _onBalloonPopped(e) {
    const balloon = e.detail.balloon;
    const isBomb = balloon.type.effect === 'bomb';
    const isBoss = balloon.type.id === 'boss';
    const duration = isBoss ? 380 : 260;

    const keyframes = isBomb
      ? [
          { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'scale(1.6)', opacity: 0.85, filter: 'brightness(2)', offset: 0.35 },
          { transform: 'scale(0.3)', opacity: 0, filter: 'brightness(1)' },
        ]
      : [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.3)', opacity: 0.7, offset: 0.5 },
          { transform: 'scale(0.2)', opacity: 0 },
        ];

    const animation = balloon.el.animate(keyframes, { duration, easing: 'ease-out' });
    if (isBomb) this._screenShake();

    const cleanup = () => balloon.destroy();
    if (animation.finished && typeof animation.finished.then === 'function') {
      animation.finished.then(cleanup).catch(cleanup);
    } else {
      setTimeout(cleanup, duration); // fallback for browsers without Animation.finished
    }
  }

  /** Floating "+N"/"-N" score text at the popped balloon's position. */
  _onScoreChanged(e) {
    const { balloon, awarded } = e.detail;
    if (awarded === 0) return; // neutral utility balloons show a toast instead, not a number
    this._spawnFloatingScore(balloon, awarded);
  }

  /** Quick pulse on the combo pill whenever the multiplier changes. */
  _onComboChanged() {
    const comboEl = document.getElementById('combo-counter');
    if (!comboEl) return;
    comboEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.35)', offset: 0.4 },
      { transform: 'scale(1)' },
    ], { duration: 400, easing: 'ease-out' });
  }

  _onMysteryToast(e) {
    this._showToast('🎁', 'Mystery Balloon!', e.detail.message);
  }

  _onBossDefeated() {
    this._showToast('👑', 'Boss Defeated!', '+25 points');
  }

  // ---------------------------------------------------------------
  // Internal effect builders
  // ---------------------------------------------------------------

  _spawnFloatingScore(balloon, awarded) {
    const el = document.createElement('div');
    el.textContent = (awarded > 0 ? '+' : '') + awarded;
    Object.assign(el.style, {
      position: 'absolute',
      left: `${balloon.x + balloon.size / 2}px`,
      bottom: `${balloon.y + balloon.size}px`,
      transform: 'translateX(-50%)',
      fontFamily: "'Fredoka', sans-serif",
      fontWeight: '700',
      fontSize: '1.15rem',
      color: awarded > 0 ? '#2ECC71' : '#FF6B6B',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
      zIndex: '20',
    });
    this.container.appendChild(el);

    const animation = el.animate([
      { transform: 'translate(-50%, 0)', opacity: 1 },
      { transform: 'translate(-50%, -46px)', opacity: 0 },
    ], { duration: 800, easing: 'ease-out' });

    const cleanup = () => el.remove();
    if (animation.finished && typeof animation.finished.then === 'function') {
      animation.finished.then(cleanup).catch(cleanup);
    } else {
      setTimeout(cleanup, 800);
    }
  }

  /** Shakes the whole game screen briefly (Bomb Balloon feedback). */
  _screenShake() {
    const target = document.getElementById('game-screen');
    if (!target) return;
    target.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(-8px, 4px)' },
      { transform: 'translate(8px, -4px)' },
      { transform: 'translate(-6px, 3px)' },
      { transform: 'translate(6px, -3px)' },
      { transform: 'translate(0, 0)' },
    ], { duration: 350, easing: 'ease-in-out' });
  }

  /** Shows a message in the existing #achievement-popup toast element. */
  _showToast(icon, title, description) {
    const popup = document.getElementById('achievement-popup');
    if (!popup) return;

    const iconEl = popup.querySelector('.achievement-icon');
    const titleEl = popup.querySelector('.achievement-title');
    const descEl = popup.querySelector('.achievement-desc');
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;

    popup.classList.remove('hidden');
    clearTimeout(this._toastTimeoutId);
    this._toastTimeoutId = setTimeout(() => popup.classList.add('hidden'), TOAST_VISIBLE_MS);
  }

  /** Falling emoji confetti burst for the win celebration. */
  _confettiBurst() {
    for (let i = 0; i < CONFETTI_PIECES; i++) {
      const piece = document.createElement('span');
      piece.textContent = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)];
      Object.assign(piece.style, {
        position: 'fixed',
        left: `${Math.random() * 100}vw`,
        top: '-40px',
        fontSize: `${1.2 + Math.random()}rem`,
        pointerEvents: 'none',
        zIndex: '400',
      });
      document.body.appendChild(piece);

      const fallDuration = 1800 + Math.random() * 1200;
      const rotation = 360 + Math.random() * 360;
      const animation = piece.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 80}px) rotate(${rotation}deg)`, opacity: 0.9 },
      ], { duration: fallDuration, easing: 'ease-in' });

      const cleanup = () => piece.remove();
      if (animation.finished && typeof animation.finished.then === 'function') {
        animation.finished.then(cleanup).catch(cleanup);
      } else {
        setTimeout(cleanup, fallDuration);
      }
    }
  }
}