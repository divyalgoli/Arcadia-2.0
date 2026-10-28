// ai.js — computer opponent using minimax, gated by difficulty
const CandyAI = (() => {
  function emptyIndices(cells) {
    return cells.reduce((acc, v, i) => { if (!v) acc.push(i); return acc; }, []);
  }

  function minimax(cells, symbol, aiSymbol, humanSymbol, depth = 0) {
    const result = CandyWinCheck.checkWinner(cells);
    if (result) {
      if (result.winner === aiSymbol) return { score: 10 - depth };
      return { score: depth - 10 };
    }
    if (CandyWinCheck.isDraw(cells)) return { score: 0 };

    const moves = [];
    for (const i of emptyIndices(cells)) {
      const next = cells.slice();
      next[i] = symbol;
      const nextSymbol = symbol === aiSymbol ? humanSymbol : aiSymbol;
      const { score } = minimax(next, nextSymbol, aiSymbol, humanSymbol, depth + 1);
      moves.push({ index: i, score });
    }

    if (symbol === aiSymbol) {
      return moves.reduce((best, m) => (m.score > best.score ? m : best));
    }
    return moves.reduce((best, m) => (m.score < best.score ? m : best));
  }

  function bestMove(cells, aiSymbol, humanSymbol) {
    return minimax(cells, aiSymbol, aiSymbol, humanSymbol).index;
  }

  function randomMove(cells) {
    const options = emptyIndices(cells);
    return options[Math.floor(Math.random() * options.length)];
  }

  function chooseMove(cells, aiSymbol, humanSymbol, difficultyLevel) {
    const profile = CandyDifficulty.getProfile(difficultyLevel);
    const playBest = Math.random() < profile.bestMoveChance;
    return playBest ? bestMove(cells, aiSymbol, humanSymbol) : randomMove(cells);
  }

  return { chooseMove, bestMove, randomMove };
})();
