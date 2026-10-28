// game.js — orchestrates board, moves, win-check, AI, scoring, turns
document.addEventListener('DOMContentLoaded', () => {
  const config = CandyStorage.getMatchConfig();
  CandyPlayer.init(config);

  let cells = Array(9).fill(null);
  let gameOver = false;

  const p1Symbol = CandyPlayer.getSymbol('P1');
  const p2Symbol = CandyPlayer.getSymbol('P2');

  const p1NameEl = document.getElementById('p1-name');
  const p2NameEl = document.getElementById('p2-name');
  const p1ScoreEl = document.getElementById('p1-score');
  const p2ScoreEl = document.getElementById('p2-score');
  const turnIndicator = document.getElementById('turn-indicator');
  const streakBanner = document.getElementById('streak-banner');

  p2NameEl.textContent = CandyPlayer.getMode() === 'ai' ? 'Computer' : 'Player 2';

  const savedMatchState = CandyStorage.getMatchState();
  if (savedMatchState) {
    CandyScoring.restore(savedMatchState);
  } else {
    CandyScoring.reset();
  }
  updateScoreboard();
  updateTurnIndicator();

  function updateScoreboard() {
    const scores = CandyScoring.getScores();
    p1ScoreEl.textContent = scores.p1;
    p2ScoreEl.textContent = scores.p2;
  }

  function updateTurnIndicator() {
    const current = CandyPlayer.getCurrent();
    const symbol = current === 'P1' ? p1Symbol : p2Symbol;
    const name = current === 'P1' ? 'Your' : (CandyPlayer.getMode() === 'ai' ? "Computer's" : "Player 2's");
    turnIndicator.textContent = `${symbol} ${current === 'P1' ? 'Your' : name} Turn`;
  }

  function renderBoard() {
    CandyBoard.render(cells, handleCellClick);
  }

  function handleCellClick(index) {
    if (gameOver || cells[index]) return;
    const current = CandyPlayer.getCurrent();
    const symbol = current === 'P1' ? p1Symbol : p2Symbol;
    applyMove(index, symbol, current);
  }

  function applyMove(index, symbol, playerKey) {
    cells = CandyMoves.placeMove(cells, index, symbol);
    renderBoard();
    CandyBoard.popCell(index);
    CandyAudio.place();

    const result = CandyWinCheck.checkWinner(cells);
    if (result) {
      endRound(result.winner === p1Symbol ? 'p1' : 'p2', result.line);
      return;
    }
    if (CandyWinCheck.isDraw(cells)) {
      endRound(null, []);
      return;
    }

    CandyPlayer.switchTurn();
    updateTurnIndicator();

    if (CandyPlayer.isComputerTurn() && !gameOver) {
      setTimeout(computerMove, 500);
    }
  }

  function computerMove() {
    if (gameOver) return;
    const idx = CandyAI.chooseMove(cells, p2Symbol, p1Symbol, CandyPlayer.getDifficulty());
    if (idx == null) return;
    applyMove(idx, p2Symbol, 'P2');
  }

  function endRound(winnerKey, winLine) {
    gameOver = true;
    if (winLine.length) CandyBoard.markWinningCells(winLine);

    if (winnerKey) {
      CandyScoring.addPoint(winnerKey);
      updateScoreboard();
      CandyStorage.setMatchState(CandyScoring.getScores());
      CandyAudio.win();
      const streak = CandyScoring.recordStreak(winnerKey === 'p1');
      if (winnerKey === 'p1' && streak.current > 1) {
        CandyEffects.showStreakBanner(streakBanner, `🔥 ${streak.current} Win Streak!`);
        CandyAudio.combo();
      }
    } else {
      CandyAudio.draw();
      CandyScoring.recordStreak(false); // a draw breaks the win streak
    }

    const scores = CandyScoring.getScores();
    CandyStorage.setLastResult({
      winnerKey,
      p1Name: p1NameEl.textContent,
      p2Name: p2NameEl.textContent,
      scores
    });

    setTimeout(() => {
      window.location.href = 'result.html';
    }, 1300);
  }

  function restartRound() {
    cells = Array(9).fill(null);
    gameOver = false;
    CandyPlayer.init(config);
    renderBoard();
    updateTurnIndicator();
  }

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  document.getElementById('restart-btn').addEventListener('click', restartRound);

  renderBoard();
  CandyAudio.startMusic();
});
