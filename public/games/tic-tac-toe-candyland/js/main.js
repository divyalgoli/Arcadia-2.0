// main.js — home page interactions & navigation
document.addEventListener('DOMContentLoaded', () => {
  let selectedMode = null;
  let selectedDifficulty = 'medium';

  const difficultyPanel = document.getElementById('difficulty-panel');
  const modeButtons = document.querySelectorAll('[data-mode]');
  const difficultyButtons = document.querySelectorAll('[data-difficulty]');
  const startBtn = document.getElementById('start-btn');

  document.getElementById('best-streak-num').textContent = CandyStorage.getBestStreak();

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMode = btn.dataset.mode;
      modeButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      CandyAudio.click();
      if (selectedMode === 'ai') {
        difficultyPanel.classList.remove('hidden');
      } else {
        difficultyPanel.classList.add('hidden');
      }
    });
  });

  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDifficulty = btn.dataset.difficulty;
      difficultyButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      CandyAudio.click();
    });
  });

  startBtn.addEventListener('click', () => {
    CandyAudio.click();
    CandyStorage.setMatchConfig({
      mode: selectedMode || 'ai',
      difficulty: selectedDifficulty
    });
    CandyStorage.setMatchState(null); // fresh scores
    window.location.href = 'game.html';
  });

  // Settings modal
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
  CandySettings.bindToggle('sound-toggle', 'sound');
  CandySettings.bindToggle('music-toggle', 'music');

  // Floating candy background
  const floaters = document.getElementById('floaters');
  const candyEmojis = ['🍭', '🍬', '🍩', '🧁', '🍫', '🍡'];
  for (let i = 0; i < 14; i++) {
    const span = document.createElement('span');
    span.className = 'floater';
    span.textContent = candyEmojis[Math.floor(Math.random() * candyEmojis.length)];
    span.style.left = Math.random() * 100 + 'vw';
    span.style.animationDuration = (8 + Math.random() * 10) + 's';
    span.style.animationDelay = (Math.random() * 10) + 's';
    span.style.fontSize = (1 + Math.random() * 1.4) + 'rem';
    floaters.appendChild(span);
  }

  CandyAudio.startMusic();
});
