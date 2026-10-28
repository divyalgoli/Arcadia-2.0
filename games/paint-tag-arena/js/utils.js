// utils.js
// Pure helper functions and shared constants used across the game.
// This file contains NO game state — only stateless math/helper utilities
// and small audio helper wrappers.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TILE_SIZE = 48;

const PLAYER_SIZE = 32;

const ROLES = {
  TAGGER: 'tagger',
  RUNNER: 'runner',
};

const POWERUP_TYPES = {
  SPEED_BOOST: 'speedBoost',
  SHIELD: 'shield',
  DOUBLE_DASH: 'doubleDash',
  FREEZE_TRAP: 'freezeTrap',
};

// Base movement tuning values, referenced by player.js
const MOVEMENT = {
  ACCELERATION: 1800,   // px/s^2
  FRICTION: 1400,       // px/s^2
  MAX_SPEED: 260,        // px/s
  DASH_SPEED: 620,        // px/s while dashing
  DASH_DURATION: 0.18,   // seconds
  DASH_COOLDOWN: 1.6,    // seconds
};

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/** Returns a random float between min (inclusive) and max (exclusive). */
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** Returns a random integer between min and max, inclusive. */
function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

/** Picks a random element from an array. */
function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

/** Euclidean distance between two points. */
function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Clamps a value between min and max. */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b by t (0..1). */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Angle in radians from point a to point b. */
function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/** Normalizes a 2D vector, returning {x, y}. Safe against zero-length vectors. */
function normalizeVector(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

// ---------------------------------------------------------------------------
// Collision helpers
// ---------------------------------------------------------------------------

/**
 * Axis-aligned bounding box intersection test.
 * Each rect is {x, y, width, height} where x,y is the top-left corner.
 */
function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Returns the overlap amount (positive = overlapping) on each axis. */
function rectOverlap(a, b) {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return { overlapX, overlapY };
}

/** Circle-vs-circle collision test, used for tag detection. */
function circlesIntersect(ax, ay, aRadius, bx, by, bRadius) {
  return distance(ax, ay, bx, by) < aRadius + bRadius;
}

// ---------------------------------------------------------------------------
// Timing / cooldown helpers
// ---------------------------------------------------------------------------

/**
 * Simple cooldown tracker.
 * Usage: const cd = createCooldown(1.5); cd.trigger(); cd.tick(dt); cd.isReady();
 */
function createCooldown(duration) {
  return {
    duration,
    remaining: 0,
    trigger(customDuration) {
      this.remaining = customDuration ?? this.duration;
    },
    tick(dt) {
      if (this.remaining > 0) {
        this.remaining = Math.max(0, this.remaining - dt);
      }
    },
    isReady() {
      return this.remaining <= 0;
    },
    percentRemaining() {
      return this.duration > 0 ? this.remaining / this.duration : 0;
    },
  };
}

/** Tracks delta-time between animation frames, in seconds, capped to avoid spiral of death. */
function createFrameClock(maxDeltaSeconds = 0.05) {
  let lastTime = performance.now();
  return {
    tick() {
      const now = performance.now();
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > maxDeltaSeconds) dt = maxDeltaSeconds;
      return dt;
    },
    reset() {
      lastTime = performance.now();
    },
  };
}

// ---------------------------------------------------------------------------
// Round duration preference persistence
// ---------------------------------------------------------------------------

const ROUND_DURATION_STORAGE_KEY = 'cyberArenaTagRoundDuration';
const DEFAULT_ROUND_DURATION_SECONDS = 30;
const ROUND_DURATION_OPTIONS = [30, 60, 120];
let _inMemoryRoundDuration = null; // fallback if localStorage is unavailable

/** Returns the saved round-length preference in seconds (30, 60, or 120), defaulting to 30. */
function getRoundDurationPref() {
  if (_inMemoryRoundDuration) return _inMemoryRoundDuration;
  let value = DEFAULT_ROUND_DURATION_SECONDS;
  try {
    const raw = localStorage.getItem(ROUND_DURATION_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (ROUND_DURATION_OPTIONS.includes(parsed)) value = parsed;
  } catch (err) {
    // localStorage unavailable — fall back to the default below.
  }
  _inMemoryRoundDuration = value;
  return value;
}

/** Persists the chosen round-length preference in seconds. */
function setRoundDurationPref(seconds) {
  _inMemoryRoundDuration = seconds;
  try {
    localStorage.setItem(ROUND_DURATION_STORAGE_KEY, String(seconds));
  } catch (err) {
    // localStorage unavailable — in-memory copy above still keeps it for this session.
  }
}

// ---------------------------------------------------------------------------
// Leaderboard persistence
// ---------------------------------------------------------------------------

const LEADERBOARD_STORAGE_KEY = 'cyberArenaTagLeaderboard';
let _inMemoryLeaderboard = null; // fallback if localStorage is unavailable (e.g. some file:// contexts)

/** Returns the current leaderboard as an array of { name, score, date }, most recent load cached in memory. */
function getLeaderboard() {
  if (_inMemoryLeaderboard) return _inMemoryLeaderboard;
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    _inMemoryLeaderboard = raw ? JSON.parse(raw) : [];
  } catch (err) {
    _inMemoryLeaderboard = [];
  }
  return _inMemoryLeaderboard;
}

