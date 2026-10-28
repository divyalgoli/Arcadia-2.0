/**
 * Score Module - Manages game score and moves tracking
 * Calculates score based on moves, time, and matched pairs
 */

const Score = (() => {
  let moveCount = 0;
  let matchCount = 0;
  let totalPairs = 0;
  let baseScore = 1000;

  /**
   * Initialize score system for a new game
   * @param {number} pairs - Total number of pairs in the game
   */
  const initialize = (pairs) => {
    moveCount = 0;
    matchCount = 0;
    totalPairs = pairs;
    baseScore = 1000 + (pairs * 50); // Scale base score with difficulty
    updateScoreDisplay();
    updateMovesDisplay();
    console.log(`[Score] Initialized for ${pairs} pairs. Base score: ${baseScore}`);
  };

  /**
   * Increment move count
   * Called every two card flips
   */
  const incrementMove = () => {
    moveCount++;
    updateMovesDisplay();
    console.log(`[Score] Move: ${moveCount}`);
  };

  /**
   * Increment match count
   * Called when a matching pair is found
   */
  const incrementMatch = () => {
    matchCount++;
    updateScoreDisplay();
    console.log(`[Score] Match: ${matchCount}/${totalPairs}`);
  };

  /**
   * Get current move count
   * @returns {number} Total number of moves made
   */
  const getMoveCount = () => {
    return moveCount;
  };

  /**
   * Get current match count
   * @returns {number} Total number of matched pairs
   */
  const getMatchCount = () => {
    return matchCount;
  };

  /**
   * Check if all pairs have been matched
   * @returns {boolean} True if all pairs matched
   */
  const isGameWon = () => {
    return matchCount === totalPairs;
  };

  /**
   * Calculate final score based on performance metrics
   * Score = baseScore - (moves × penalty) - (time × timePenalty)
   * @param {number} timeInSeconds - Total time taken in seconds
   * @returns {number} Calculated final score
   */
  const calculateFinalScore = (timeInSeconds) => {
    // Base scoring penalties
    const movePenalty = 10; // Points deducted per move
    const timePenalty = 1; // Points deducted per second
    const perfectBonus = 500; // Bonus for minimum moves

    // Calculate score components
    const moveScore = Math.max(0, baseScore - (moveCount * movePenalty));
    const timeScore = Math.max(0, moveScore - (timeInSeconds * timePenalty));

    // Add perfect game bonus (theoretically possible: pairs matches = minimum moves)
    const minimalMoves = totalPairs;
    const isPerfect = moveCount === minimalMoves;
    const perfectBonus_applied = isPerfect ? perfectBonus : 0;

    const finalScore = Math.max(100, timeScore + perfectBonus_applied);

    console.log(`[Score] Final Score Calculation:
      Base: ${baseScore}
      After moves: ${moveScore}
      After time: ${timeScore}
      Perfect bonus: ${perfectBonus_applied}
      Final: ${finalScore}`);

    return Math.round(finalScore);
  };

  /**
   * Get current score (before game ends)
   * Returns intermediate score based on matches so far
   * @returns {number} Current intermediate score
   */
  const getCurrentScore = () => {
    // Intermediate score: reward for matches made
    return Math.max(100, baseScore - (moveCount * 5) + (matchCount * 20));
  };

  /**
   * Reset score and moves
   * Called when restarting a game
   */
  const reset = () => {
    moveCount = 0;
    matchCount = 0;
    updateScoreDisplay();
    updateMovesDisplay();
    console.log('[Score] Reset');
  };

  /**
   * Update score display in DOM
   * Updates the #score element if it exists
   */
  const updateScoreDisplay = () => {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = getCurrentScore();
    }
  };

  /**
   * Update moves display in DOM
   * Updates the #moves element if it exists
   */
  const updateMovesDisplay = () => {
    const movesElement = document.getElementById('moves');
    if (movesElement) {
      movesElement.textContent = moveCount;
    }
  };

  /**
   * Get game statistics
   * @param {number} timeInSeconds - Total time taken
   * @returns {object} Object with game stats
   */
  const getStats = (timeInSeconds) => {
    return {
      moves: moveCount,
      matches: matchCount,
      totalPairs: totalPairs,
      time: timeInSeconds,
      score: calculateFinalScore(timeInSeconds),
      movesPerMatch: (moveCount > 0 && matchCount > 0) ? (moveCount / matchCount).toFixed(2) : 0
    };
  };

  // Public API
  return {
    initialize,
    incrementMove,
    incrementMatch,
    getMoveCount,
    getMatchCount,
    isGameWon,
    calculateFinalScore,
    getCurrentScore,
    reset,
    updateScoreDisplay,
    updateMovesDisplay,
    getStats
  };
})();
