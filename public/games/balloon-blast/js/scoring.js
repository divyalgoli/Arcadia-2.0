/**
 * scoring.js
 * ------------------------------------------------------------------
 * Owns score, combo, best combo, and accuracy for the current round.
 * Listens for the events collision.js/movement.js already dispatch
 * (`balloon:popped`, `balloon:missed`) rather than being called
 * directly, so it stays a self-contained, drop-in observer.
 *
 * Combo rules (documented here since the spec didn't give exact
 * numbers): every 5 consecutive balloons popped for POSITIVE points
 * raises the combo multiplier by 1 (capped at x5). Popping a Bomb
 * Balloon resets the streak back to x1, and so does MISSING a balloon
 * that was worth positive points (a real scoring opportunity let slip).
 * Neutral "utility" balloons (Blue/Lightning/Heart/Mystery/Boss-in-progress)
 * and Bomb Balloons neither build nor break the streak by floating away
 * unpopped — missing them isn't punished, since a missed Bomb was
 * actually avoided and a missed utility balloon never mattered for
 * score either way. Their score is 0 (or handled by popping, for
 * bombs), only their special effect matters (handled by
 * powerups.js/boss.js).
 *
 * Accuracy = balloons popped ÷ (balloons popped + balloons missed),
 * i.e. how often the player cleared a balloon before it floated away,
 * regardless of balloon type.
 * ------------------------------------------------------------------
 */

const MAX_COMBO_LEVEL = 5;
const STREAK_PER_COMBO_LEVEL = 5;

class ScoreManager {
  /** @param {import('./storage.js').StorageManager} storage */
  constructor(storage) {
    this.storage = storage;

    this.score = 0;
    this.comboStreak = 0;      // consecutive positive-point pops
    this.comboLevel = 1;       // displayed multiplier, e.g. "x3"
    this.bestComboStreak = 0;  // longest streak this round (saved as "Best Combo")
    this.poppedCount = 0;
    this.missedCount = 0;
    this.doubleScoreActive = false; // toggled by powerups.js (Lightning Balloon)

    this.scoreEl = document.getElementById('player-score');
    this.highScoreEl = document.getElementById('high-score');
    this.comboValueEl = document.getElementById('combo-value');

    this._onPopped = this._onPopped.bind(this);
    this._onMissed = this._onMissed.bind(this);
    document.addEventListener('balloon:popped', this._onPopped);
    document.addEventListener('balloon:missed', this._onMissed);

    this._renderScore();
    this._renderHighScore();
    this._renderCombo();
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------

  /** Enables/disables the double-score multiplier (Lightning Balloon effect). */
  setDoubleScoreActive(active) {
    this.doubleScoreActive = active;
  }

  /** Directly adds/subtracts points without touching combo (Mystery Balloon bonus/penalty). */
  addBonusPoints(amount) {
    this.score = Math.max(0, this.score + amount);
    this._renderScore();
  }

  getAccuracy() {
    const total = this.poppedCount + this.missedCount;
    if (total === 0) return 100;
    return Math.round((this.poppedCount / total) * 100);
  }

  /** Resets everything for a fresh round (Restart / Play Again). */
  reset() {
    this.score = 0;
    this.comboStreak = 0;
    this.comboLevel = 1;
    this.bestComboStreak = 0;
    this.poppedCount = 0;
    this.missedCount = 0;
    this.doubleScoreActive = false;
    this._renderScore();
    this._renderCombo();
    this._renderHighScore();
  }

  /**
   * Called by game.js at game-over. Persists high score/best combo and
   * returns the final stats for result.js to display.
   */
  finalizeRound() {
    const isNewHighScore = this.storage.setHighScore(this.score);
    this.storage.setBestCombo(this.bestComboStreak);
    return {
      score: this.score,
      bestCombo: this.bestComboStreak,
      accuracy: this.getAccuracy(),
      isNewHighScore,
      highScore: this.storage.getHighScore(),
    };
  }

  // ---------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------

  _onPopped(e) {
    const balloon = e.detail.balloon;
    const basePoints = balloon.type.points;
    this.poppedCount++;

    let awarded = basePoints;

    if (basePoints > 0) {
      this.comboStreak++;
      this._updateComboLevel();
      awarded = basePoints * this.comboLevel;
      if (this.doubleScoreActive) awarded *= 2;
      this.bestComboStreak = Math.max(this.bestComboStreak, this.comboStreak);
    } else if (basePoints < 0) {
      // A mistake (Bomb Balloon) breaks the streak but isn't multiplied
      // further by it — otherwise a high combo would make bombs punish
      // disproportionately hard, which feels bad rather than fair.
      this.comboStreak = 0;
      this._updateComboLevel();
    }
    // basePoints === 0: neutral utility balloon, no combo/score change here.

    this.score = Math.max(0, this.score + awarded);
    this._renderScore();

    document.dispatchEvent(new CustomEvent('score:changed', {
      detail: { balloon, awarded, total: this.score },
    }));
  }

  _onMissed(e) {
    this.missedCount++;

    const balloon = e && e.detail ? e.detail.balloon : null;
    const basePoints = balloon ? balloon.type.points : 0;

    // Only a missed positive-point balloon breaks the streak — missing
    // a Bomb Balloon (avoided!) or a neutral utility balloon never
    // counted toward the combo either, so it shouldn't punish it.
    if (basePoints > 0) {
      this.comboStreak = 0;
      this._updateComboLevel();
    }
  }

  // ---------------------------------------------------------------
  // Internal render helpers
  // ---------------------------------------------------------------

  _updateComboLevel() {
    const newLevel = Math.min(MAX_COMBO_LEVEL, 1 + Math.floor(this.comboStreak / STREAK_PER_COMBO_LEVEL));
    const changed = newLevel !== this.comboLevel;
    this.comboLevel = newLevel;
    this._renderCombo();
    if (changed) {
      document.dispatchEvent(new CustomEvent('combo:changed', {
        detail: { level: this.comboLevel, streak: this.comboStreak },
      }));
    }
  }

  _renderScore() {
    if (this.scoreEl) this.scoreEl.textContent = String(this.score);
  }

  _renderHighScore() {
    if (this.highScoreEl) this.highScoreEl.textContent = String(this.storage.getHighScore());
  }

  _renderCombo() {
    if (this.comboValueEl) this.comboValueEl.textContent = `x${this.comboLevel}`;
  }
}