/** Records a completed match's winner/score, keeps the top 10 by score, and persists it. */
function recordMatchResult(winnerLabel, winnerScore) {
  if (window.Arcadia) Arcadia.submitScore('paint-tag-arena', 'Paint Tag Arena', winnerScore);
  const list = getLeaderboard().slice();
  list.push({ name: winnerLabel, score: winnerScore, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, 10);
  _inMemoryLeaderboard = trimmed;
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    // localStorage unavailable — in-memory copy above still keeps it for this session.
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Audio helpers
// ---------------------------------------------------------------------------

/**
 * Loads an image (used for power-up icons drawn on the canvas) and returns
 * the HTMLImageElement immediately. The image draws as soon as it finishes
 * loading — canvas draw calls just no-op harmlessly on an incomplete image.
 */
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

/**
 * Loads an audio file and returns an HTMLAudioElement.
 * Volume defaults to 1.0, loop defaults to false.
 */
function loadAudio(src, { volume = 1.0, loop = false } = {}) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.loop = loop;
  audio.preload = 'auto';
  return audio;
}

/**
 * Plays a sound effect from scratch (rewinds first so rapid re-triggers work).
 * Swallows autoplay-policy rejections so the game loop never crashes on audio.
 */
function playSound(audioElement) {
  if (!audioElement) return;
  try {
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay was blocked or the sound failed to play — ignore silently.
      });
    }
  } catch (err) {
    // Ignore playback errors (e.g. unsupported format).
  }
}

/** Fades an audio element's volume from its current value to target over durationMs. */
function fadeAudio(audioElement, targetVolume, durationMs = 500) {
  if (!audioElement) return;
  const startVolume = audioElement.volume;
  const startTime = performance.now();

  function step(now) {
    const t = clamp((now - startTime) / durationMs, 0, 1);
    audioElement.volume = lerp(startVolume, targetVolume, t);
    if (t < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers (Paint Tag Arena visual theme)
// Pure rendering utilities — no gameplay/physics logic. Used by player.js
// and game.js to draw the paintball-style mascots, bunkers, and power-ups.
// ---------------------------------------------------------------------------

/** Traces a rounded-rectangle path on the given context (does not fill/stroke). */
function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/**
 * Lightens (positive amount) or darkens (negative amount) a hex color by a
 * percentage, returning a new hex string. Used to derive shadow/accent
 * shades from a player's base paint color without hardcoding a palette.
 */
function shadeHexColor(hex, percent) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
  let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

/**
 * Draws a single wall/obstacle rect as a paintball-arena bunker: a wooden
 * crate look with a border frame, cross-brace planks, and corner bolts.
 * Purely cosmetic — called with the exact same x/y/width/height rect that
 * collision.js already uses for resolution, so hitboxes are untouched.
 */
function drawBunkerRect(ctx, x, y, width, height) {
  const isThinWall = width > height * 3 || height > width * 3; // long thin arena border wall
  ctx.save();

  if (isThinWall) {
    // Arena boundary wall — painted plank fence look
    ctx.fillStyle = '#C97B3D';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#7A4A22';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    if (width >= height) {
      for (let px = x; px < x + width; px += 26) {
        ctx.fillRect(px, y + 2, 2, height - 4);
      }
    } else {
      for (let py = y; py < y + height; py += 26) {
        ctx.fillRect(x + 2, py, width - 4, 2);
      }
    }
  } else {
    // Freestanding obstacle — wooden crate / bunker block
    const r = Math.min(10, width / 4, height / 4);
    roundRectPath(ctx, x, y, width, height, r);
    ctx.fillStyle = '#D89456';
    ctx.fill();
    ctx.strokeStyle = '#7A4A22';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cross-brace planks
    ctx.strokeStyle = 'rgba(122, 74, 34, 0.55)';
    ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.06);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.12, y + height * 0.12);
    ctx.lineTo(x + width * 0.88, y + height * 0.88);
    ctx.moveTo(x + width * 0.88, y + height * 0.12);
    ctx.lineTo(x + width * 0.12, y + height * 0.88);
    ctx.stroke();

    // Corner bolts
    ctx.fillStyle = '#4A2E14';
    const bolt = Math.max(2, Math.min(width, height) * 0.06);
    const inset = Math.min(width, height) * 0.16;
    [[x + inset, y + inset], [x + width - inset, y + inset],
     [x + inset, y + height - inset], [x + width - inset, y + height - inset]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, bolt, 0, Math.PI * 2);
      ctx.fill();
    });

    // A little paint-splatter accent so it reads as "paintball arena" not just "crate"
    ctx.fillStyle = 'rgba(255, 122, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(x + width * 0.75, y + height * 0.28, Math.min(width, height) * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
