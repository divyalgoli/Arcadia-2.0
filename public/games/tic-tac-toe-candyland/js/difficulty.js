// difficulty.js — defines how "smart" the computer is per level
const CandyDifficulty = (() => {
  // chance the AI plays the best (minimax) move vs a random move
  const PROFILES = {
    easy: { bestMoveChance: 0.25 },
    medium: { bestMoveChance: 0.65 },
    hard: { bestMoveChance: 1.0 }
  };

  function getProfile(level) {
    return PROFILES[level] || PROFILES.medium;
  }

  return { getProfile };
})();
