// result.js — renders the winner/draw screen
document.addEventListener('DOMContentLoaded', () => {
  const result = CandyStorage.getLastResult();
  const titleEl = document.getElementById('result-title');
  const subEl = document.getElementById('result-sub');
  const p1NameEl = document.getElementById('r-p1-name');
  const p2NameEl = document.getElementById('r-p2-name');
  const p1ScoreEl = document.getElementById('r-p1-score');
  const p2ScoreEl = document.getElementById('r-p2-score');
  const confettiLayer = document.getElementById('confetti-layer');

  if (result) {
    p1NameEl.textContent = result.p1Name || 'Player 1';
    p2NameEl.textContent = result.p2Name || 'Player 2';
    p1ScoreEl.textContent = result.scores.p1;
    p2ScoreEl.textContent = result.scores.p2;

    if (result.winnerKey === 'p1') {
      titleEl.textContent = '🍭 You Win!';
      subEl.textContent = 'Sweet victory!';
      CandyEffects.confettiBurst(confettiLayer, 70);
      CandyAudio.win();
    } else if (result.winnerKey === 'p2') {
      titleEl.textContent = `🍬 ${result.p2Name || 'Player 2'} Wins!`;
      subEl.textContent = 'Better luck next round!';
      CandyEffects.confettiBurst(confettiLayer, 40);
      CandyAudio.win();
    } else {
      titleEl.textContent = '🤝 It\'s a Draw!';
      subEl.textContent = 'So close — try again!';
      CandyAudio.draw();
    }
  }

  document.getElementById('rematch-btn').addEventListener('click', () => {
    CandyAudio.click();
    window.location.href = 'game.html';
  });
  document.getElementById('home-btn').addEventListener('click', () => {
    CandyAudio.click();
    window.location.href = 'index.html';
  });
});
