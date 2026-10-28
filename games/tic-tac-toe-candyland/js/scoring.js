// scoring.js — round score tracking + streak persistence
const CandyScoring = (() => {
  let scores = { p1: 0, p2: 0 };

  function reset() {
    scores = { p1: 0, p2: 0 };
  }

  function restore(saved) {
    scores = { p1: (saved && saved.p1) || 0, p2: (saved && saved.p2) || 0 };
  }

  function addPoint(playerKey) {
    scores[playerKey] += 1;
    return scores;
  }

  function getScores() {
    return scores;
  }

  function recordStreak(playerWon) {
    let current = CandyStorage.getCurrentStreak();
    let best = CandyStorage.getBestStreak();
    if (playerWon) {
      current += 1;
      if (current > best) {
        best = current;
        CandyStorage.setBestStreak(best);
        if (window.Arcadia) Arcadia.submitScore('tic-tac-toe-candyland', 'Candyland Tic-Tac-Toe', best);
      }
    } else {
      current = 0;
    }
    CandyStorage.setCurrentStreak(current);
    return { current, best };
  }

  return { reset, restore, addPoint, getScores, recordStreak };
})();
