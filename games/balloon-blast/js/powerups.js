/**
 * powerups.js
 * ------------------------------------------------------------------
 * Listens for `balloon:popped` (dispatched by collision.js) and
 * resolves whatever special EFFECT that balloon type carries. Plain
 * scoring (points) is already handled generically by scoring.js for
 * every balloon type — this file only deals with the "extra" gameplay
 * behavior: time bonuses, temporary double score, extra lives, bomb
 * life-loss, and the Mystery Balloon's random reward.
 *
 * Announces what happened via CustomEvents so effects.js can show the
 * right animation/toast without this file needing to know about DOM
 * effects itself.
 * ------------------------------------------------------------------
 */

const MYSTERY_REWARDS = ['bonus', 'penalty', 'freeze', 'doubleScore', 'extraTime'];
const MYSTERY_FREEZE_MS = 3000;
const MYSTERY_EXTRA_TIME_SEC = 5;
const MYSTERY_DOUBLE_SCORE_SEC = 10;

class PowerupManager {
  /**
   * @param {object} deps
   * @param {import('./timer.js').TimerManager} deps.timer
   * @param {import('./scoring.js').ScoreManager} deps.scoring
   * @param {import('./player.js').Player} deps.player
   * @param {import('./movement.js').MovementController} deps.movement
   */
  constructor({ timer, scoring, player, movement }) {
    this.timer = timer;
    this.scoring = scoring;
    this.player = player;
    this.movement = movement;

    this._doubleScoreTimeoutId = null;

    this._onPopped = this._onPopped.bind(this);
    document.addEventListener('balloon:popped', this._onPopped);
  }

  /** Stops listening and clears any pending timers (round teardown). */
  destroy() {
    document.removeEventListener('balloon:popped', this._onPopped);
    clearTimeout(this._doubleScoreTimeoutId);
  }

  // ---------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------

  _onPopped(e) {
    const balloon = e.detail.balloon;
    switch (balloon.type.effect) {
      case 'time':
        this._handleTime(balloon);
        break;
      case 'doubleScore':
        this._startDoubleScore(balloon.type.durationSec);
        break;
      case 'heart':
        this._handleHeart();
        break;
      case 'mystery':
        this._handleMystery();
        break;
      case 'bomb':
        this._handleBomb();
        break;
      default:
        // Red / Green / Gold / Boss: pure scoring already handled by
        // scoring.js, no extra effect to resolve here.
        break;
    }
  }

  _handleTime(balloon) {
    this.timer.addTime(balloon.type.timeBonusSec);
  }

  _handleHeart() {
    this.player.gainLife();
  }

  _handleBomb() {
    const isGameOver = this.player.loseLife();
    document.dispatchEvent(new CustomEvent('powerup:bomb', { detail: { isGameOver } }));
  }

  /** Starts (or refreshes) the double-score window for `durationSec` seconds. */
  _startDoubleScore(durationSec) {
    this.scoring.setDoubleScoreActive(true);
    document.dispatchEvent(new CustomEvent('powerup:doublescore', {
      detail: { active: true, durationSec },
    }));

    // A second Lightning/Mystery double-score before the first expires
    // just extends the window rather than stacking multipliers.
    clearTimeout(this._doubleScoreTimeoutId);
    this._doubleScoreTimeoutId = setTimeout(() => {
      this.scoring.setDoubleScoreActive(false);
      document.dispatchEvent(new CustomEvent('powerup:doublescore', { detail: { active: false } }));
    }, durationSec * 1000);
  }

  /** Mystery Balloon: picks one of five random rewards/penalties. */
  _handleMystery() {
    const pick = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)];

    switch (pick) {
      case 'bonus': {
        const amount = 5 + Math.floor(Math.random() * 10); // +5 to +14
        this.scoring.addBonusPoints(amount);
        this._announceMystery('bonus', `+${amount} Bonus Points!`);
        break;
      }
      case 'penalty': {
        const amount = -(3 + Math.floor(Math.random() * 7)); // -3 to -9
        this.scoring.addBonusPoints(amount);
        this._announceMystery('penalty', `${amount} Points!`);
        break;
      }
      case 'freeze': {
        this.movement.freeze(MYSTERY_FREEZE_MS);
        this._announceMystery('freeze', 'Balloons Frozen!');
        break;
      }
      case 'doubleScore': {
        this._startDoubleScore(MYSTERY_DOUBLE_SCORE_SEC);
        this._announceMystery('doubleScore', 'Double Score!');
        break;
      }
      case 'extraTime': {
        this.timer.addTime(MYSTERY_EXTRA_TIME_SEC);
        this._announceMystery('extraTime', `+${MYSTERY_EXTRA_TIME_SEC} Seconds!`);
        break;
      }
      default:
        break;
    }
  }

  _announceMystery(kind, message) {
    document.dispatchEvent(new CustomEvent('powerup:mystery', { detail: { kind, message } }));
  }
}