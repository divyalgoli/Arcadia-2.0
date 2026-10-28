'use strict';
/* =====================================================================
   GRAVITY RUN — script.js
   A single-corridor gravity-flip dinosaur runner. Both dinos share one
   scrolling track and race on opposite walls (floor / ceiling).
   Sections:
     1. CONFIG            6. TRACK GENERATOR      11. AI
     2. UTILS              7. DINO                 12. UI SCREENS
     3. AUDIO               8. COLLISION            13. LEADERBOARD
     4. STORAGE/SETTINGS    9. RENDER               14. MAIN LOOP
     5. GAME STATE         10. ROUND / MATCH FLOW   15. INIT
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. CONFIG
   --------------------------------------------------------------------- */
const CFG = {
  DINO_SCREEN_X: 0.27,     // fraction of viewport width where dinos sit
  DINO_X_GAP: 30,          // px — visual-only horizontal separation between the two dinos
  LANE_MARGIN: 0.13,       // fraction of corridor height inset for the rails
  BASE_SPEED: 620,         // px/s at round start — fast and responsive from frame one
  SPEED_RAMP: 10,          // px/s gained per second survived
  MAX_SPEED: 1080,
  ROUND_SPEED_BONUS: [0, 60, 120],
  DIFFICULTY_TIGHTEN: 22,  // px shaved off min corridor per round
  FLIP_ANIM: 0.15,         // visual-only flourish time — side & collision update INSTANTLY on tap
  FLIP_COOLDOWN: 0.14,
  HOP_HEIGHT: 14,
  GEN_AHEAD: 1700,
  INITIAL_SAFE: 620,
  CORRIDOR_MIN: 290,       // tighter spacing between hazards = noticeably harder
  CORRIDOR_MAX: 560,
  HAZARD_CHANCE: 0.95,
  GAP_MIN: 100, GAP_MAX: 165,
  OBST_MIN: 60, OBST_MAX: 96,
  WALL_MIN: 26, WALL_MAX: 42,   // narrow single-pillar "walls" mixed in with gaps/obstacles
  WALL_CHANCE: 0.3,             // share of hazards that are a thin single wall
  DEATH_FALL_TIME: 0.85,
  EPILOGUE_TIME: 1.15,
  POINT_PAUSE_TIME: 1.05,
  COUNTDOWN_STEP: 0.7,
  GO_HOLD: 0.55,
  THEME_BLEND_TIME: 1.3,   // seconds — background crossfades instead of hard-cutting
};

// Soft, clean cartoon palettes — no dark reds, no heavily saturated blues.
// Labels are internal only and are never shown to the player.
const THEMES = [
  { id: 'meadow', sky: ['#cfead9', '#a9dcc0', '#eef8ee'],
    blob: '#8fd9b6', rail: '#6a9b81', accent: '#ffd977',
    obstacle: '#83c2a3', obstacleDark: '#5f9179', particle: '#f1fbf0' },
  { id: 'dune', sky: ['#f6ddb9', '#f3c88f', '#fff2df'],
    blob: '#f0b880', rail: '#c08a5c', accent: '#ff9f6b',
    obstacle: '#dba071', obstacleDark: '#b57a50', particle: '#fff0da' },
  { id: 'lagoon', sky: ['#cdeaf3', '#a8d6e8', '#eaf8fb'],
    blob: '#8fcbe0', rail: '#5f93a6', accent: '#ffe38a',
    obstacle: '#84bdd0', obstacleDark: '#5f95a6', particle: '#eafbfd' },
];

const DINO_COLORS = ['#7fd9c4', '#ff9ebb', '#ffcf5c', '#b39ddb', '#8fd18f', '#ffb37e'];

/* ---------------------------------------------------------------------
   2. UTILS
   --------------------------------------------------------------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const randRange = (a, b) => a + Math.random() * (b - a);
const choice = (arr) => arr[(Math.random() * arr.length) | 0];
const wrap = (x, m) => ((x % m) + m) % m;

function shadeColor(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function lerpColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(lerp(ar, br, t)), g = Math.round(lerp(ag, bg, t)), bl = Math.round(lerp(ab, bb, t));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + bl).toString(16).slice(1);
}

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* ---------------------------------------------------------------------
   3. AUDIO  (synthesized — no external files needed)
   --------------------------------------------------------------------- */
