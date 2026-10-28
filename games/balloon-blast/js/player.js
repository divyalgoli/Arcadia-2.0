/**
 * player.js
 * ------------------------------------------------------------------
 * Tracks the player's remaining lives and keeps the #lives-display
 * element (the row of ❤ icons in the bottom bar) in sync with it.
 *
 * The starting HTML hardcodes exactly 3 heart icons — this class
 * re-renders that element from scratch whenever lives change, so it
 * works correctly no matter how many lives a difficulty level grants
 * (e.g. Easy = 4 lives, Hard = 2 lives).
 *
 * Dispatches CustomEvents on `document` so game.js/effects.js can
 * react (screen shake, game-over flow) without a tight coupling.
 * ------------------------------------------------------------------
 */

class Player {
  /**
   * @param {number} startingLives - how many hearts to start with (from difficulty.js).
   * @param {number} maxLives - hard cap so Heart Balloons can't overfill the display.
   */
  constructor(startingLives = 3, maxLives = 5) {
    this.livesDisplayEl = document.getElementById('lives-display');
    this.maxLives = maxLives;
    this.lives = Math.min(startingLives, maxLives);
    this._render();
  }

  /** True while the player still has at least one life. */
  isAlive() {
    return this.lives > 0;
  }

  /**
   * Removes one life (e.g. popping a Bomb Balloon).
   * Returns true if that life loss ended the game (lives hit 0).
   */
  loseLife() {
    if (this.lives <= 0) return true;
    this.lives -= 1;
    this._render();

    document.dispatchEvent(new CustomEvent('player:lifelost', { detail: { lives: this.lives } }));

    if (this.lives <= 0) {
      document.dispatchEvent(new CustomEvent('player:gameover'));
      return true;
    }
    return false;
  }

  /** Adds one life (Heart Balloon), capped at maxLives. */
  gainLife() {
    if (this.lives >= this.maxLives) return;
    this.lives += 1;
    this._render();
    document.dispatchEvent(new CustomEvent('player:lifegained', { detail: { lives: this.lives } }));
  }

  /** Resets lives to a fresh starting value (used by Restart / Play Again). */
  reset(startingLives = this.maxLives) {
    this.lives = Math.min(startingLives, this.maxLives);
    this._render();
  }

  // ---------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------

  _render() {
    if (!this.livesDisplayEl) return;
    // Rebuild the heart icons to match the current life count, reusing
    // the same markup/class the page already ships with so all existing
    // CSS (color, pulse animation) keeps applying automatically.
    this.livesDisplayEl.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      const heart = document.createElement('span');
      heart.className = 'life-icon';
      heart.textContent = '❤';
      this.livesDisplayEl.appendChild(heart);
    }
  }
}