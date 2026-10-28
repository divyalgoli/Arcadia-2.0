// moves.js — applies a move to the board state
const CandyMoves = (() => {
  function placeMove(cells, index, symbol) {
    if (cells[index] || index == null) return cells;
    const next = cells.slice();
    next[index] = symbol;
    return next;
  }

  return { placeMove };
})();