const Sound = (() => {
  let ctx = null;
  let musicOn = true;
  let musicTimer = null;
  let musicStep = 0;
  const pattern = [261.6, 0, 329.6, 0, 392.0, 349.2, 329.6, 0,
                    293.6, 0, 349.2, 0, 440.0, 392.0, 349.2, 0];

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay, glideTo) {
    try {
      const c = ensureCtx();
      const t0 = c.currentTime + (delay || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol == null ? 0.2 : vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    } catch (e) { /* audio not available — fail silently */ }
  }

  function playJump() { tone(560, 0.07, 'square', 0.16, 0, 840); tone(840, 0.05, 'sine', 0.08, 0.015); }
  function playLand() { tone(300, 0.06, 'sine', 0.1, 0, 210); }
  function playCollision() { tone(150, 0.18, 'sawtooth', 0.18, 0, 55); tone(85, 0.2, 'square', 0.14, 0.03); }
  function playPoint() { tone(660, 0.09, 'square', 0.16, 0, 880); tone(990, 0.13, 'sine', 0.14, 0.09); }
  function playResult(win) {
    const notes = win ? [523, 659, 784, 1047] : [392, 349, 311, 261];
    notes.forEach((f, i) => tone(f, 0.17, 'square', 0.15, i * 0.12));
  }
  function playTick() { tone(440, 0.06, 'square', 0.13); }
  function playGo() { tone(523, 0.05, 'square', 0.16); tone(784, 0.18, 'square', 0.2, 0.05, 1046); }
  function playClick() { tone(600, 0.045, 'square', 0.1); }

  function startMusic() {
    if (!musicOn || musicTimer) return;
    ensureCtx();
    musicTimer = setInterval(() => {
      const f = pattern[musicStep % pattern.length];
      if (f) tone(f, 0.18, 'sine', 0.045);
      musicStep++;
    }, 220);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function setMusicOn(v) { musicOn = v; if (v) startMusic(); else stopMusic(); }
  function isMusicOn() { return musicOn; }

  return {
    ensureCtx, playJump, playLand, playCollision, playPoint,
    playResult, playTick, playGo, playClick,
    startMusic, stopMusic, setMusicOn, isMusicOn,
  };
})();

/* ---------------------------------------------------------------------
   4. STORAGE / SETTINGS
   --------------------------------------------------------------------- */
const Storage = (() => {
  const LB_KEY = 'gravityRun_leaderboard_v1';
  const SET_KEY = 'gravityRun_settings_v1';

  function loadSettings() {
    try { return Object.assign({ musicOn: true }, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); }
    catch (e) { return { musicOn: true }; }
  }
  function saveSettings(s) { try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) {} }

  function loadLB() {
    try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveLB(list) { try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch (e) {} }

  function addResult(entry) {
    const list = loadLB();
    list.push(entry);
    list.sort((a, b) => b.score - a.score || b.survival - a.survival);
    saveLB(list.slice(0, 30));
    return list;
  }

  return { loadSettings, saveSettings, loadLB, addResult };
})();

/* ---------------------------------------------------------------------
   5. GAME STATE
   --------------------------------------------------------------------- */
const Game = {
  mode: null,            // '2P' | 'CPU'
  round: 1,
  scores: [0, 0],
  names: ['Player 1', 'Player 2'],
  track: { offset: 0, genX: 0, events: [] },   // ONE shared corridor
  dinos: [],
  speed: CFG.BASE_SPEED,
  roundPhase: 'idle',    // countdown | racing | epilogue | pointpause | matchover
  phaseT: 0,
  countdownIndex: 0,
  roundWinner: null,
  clock: 0,              // resets each round, used for flip cooldown timing
  matchClock: 0,         // accumulates across the whole match, for leaderboard
  shakeT: 0,
  shakeMag: 0,
  viewW: window.innerWidth,
  viewH: window.innerHeight,
  themeIdx: 0,
  prevThemeIdx: 0,
  themeBlendT: 1,        // 1 = fully settled on themeIdx, 0 = just started crossfading
};

function makeDino(color, isCPU, xOffset) {
  return {
    side: 'floor', state: 'run', flipT: 0, lastFlip: -99,
    legPhase: Math.random() * 10, color, isCPU: !!isCPU, xOffset,
    deathT: 0, deathKind: null, aiTimer: 0, particles: [], _counted: false,
  };
}

function currentTheme() { return THEMES[Game.themeIdx]; }

function getBlendedTheme() {
  if (Game.themeBlendT >= 1) return THEMES[Game.themeIdx];
  const t = easeInOutQuad(Game.themeBlendT);
  const from = THEMES[Game.prevThemeIdx], to = THEMES[Game.themeIdx];
  return {
    sky: [lerpColor(from.sky[0], to.sky[0], t), lerpColor(from.sky[1], to.sky[1], t), lerpColor(from.sky[2], to.sky[2], t)],
    blob: lerpColor(from.blob, to.blob, t),
    rail: lerpColor(from.rail, to.rail, t),
    accent: lerpColor(from.accent, to.accent, t),
    obstacle: lerpColor(from.obstacle, to.obstacle, t),
    obstacleDark: lerpColor(from.obstacleDark, to.obstacleDark, t),
    particle: lerpColor(from.particle, to.particle, t),
  };
}

/* ---------------------------------------------------------------------
   6. TRACK GENERATOR  (single shared corridor)
   --------------------------------------------------------------------- */
function generateMore() {
  const track = Game.track;
  const cushion = Game.viewW + CFG.GEN_AHEAD;
  const corridorMin = Math.max(190, CFG.CORRIDOR_MIN - (Game.round - 1) * CFG.DIFFICULTY_TIGHTEN);
  while (track.genX < track.offset + cushion) {
    track.genX += randRange(corridorMin, CFG.CORRIDOR_MAX);
    if (Math.random() < CFG.HAZARD_CHANCE) {
      const side = Math.random() < 0.5 ? 'floor' : 'ceiling';
      const roll = Math.random();
      let kind, width;
      if (roll < CFG.WALL_CHANCE) { kind = 'wall'; width = randRange(CFG.WALL_MIN, CFG.WALL_MAX); }
      else if (roll < CFG.WALL_CHANCE + 0.45) { kind = 'gap'; width = randRange(CFG.GAP_MIN, CFG.GAP_MAX); }
      else { kind = 'obstacle'; width = randRange(CFG.OBST_MIN, CFG.OBST_MAX); }
      track.events.push({ x0: track.genX, x1: track.genX + width, side, kind });
      track.genX += width;
    }
  }
}

function pruneOld() {
  const track = Game.track;
  while (track.events.length && track.events[0].x1 - track.offset < -80) track.events.shift();
}

function advanceTrack(dt) {
  Game.track.offset += Game.speed * dt;
  generateMore();
  pruneOld();
}

function hazardAt(side, worldX) {
  const events = Game.track.events;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.x0 > worldX) break;
    if (ev.side === side && worldX >= ev.x0 && worldX < ev.x1) return ev;
  }
  return null;
}

