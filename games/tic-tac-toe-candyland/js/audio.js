// audio.js — plays sound effects & background music.
// Uses generated tones by default (no binary files required to run).
// Drop real files into assets/sounds/ and this will prefer them automatically.
const CandyAudio = (() => {
  let ctx = null;
  let musicTimer = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(freq, duration = 0.15, type = 'sine', delay = 0, gain = 0.2) {
    if (!CandySettings.get().sound) return;
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(c.destination);
    const t0 = c.currentTime + delay;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    place() { tone(660, 0.12, 'triangle'); },
    click() { tone(440, 0.08, 'square', 0, 0.12); },
    win() {
      tone(523, 0.15, 'sine', 0);
      tone(659, 0.15, 'sine', 0.12);
      tone(784, 0.25, 'sine', 0.24);
    },
    draw() {
      tone(300, 0.2, 'sine');
      tone(260, 0.25, 'sine', 0.2);
    },
    combo() {
      tone(880, 0.1, 'sine');
      tone(988, 0.12, 'sine', 0.08);
    },
    startMusic() {
      if (!CandySettings.get().music || musicTimer) return;
      const notes = [523, 587, 659, 587];
      let i = 0;
      musicTimer = setInterval(() => {
        if (CandySettings.get().music) tone(notes[i % notes.length], 0.3, 'sine', 0, 0.05);
        i++;
      }, 700);
    },
    stopMusic() {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  };
})();
