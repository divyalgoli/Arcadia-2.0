// effects.js — confetti burst, streak banner, celebratory visuals
const CandyEffects = (() => {
  const colors = ['#ff8fc7', '#c9a7ff', '#a6e3ff', '#ffe066', '#8ff5d0'];

  function confettiBurst(container, count = 60) {
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.6) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }
  }

  function showStreakBanner(el, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove('show');
    // force reflow so animation restarts
    void el.offsetWidth;
    el.classList.add('show');
  }

  return { confettiBurst, showStreakBanner };
})();