function nextHazardOnSide(side, fromX, maxDist) {
  const events = Game.track.events;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.side !== side) continue;
    if (ev.x1 <= fromX) continue;
    const dist = ev.x0 - fromX;
    if (dist > maxDist) return null;
    return ev;
  }
  return null;
}

function dinoScreenXPx() { return Game.viewW * CFG.DINO_SCREEN_X; }
function dinoWorldX() { return Game.track.offset + dinoScreenXPx(); }

/* ---------------------------------------------------------------------
   7. DINO
   --------------------------------------------------------------------- */
function flipDino(dino) {
  if (dino.state === 'dead') return;
  if (Game.clock - dino.lastFlip < CFG.FLIP_COOLDOWN) return;
  // INSTANT attach: side (and therefore collision) switches the moment you tap.
  // 'flipping' below only drives a short cosmetic hop/squash — never the position.
  dino.side = dino.side === 'floor' ? 'ceiling' : 'floor';
  dino.state = 'flipping';
  dino.flipT = 0;
  dino.lastFlip = Game.clock;
  Sound.playJump();
  // Re-check immediately: if you flip straight into a hazard on the new wall,
  // that's a real, instant hit — no invulnerability window.
  const ev = hazardAt(dino.side, dinoWorldX());
  if (ev) killDino(dino, ev.kind);
}

function killDino(dino, kind) {
  if (dino.state === 'dead') return;
  dino.state = 'dead';
  dino.deathKind = kind;
  dino.deathT = 0;
  Sound.playCollision();
  Game.shakeT = 0.28;
  Game.shakeMag = kind === 'obstacle' ? 10 : 6;
}

function spawnParticle(dino) {
  const rect = corridorRect();
  const { floorY, ceilY } = railYs(rect);
  const railY = dino.side === 'floor' ? floorY : ceilY;
  if (dino.particles.length > 16) dino.particles.shift();
  dino.particles.push({
    x: dinoScreenXPx() + dino.xOffset - 14, y: railY,
    vx: randRange(-40, -10), vy: randRange(-18, 18),
    life: 0.5, age: 0,
  });
}

function updateDino(dino, dt) {
  // particles always tick
  dino.particles.forEach((p) => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; });
  dino.particles = dino.particles.filter((p) => p.age < p.life);

  if (dino.state === 'dead') { dino.deathT += dt; return; }

  dino.legPhase += dt * (6 + Game.speed * 0.011);
  if (Math.random() < dt * 10) spawnParticle(dino);

  const ev = hazardAt(dino.side, dinoWorldX());
  if (ev) { killDino(dino, ev.kind); return; }

  if (dino.state === 'flipping') {
    dino.flipT += dt;
    if (dino.flipT >= CFG.FLIP_ANIM) { dino.state = 'run'; dino.flipT = 0; Sound.playLand(); }
  }

  if (dino.isCPU) updateAI(dino);
}

/* ---------------------------------------------------------------------
   11. AI  (kept near dino update for readability of call order above)
   --------------------------------------------------------------------- */
function updateAI(dino) {
  dino.aiTimer -= 1 / 60;
  if (dino.aiTimer > 0) return;
  dino.aiTimer = 0.09;

  const skill = clamp(0.5 + (Game.round - 1) * 0.14, 0.5, 0.92);
  const lookahead = 240 + skill * 150;
  const wx = dinoWorldX();
  const ev = nextHazardOnSide(dino.side, wx, lookahead + 260);
  if (!ev) return;

  const dist = ev.x0 - wx;
  const reactAt = lookahead * (0.55 + Math.random() * 0.45);
  if (dist <= reactAt) {
    const missChance = Math.max(0, 0.2 - skill * 0.18);
    if (Math.random() > missChance) flipDino(dino);
  }
}

/* ---------------------------------------------------------------------
   9. RENDER
   --------------------------------------------------------------------- */
let canvas, ctx;

function corridorRect() { return { top: 0, bottom: Game.viewH, height: Game.viewH }; }

function railYs(rect) {
  const inset = rect.height * CFG.LANE_MARGIN;
  return { floorY: rect.bottom - inset, ceilY: rect.top + inset };
}

