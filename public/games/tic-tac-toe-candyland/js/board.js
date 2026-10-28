// board.js — builds and renders the 3x3 board
const CandyBoard = (() => {
  const boardEl = document.getElementById('board');

  function render(cells, onCellClick) {
    boardEl.innerHTML = '';
    cells.forEach((value, index) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (value ? ' filled' : '');
      cell.dataset.index = index;
      cell.textContent = value || '';
      if (!value) {
        cell.addEventListener('click', () => onCellClick(index));
      }
      boardEl.appendChild(cell);
    });
  }

  function markWinningCells(indices) {
    indices.forEach(i => {
      const cellEl = boardEl.querySelector(`[data-index="${i}"]`);
      if (cellEl) cellEl.classList.add('win-cell');
    });
  }

  function popCell(index) {
    const cellEl = boardEl.querySelector(`[data-index="${index}"]`);
    if (cellEl) cellEl.classList.add('pop-in');
  }

  return { render, markWinningCells, popCell };
})();