function drawBackground(rect, theme) {
  const grad = ctx.createLinearGradient(0, rect.top, 0, rect.bottom);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(0.55, theme.sky[1]);
  grad.addColorStop(1, theme.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, rect.top, Game.viewW, rect.height);

  // Soft ambient glow blobs — radial gradients instead of a per-frame blur
  // filter (ctx.filter blur is very expensive at full canvas resolution and
  // was the main cause of frame-rate stutter/"slow motion" on larger PC screens).
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const bx = wrap(i * 340 + 140 - Game.track.offset * 0.05, Game.viewW + 400) - 200;
    const by = rect.top + rect.height * (0.14 + 0.7 * ((i * 53) % 100) / 100);
    const r = rect.height * 0.26;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, theme.blob + '55');
    g.addColorStop(1, theme.blob + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRailsAndHazards(rect, theme) {
  const { floorY, ceilY } = railYs(rect);
  const off = Game.track.offset;

  ['floor', 'ceiling'].forEach((side) => {
    const railY = side === 'floor' ? floorY : ceilY;
    ctx.save();
    ctx.strokeStyle = theme.rail;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    const spans = Game.track.events
      .filter((e) => e.side === side)
      .map((e) => ({ sx0: e.x0 - off, sx1: e.x1 - off, kind: e.kind }))
      .filter((e) => e.sx1 > -20 && e.sx0 < Game.viewW + 20);

    let cursor = 0;
    spans.sort((a, b) => a.sx0 - b.sx0).forEach((sp) => {
      if (sp.sx0 > cursor) {
        ctx.beginPath();
        ctx.moveTo(cursor, railY);
        ctx.lineTo(sp.sx0, railY);
        ctx.stroke();
      }
      if (sp.kind === 'gap') {
        ctx.save();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sp.sx0, railY);
        ctx.lineTo(sp.sx1, railY);
        ctx.stroke();
        ctx.restore();
      } else if (sp.kind === 'wall') {
        drawWall(sp.sx0, sp.sx1, railY, side, theme);
      } else {
        drawObstacle(sp.sx0, sp.sx1, railY, side, theme);
      }
      cursor = sp.sx1;
    });
    ctx.beginPath();
    ctx.moveTo(cursor, railY);
    ctx.lineTo(Game.viewW, railY);
    ctx.stroke();
    ctx.restore();
  });
}

function drawObstacle(sx0, sx1, railY, side, theme) {
  const w = sx1 - sx0;
  const h = clamp(w * 0.85, 28, 64);
  const dir = side === 'floor' ? -1 : 1;
  const cx = (sx0 + sx1) / 2;
  ctx.save();
  ctx.fillStyle = theme.obstacle;
  ctx.beginPath();
  ctx.moveTo(sx0, railY);
  ctx.lineTo(sx0 + w * 0.12, railY + dir * h);
  ctx.lineTo(cx - w * 0.12, railY + dir * h);
  ctx.quadraticCurveTo(cx, railY + dir * h * 1.12, cx + w * 0.12, railY + dir * h);
  ctx.lineTo(sx1 - w * 0.12, railY + dir * h);
  ctx.lineTo(sx1, railY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = theme.obstacleDark;
  ctx.beginPath();
  ctx.moveTo(cx, railY + dir * h * 1.02);
  ctx.lineTo(sx1 - w * 0.12, railY + dir * h);
  ctx.lineTo(sx1, railY);
  ctx.lineTo(cx, railY + dir * h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A narrow single-pillar "wall" — thinner and taller than a cluster obstacle,
// reads instantly at speed so it demands a precise, well-timed flip.
function drawWall(sx0, sx1, railY, side, theme) {
  const w = sx1 - sx0;
  const dir = side === 'floor' ? -1 : 1;
  const h = clamp(w * 2.6, 60, 96);
  const cx = (sx0 + sx1) / 2;
  ctx.save();
  ctx.fillStyle = theme.obstacleDark;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(sx0, Math.min(railY, railY + dir * h), w, h, w * 0.4);
    ctx.fill();
  } else {
    ctx.fillRect(sx0, Math.min(railY, railY + dir * h), w, h);
  }
  ctx.fillStyle = theme.obstacle;
  const stripeW = w * 0.4;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cx - stripeW / 2, Math.min(railY, railY + dir * h), stripeW, h, stripeW * 0.5);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(dino, theme) {
  ctx.save();
  dino.particles.forEach((p) => {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = theme.particle;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * a + 1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// Cute cartoon dino — big head, big sparkly eyes, round belly, stubby limbs.
function drawDino(x, railY, standingBelow, color, legPhase, state, flipT, deathT, deathKind) {
  ctx.save();
  ctx.translate(x, railY);
  if (!standingBelow) ctx.scale(1, -1);

  // Position is ALWAYS the resting rail position — the flip never moves it.
  // 'flipping' only drives a fast, snappy hop + squash/stretch flourish in place.
  let hop = 0, rot = 0, sx = 1, sy = 1;
  if (state === 'flipping') {
    const ft = clamp(flipT / CFG.FLIP_ANIM, 0, 1);
    const pop = Math.sin(ft * Math.PI);
    hop = -pop * CFG.HOP_HEIGHT;
    sx = 1 + pop * 0.16;
    sy = 1 - pop * 0.16;
    rot = Math.sin(ft * Math.PI * 1.4) * 0.1;
  }

  let fallY = 0, fallRot = 0, fallAlpha = 1;
  if (state === 'dead') {
    const t = clamp(deathT / CFG.DEATH_FALL_TIME, 0, 1);
    if (deathKind === 'gap') { fallY = t * t * 130; fallRot = t * 2.2; }
    else { fallY = t * t * 68; fallRot = -t * 1.9; }
    fallAlpha = 1 - Math.max(0, t - 0.6) / 0.4;
  }

  ctx.globalAlpha = fallAlpha;
  ctx.translate(0, hop + fallY);
  ctx.rotate(rot + fallRot);
  ctx.scale(sx, sy);

  const dark = shadeColor(color, -40);
  const light = shadeColor(color, 60);
  const legSwing = state !== 'dead' ? Math.sin(legPhase) * 0.4 : 0;

  const bodyW = 46, bodyH = 34;

  // short stubby legs — mostly tucked under the belly, just a peek of foot
  ctx.fillStyle = dark;
  [-1, 1].forEach((s) => {
    ctx.save();
    ctx.translate(s * 10, -2);
    ctx.rotate(s * legSwing * 0.3);
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-5, 0, 10, 8, 5); ctx.fill(); }
    else { ctx.fillRect(-5, 0, 10, 8); }
    ctx.beginPath();
    ctx.ellipse(0, 9, 6, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // stubby curled tail
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.42, -bodyH * 0.55);
  ctx.quadraticCurveTo(-bodyW * 0.86, -bodyH * 0.78, -bodyW * 0.78, -bodyH * 0.28);
  ctx.quadraticCurveTo(-bodyW * 0.58, -bodyH * 0.42, -bodyW * 0.42, -bodyH * 0.32);
  ctx.closePath();
  ctx.fill();

  // plump round body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -bodyH * 0.6, bodyW * 0.52, bodyH * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly patch
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(1, -bodyH * 0.42, bodyW * 0.3, bodyH * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // small rounded back bumps (cute, not spiky)
  ctx.fillStyle = dark;
  for (let i = 0; i < 3; i++) {
    const bx = -bodyW * 0.08 + i * 11;
    ctx.beginPath();
    ctx.ellipse(bx, -bodyH * 0.98, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // tiny arm
  ctx.fillStyle = dark;
  ctx.save();
  ctx.translate(bodyW * 0.14, -bodyH * 0.5);
  ctx.rotate(Math.sin(legPhase + 1.2) * 0.28);
  ctx.beginPath();
  ctx.ellipse(0, 7, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // big round head (oversized = cute proportions)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(bodyW * 0.44, -bodyH * 0.98, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // rounded snout
  ctx.beginPath();
  ctx.ellipse(bodyW * 0.68, -bodyH * 0.9, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // big sparkly eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bodyW * 0.5, -bodyH * 1.06, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2438';
  ctx.beginPath();
  ctx.arc(bodyW * 0.53, -bodyH * 1.05, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bodyW * 0.55, -bodyH * 1.08, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // blush
  ctx.fillStyle = 'rgba(255,120,140,0.32)';
  ctx.beginPath();
  ctx.ellipse(bodyW * 0.32, -bodyH * 0.86, 4, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(bodyW * 0.62, -bodyH * 0.88, 4, 0.15 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function renderDino(dino, rect) {
  if (dino.state === 'dead' && dino.deathT >= CFG.DEATH_FALL_TIME) return; // gone from screen
  const { floorY, ceilY } = railYs(rect);
  const railY = dino.side === 'floor' ? floorY : ceilY;   // instant — no lerp between rails
  const standingBelow = dino.side === 'floor';
  const x = dinoScreenXPx() + dino.xOffset;
  drawDino(x, railY, standingBelow, dino.color, dino.legPhase, dino.state, dino.flipT, dino.deathT, dino.deathKind);
}

function render() {
  const theme = getBlendedTheme();
  const rect = corridorRect();

  ctx.save();
  if (Game.shakeT > 0) {
    const m = Game.shakeMag * (Game.shakeT / 0.28);
    ctx.translate(randRange(-m, m), randRange(-m, m));
  }
  drawBackground(rect, theme);
  drawRailsAndHazards(rect, theme);
  Game.dinos.forEach((dino) => drawParticles(dino, theme));
  Game.dinos.forEach((dino) => renderDino(dino, rect));
  ctx.restore();
}

/* ---------------------------------------------------------------------
   10. ROUND / MATCH FLOW
   --------------------------------------------------------------------- */
function startRound() {
  Game.track.offset = 0;
  Game.track.genX = CFG.INITIAL_SAFE;
  Game.track.events = [];
  generateMore();

  Game.dinos.forEach((dino, i) => {
    dino.side = i === 0 ? 'floor' : 'ceiling'; // opposite walls, same corridor
    dino.state = 'run'; dino.flipT = 0; dino.lastFlip = -99;
    dino.legPhase = Math.random() * 5; dino.deathT = 0; dino.deathKind = null; dino.particles = [];
    dino.aiTimer = 0; dino._counted = false;
  });

  Game.speed = CFG.BASE_SPEED + (CFG.ROUND_SPEED_BONUS[Math.min(Game.round - 1, 2)] || CFG.ROUND_SPEED_BONUS[2]);
  Game.clock = 0;

  Game.prevThemeIdx = Game.themeIdx;
  Game.themeIdx = (Game.round - 1) % THEMES.length;
  Game.themeBlendT = Game.round === 1 ? 1 : 0; // first round: no crossfade needed

  Game.roundPhase = 'countdown';
  Game.phaseT = 0;
  Game.countdownIndex = -1; // -1 so the very first frame immediately shows "3"
  UI.showRoundBanner();
  UI.updateHud();
  Sound.playTick();
}

function updateMatch(dt) {
  if (Game.shakeT > 0) Game.shakeT = Math.max(0, Game.shakeT - dt);
  if (Game.themeBlendT < 1) Game.themeBlendT = Math.min(1, Game.themeBlendT + dt / CFG.THEME_BLEND_TIME);

  if (Game.roundPhase === 'countdown') {
    Game.dinos.forEach((d) => { d.legPhase += dt * 6; });
    Game.phaseT += dt;
    const stepIdx = Math.floor(Game.phaseT / CFG.COUNTDOWN_STEP);
    if (stepIdx !== Game.countdownIndex && stepIdx <= 3) {
      Game.countdownIndex = stepIdx;
      if (stepIdx < 3) Sound.playTick(); else Sound.playGo();
      UI.showCountdownStep(stepIdx);
    }
    if (Game.phaseT >= CFG.COUNTDOWN_STEP * 3 + CFG.GO_HOLD) {
      Game.roundPhase = 'racing';
      UI.hideCountdown();
    }
    return;
  }

  if (Game.roundPhase === 'racing') {
    Game.clock += dt;
    Game.matchClock += dt;
    Game.speed = Math.min(CFG.MAX_SPEED, Game.speed + CFG.SPEED_RAMP * dt);
    advanceTrack(dt);
    const deaths = [];
    Game.dinos.forEach((dino, i) => {
      updateDino(dino, dt);
      if (dino.state === 'dead' && !dino._counted) { dino._counted = true; deaths.push(i); }
    });
    if (deaths.length === 2) beginEpilogue(null);
    else if (deaths.length === 1) beginEpilogue(1 - deaths[0]);
    return;
  }

  if (Game.roundPhase === 'epilogue') {
    Game.phaseT += dt;
    advanceTrack(dt);
    Game.dinos.forEach((dino) => updateDino(dino, dt));
    if (Game.phaseT >= CFG.EPILOGUE_TIME) finishRound();
    return;
  }

  if (Game.roundPhase === 'pointpause') {
    Game.phaseT += dt;
    Game.dinos.forEach((dino) => {
      dino.particles.forEach((p) => { p.age += dt; });
      dino.particles = dino.particles.filter((p) => p.age < p.life);
    });
    if (Game.phaseT >= CFG.POINT_PAUSE_TIME) nextRoundOrEnd();
    return;
  }
}

function beginEpilogue(winnerIdx) {
  Game.roundPhase = 'epilogue';
  Game.phaseT = 0;
  Game.roundWinner = winnerIdx;
}

function finishRound() {
  if (Game.roundWinner != null) {
    Game.scores[Game.roundWinner]++;
    Sound.playPoint();
    UI.showPointPopup(Game.roundWinner);
  }
  UI.updateHud();
  Game.roundPhase = 'pointpause';
  Game.phaseT = 0;
}

function nextRoundOrEnd() {
  UI.hidePointPopup();
  if (Game.round < 3) { Game.round++; startRound(); return; }
  if (Game.scores[0] === Game.scores[1]) { Game.round++; startRound(); return; }
  endMatch();
}

function endMatch() {
  Game.roundPhase = 'matchover';
  const winnerIdx = Game.scores[0] > Game.scores[1] ? 0 : 1;
  saveMatchResults(winnerIdx);
  UI.showMatchResult(winnerIdx);
}

function saveMatchResults(winnerIdx) {
  const modeLabel = Game.mode === 'CPU' ? 'VS COMPUTER' : '2 PLAYER';
  Storage.addResult({
    name: Game.names[0], mode: modeLabel, score: Game.scores[0],
    survival: Game.matchClock, won: winnerIdx === 0, date: Date.now(),
  });
  if (Game.mode === '2P') {
    Storage.addResult({
      name: Game.names[1], mode: modeLabel, score: Game.scores[1],
      survival: Game.matchClock, won: winnerIdx === 1, date: Date.now(),
    });
  }
  try {
    if (window.Arcadia) {
      const winnerScore = Game.scores[winnerIdx];
      Arcadia.submitScore('gravity-run', 'Gravity Run', winnerScore);
    }
  } catch (e) {}
}

function beginMatch(mode, names) {
  Game.mode = mode;
  Game.names = names;
  Game.scores = [0, 0];
  Game.round = 1;
  Game.matchClock = 0;
  Game.themeIdx = 0;
  Game.prevThemeIdx = 0;
  Game.themeBlendT = 1;
  const colorP1 = DINO_COLORS[0];
  const colorP2 = DINO_COLORS[1];
  Game.dinos = [
    makeDino(colorP1, false, -CFG.DINO_X_GAP / 2),
    makeDino(colorP2, mode === 'CPU', CFG.DINO_X_GAP / 2),
  ];
  UI.enterGameScreen();
  startRound();
}

/* ---------------------------------------------------------------------
   12 & 13. UI SCREENS + LEADERBOARD (DOM wiring)
   --------------------------------------------------------------------- */
const UI = (() => {
  let els = {};

  function cacheEls() {
    els = {
      screens: document.querySelectorAll('.screen'),
      menu: document.getElementById('screen-menu'),
      nameEntry: document.getElementById('screen-name'),
      settings: document.getElementById('screen-settings'),
      howto: document.getElementById('screen-howto'),
      leaderboard: document.getElementById('screen-leaderboard'),
      gameScreen: document.getElementById('screen-game'),
      matchResult: document.getElementById('screen-result'),

      nameTitle: document.getElementById('name-title'),
      nameP1Wrap: document.getElementById('name-p1-wrap'),
      nameP2Wrap: document.getElementById('name-p2-wrap'),
      nameP1: document.getElementById('name-p1'),
      nameP2: document.getElementById('name-p2'),
      nameStart: document.getElementById('name-start'),

      musicToggle: document.getElementById('music-toggle'),

      hud: document.getElementById('hud'),
      scoreP1: document.getElementById('score-p1'),
      scoreP2: document.getElementById('score-p2'),
      roundLabel: document.getElementById('round-label'),
      pauseBtn: document.getElementById('pause-btn'),

      roundBanner: document.getElementById('round-banner'),
      roundBannerTitle: document.getElementById('round-banner-title'),
      countdownEl: document.getElementById('countdown'),

      pointPopupP1: document.getElementById('point-popup-p1'),
      pointPopupP2: document.getElementById('point-popup-p2'),

      resultTitle: document.getElementById('result-title'),
      resultScore: document.getElementById('result-score'),

      leftZone: document.getElementById('zone-left'),
      rightZone: document.getElementById('zone-right'),

      pauseOverlay: document.getElementById('pause-overlay'),

      lbList: document.getElementById('lb-list'),

      howtoTrack: document.getElementById('howto-track'),
    };
  }

  function showScreen(id) {
    els.screens.forEach((s) => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function goMenu() {
    Sound.playClick();
    showScreen('screen-menu');
  }

  function openNameEntry(mode) {
    Sound.ensureCtx();
    Sound.playClick();
    pendingMode = mode;
    if (mode === '2P') {
      els.nameTitle.textContent = 'WHO’S RACING?';
      els.nameP1Wrap.style.display = '';
      els.nameP2Wrap.style.display = '';
    } else {
      els.nameTitle.textContent = 'ENTER YOUR NAME';
      els.nameP1Wrap.style.display = '';
      els.nameP2Wrap.style.display = 'none';
    }
    showScreen('screen-name');
    els.nameP1.focus();
  }

  let pendingMode = null;

  function confirmNames() {
    const p1 = (els.nameP1.value || '').trim().slice(0, 14) || 'Player 1';
    let names;
    if (pendingMode === '2P') {
      const p2 = (els.nameP2.value || '').trim().slice(0, 14) || 'Player 2';
      names = [p1, p2];
    } else {
      names = [p1, 'Computer'];
    }
    Sound.playClick();
    Sound.startMusic();
    beginMatch(pendingMode, names);
  }

  function enterGameScreen() {
    showScreen('screen-game');
  }

  function updateHud() {
    els.scoreP1.textContent = Game.scores[0];
    els.scoreP2.textContent = Game.scores[1];
    els.roundLabel.textContent = Game.round > 3 ? 'SUDDEN DEATH' : 'ROUND ' + Game.round + ' / 3';
  }

  function showRoundBanner() {
    // No environment name is ever shown — just the round number. The
    // environment itself crossfades in on its own (see THEME_BLEND_TIME).
    els.roundBannerTitle.textContent = Game.round > 3 ? 'SUDDEN DEATH' : 'ROUND ' + Game.round;
    els.roundBanner.classList.add('show');
    els.countdownEl.classList.add('show');
    els.countdownEl.textContent = '';
    setTimeout(() => els.roundBanner.classList.remove('show'), 1400);
  }

  function showCountdownStep(idx) {
    const labels = ['3', '2', '1', 'GO!'];
    const el = els.countdownEl;
    el.textContent = labels[Math.min(idx, 3)];
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  function hideCountdown() {
    els.countdownEl.classList.remove('show');
  }

  function showPointPopup(winnerIdx) {
    const el = winnerIdx === 0 ? els.pointPopupP1 : els.pointPopupP2;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  function hidePointPopup() {
    els.pointPopupP1.classList.remove('show');
    els.pointPopupP2.classList.remove('show');
  }

  function showMatchResult(winnerIdx) {
    let title;
    if (Game.mode === 'CPU') title = winnerIdx === 0 ? 'YOU WON!' : 'COMPUTER WINS!';
    else title = Game.names[winnerIdx].toUpperCase() + ' WINS!';
    els.resultTitle.textContent = title;
    els.resultScore.textContent = Game.names[0] + ' ' + Game.scores[0] + ' — ' + Game.scores[1] + ' ' + Game.names[1];
    Sound.playResult(Game.mode !== 'CPU' || winnerIdx === 0);
    setTimeout(() => showScreen('screen-result'), 500);
  }

  function playAgain() {
    Sound.playClick();
    beginMatch(Game.mode, Game.names);
  }

  function openSettings() {
    Sound.playClick();
    els.musicToggle.checked = Sound.isMusicOn();
    showScreen('screen-settings');
  }

  function toggleMusic() {
    const on = els.musicToggle.checked;
    Sound.setMusicOn(on);
    const s = Storage.loadSettings();
    s.musicOn = on;
    Storage.saveSettings(s);
  }

  const howtoSteps = [
    { emoji: '🦖', text: 'Tap the screen to switch gravity and stay on track.', cls: 'demo-flip' },
    { emoji: '🦕', text: 'Time your taps carefully to avoid falling into gaps.', cls: 'demo-gap' },
    { emoji: '🦖', text: 'Watch out for obstacles — they can end your run too.', cls: 'demo-obstacle' },
    { emoji: '🦕', text: 'The longer you survive, the faster the game gets.', cls: 'demo-speed' },
    { emoji: '🦖🦕', text: 'Survive longer than your opponent to win the round. Win more rounds to win the match!', cls: 'demo-vs' },
  ];
  let howtoIdx = 0;

  function openHowTo() {
    Sound.playClick();
    howtoIdx = 0;
    renderHowTo();
    showScreen('screen-howto');
  }

  function renderHowTo() {
    const step = howtoSteps[howtoIdx];
    els.howtoTrack.innerHTML =
      '<div class="howto-visual ' + step.cls + '"><span class="howto-emoji">' + step.emoji + '</span></div>' +
      '<p class="howto-text">' + step.text + '</p>' +
      '<div class="howto-dots">' + howtoSteps.map((_, i) => '<span class="dot' + (i === howtoIdx ? ' on' : '') + '"></span>').join('') + '</div>';
    document.getElementById('howto-next').textContent = howtoIdx === howtoSteps.length - 1 ? 'DONE' : 'NEXT';
  }

  function howtoNext() {
    Sound.playClick();
    if (howtoIdx < howtoSteps.length - 1) { howtoIdx++; renderHowTo(); }
    else goMenu();
  }

  function openLeaderboard() {
    Sound.playClick();
    const list = Storage.loadLB();
    if (!list.length) {
      els.lbList.innerHTML = '<p class="lb-empty">No races yet — go set a record!</p>';
    } else {
      els.lbList.innerHTML = list.slice(0, 10).map((e, i) =>
        '<div class="lb-row"><span class="lb-rank">#' + (i + 1) + '</span>' +
        '<span class="lb-name">' + escapeHtml(e.name) + '</span>' +
        '<span class="lb-mode">' + escapeHtml(e.mode) + '</span>' +
        '<span class="lb-score">' + e.score + ' pts</span>' +
        '<span class="lb-time">' + formatTime(e.survival) + '</span></div>'
      ).join('');
    }
    showScreen('screen-leaderboard');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function togglePause() {
    if (Game.roundPhase === 'matchover' || Game.roundPhase === 'idle') return;
    const showing = els.pauseOverlay.classList.toggle('show');
    Game.paused = showing;
  }

  function quitToMenu() {
    els.pauseOverlay.classList.remove('show');
    Game.paused = false;
    Game.roundPhase = 'idle';
    goMenu();
  }

  return {
    cacheEls, showScreen, goMenu, openNameEntry, confirmNames, enterGameScreen,
    updateHud, showRoundBanner, showCountdownStep, hideCountdown,
    showPointPopup, hidePointPopup, showMatchResult, playAgain,
    openSettings, toggleMusic, openHowTo, howtoNext, openLeaderboard,
    togglePause, quitToMenu,
    get els() { return els; },
  };
})();

/* ---------------------------------------------------------------------
   INPUT
   --------------------------------------------------------------------- */
function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (Game.roundPhase !== 'racing' || Game.paused) return;
    const k = e.key.toLowerCase();
    if (Game.mode === '2P') {
      if (k === 'w') flipDino(Game.dinos[0]);
      if (k === 'arrowup') flipDino(Game.dinos[1]);
    } else if (Game.mode === 'CPU') {
      if (k === ' ' || k === 'w' || k === 'arrowup') flipDino(Game.dinos[0]);
    }
  });

  function zoneHandler(zoneIdx) {
    return (e) => {
      e.preventDefault();
      if (Game.roundPhase !== 'racing' || Game.paused) return;
      if (Game.mode === '2P') flipDino(Game.dinos[zoneIdx]);
      else if (Game.mode === 'CPU') flipDino(Game.dinos[0]);
    };
  }
  UI.els.leftZone.addEventListener('pointerdown', zoneHandler(0));
  UI.els.rightZone.addEventListener('pointerdown', zoneHandler(1));
}

/* ---------------------------------------------------------------------
   14. MAIN LOOP
   --------------------------------------------------------------------- */
let lastT = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  Game.viewW = w;
  Game.viewH = h;
}

function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.035, (t - lastT) / 1000 || 0);
  lastT = t;
  if (Game.roundPhase === 'idle' || Game.paused) return;
  updateMatch(dt);
  render();
}

/* ---------------------------------------------------------------------
   15. INIT
   --------------------------------------------------------------------- */
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  UI.cacheEls();
  resize();
  window.addEventListener('resize', resize);
  setupInput();

  const settings = Storage.loadSettings();
  Sound.setMusicOn(settings.musicOn);

  // Browsers block audio until a real user gesture — start music on the very
  // first tap/click/keypress anywhere so it covers the whole game, not just matches.
  function unlockAudioOnce() {
    Sound.ensureCtx();
    Sound.startMusic();
    window.removeEventListener('pointerdown', unlockAudioOnce);
    window.removeEventListener('keydown', unlockAudioOnce);
  }
  window.addEventListener('pointerdown', unlockAudioOnce);
  window.addEventListener('keydown', unlockAudioOnce);

  document.getElementById('btn-2p').addEventListener('click', () => UI.openNameEntry('2P'));
  document.getElementById('btn-cpu').addEventListener('click', () => UI.openNameEntry('CPU'));
  document.getElementById('btn-settings').addEventListener('click', UI.openSettings);
  document.getElementById('btn-howto').addEventListener('click', UI.openHowTo);
  document.getElementById('btn-leaderboard').addEventListener('click', UI.openLeaderboard);

  document.getElementById('name-start').addEventListener('click', UI.confirmNames);
  document.getElementById('name-back').addEventListener('click', UI.goMenu);
  [UI.els.nameP1, UI.els.nameP2].forEach((inp) => {
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') UI.confirmNames(); });
  });

  document.getElementById('settings-back').addEventListener('click', UI.goMenu);
  UI.els.musicToggle.addEventListener('change', UI.toggleMusic);

  document.getElementById('howto-next').addEventListener('click', UI.howtoNext);
  document.getElementById('howto-back').addEventListener('click', UI.goMenu);

  document.getElementById('lb-back').addEventListener('click', UI.goMenu);

  document.getElementById('result-again').addEventListener('click', UI.playAgain);
  document.getElementById('result-menu').addEventListener('click', UI.goMenu);

  UI.els.pauseBtn.addEventListener('click', UI.togglePause);
  document.getElementById('resume-btn').addEventListener('click', UI.togglePause);
  document.getElementById('quit-btn').addEventListener('click', UI.quitToMenu);

  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', init);
