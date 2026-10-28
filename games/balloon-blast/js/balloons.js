/**
 * balloons.js
 * ------------------------------------------------------------------
 * Defines every balloon TYPE (points, special effect, spawn weight,
 * emoji) and the Balloon class that represents one balloon on screen.
 *
 * Balloons are rendered as plain positioned <div>s with an emoji as
 * their content and all visuals set via inline styles — your CSS
 * files don't define per-type gameplay balloon classes, so this
 * keeps everything working without any CSS changes.
 *
 * This file does NOT run the game loop or handle clicks — it only
 * knows how to create/position a balloon. movement.js animates them,
 * collision.js handles popping them.
 * ------------------------------------------------------------------
 */

// Every non-boss balloon type. `weight` is relative spawn probability
// (they don't need to sum to 100 — pickRandomType() normalizes them).
// `art` points at the matching illustration in Assets/balloons/ — the
// `emoji` field is kept as a lightweight fallback in case an image
// ever fails to load (see _buildElement's onerror handler below).
const BALLOON_TYPES = {
  red: { id: 'red', emoji: '🔴', art: 'Assets/balloons/red_balloon.svg', points: 1, weight: 35, effect: null },
  green: { id: 'green', emoji: '🟢', art: 'Assets/balloons/green_balloon.svg', points: 2, weight: 22, effect: null },
  gold: { id: 'gold', emoji: '🟡', art: 'Assets/balloons/gold_balloon.svg', points: 5, weight: 10, effect: null },
  bomb: { id: 'bomb', emoji: '💣', art: 'Assets/balloons/bomb_balloon.svg', points: -3, weight: 12, effect: 'bomb' },
  blue: { id: 'blue', emoji: '⏰', art: 'Assets/balloons/blue_time_balloon.svg', points: 0, weight: 8, effect: 'time', timeBonusSec: 5 },
  lightning: { id: 'lightning', emoji: '⚡', art: 'Assets/balloons/lightning_balloon.svg', points: 0, weight: 5, effect: 'doubleScore', durationSec: 10 },
  heart: { id: 'heart', emoji: '❤️', art: 'Assets/balloons/heart_balloon.svg', points: 0, weight: 5, effect: 'heart' },
  mystery: { id: 'mystery', emoji: '🎁', art: 'Assets/balloons/mystery_balloon.svg', points: 0, weight: 5, effect: 'mystery' },
  // Boss is spawned explicitly by boss.js, never picked by the weighted
  // random roll below (weight: 0), but lives here so all balloon
  // rendering logic stays in one place.
  boss: { id: 'boss', emoji: '👑', art: 'Assets/balloons/boss_balloon.svg', points: 25, weight: 0, effect: 'boss' },
};

const SPAWNABLE_TYPES = Object.values(BALLOON_TYPES).filter((t) => t.weight > 0);
const TOTAL_WEIGHT = SPAWNABLE_TYPES.reduce((sum, t) => sum + t.weight, 0);

/** Weighted-random pick of a non-boss balloon type. */
function pickRandomType() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const type of SPAWNABLE_TYPES) {
    roll -= type.weight;
    if (roll <= 0) return type;
  }
  return SPAWNABLE_TYPES[0]; // fallback, should never hit
}

let nextBalloonId = 1;

/** Represents a single balloon on screen. */
class Balloon {
  /**
   * @param {object} type - one of BALLOON_TYPES.*
   * @param {HTMLElement} container - the #game-area element balloons live in
   * @param {number} x - left position in px within the container
   * @param {number} size - width/height in px
   * @param {number} speed - upward travel speed in px/sec
   * @param {number} [hitsRequired] - clicks needed to pop (Boss Balloons only; default 1)
   */
  constructor(type, container, x, size, speed, hitsRequired = 1) {
    this.id = nextBalloonId++;
    this.type = type;
    this.container = container;
    this.size = size;
    this.speed = speed;
    this.hitsRequired = hitsRequired;
    this.hitsTaken = 0;
    this.popped = false;
    this.x = x;
    this.y = -size; // starts just below the visible area, floats upward

    this.el = this._buildElement();
    container.appendChild(this.el);
    this._applyPosition();
  }

  _buildElement() {
    const el = document.createElement('div');
    el.className = 'game-balloon';
    el.dataset.balloonId = String(this.id);
    el.dataset.type = this.type.id;

    Object.assign(el.style, {
      position: 'absolute',
      left: '0px',
      bottom: '0px',
      width: `${this.size}px`,
      height: `${this.size}px`,
      backgroundImage: `url('${this.type.art}')`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      willChange: 'transform',
      filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.25))',
      transition: 'transform 0.1s ease-out',
    });

    // If the SVG ever 404s (bad path, missing file), fall back to the
    // emoji glyph so the balloon is still visible and clickable rather
    // than an invisible blank square. We test the image with a throwaway
    // <img>, since background-image has no load/error event of its own.
    const probe = new Image();
    probe.onerror = () => {
      el.style.backgroundImage = 'none';
      el.textContent = this.type.emoji;
      Object.assign(el.style, {
        fontSize: `${Math.round(this.size * 0.62)}px`,
        lineHeight: `${this.size}px`,
        textAlign: 'center',
      });
    };
    probe.src = this.type.art;

    // Boss balloons get a subtle glow ring so they read as "special".
    if (this.type.id === 'boss') {
      el.style.filter += ' drop-shadow(0 0 14px rgba(255, 201, 60, 0.9))';
    }

    return el;
  }

  /** Pushes the current x/y values to the actual DOM element. */
  _applyPosition() {
    this.el.style.left = `${this.x}px`;
    this.el.style.bottom = `${this.y}px`;
  }

  /** Called every animation frame by movement.js with the new y (bottom px). */
  setY(y) {
    this.y = y;
    this.el.style.bottom = `${y}px`;
  }

  /** Bounding box in container-local px, used for overlap + hit checks. */
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.size,
      top: this.y,
      bottom: this.y + this.size,
    };
  }

  /** True once the balloon has fully passed the top of the container (missed). */
  hasLeftContainer(containerHeight) {
    return this.y > containerHeight;
  }

  /** Registers one hit; returns true once enough hits landed to pop it. */
  registerHit() {
    this.hitsTaken += 1;
    return this.hitsTaken >= this.hitsRequired;
  }

  /** Removes the balloon's element from the DOM. */
  destroy() {
    this.el.remove();
  }
}

/**
 * Picks a spawn position that avoids overlapping any currently active
 * balloon, trying a handful of random x values before giving up and
 * accepting the last one (so spawning never stalls if the area is full).
 */
function findNonOverlappingX(container, size, activeBalloons, maxAttempts = 8) {
  const containerWidth = container.clientWidth;
  const maxX = Math.max(0, containerWidth - size);
  let candidateX = Math.random() * maxX;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    candidateX = Math.random() * maxX;
    const overlaps = activeBalloons.some((b) => {
      // Only worry about balloons still near the bottom (recently
      // spawned) — ones already high up can't collide with a new spawn.
      if (b.y > size * 1.5) return false;
      return candidateX < b.x + b.size && candidateX + size > b.x;
    });
    if (!overlaps) break;
  }
  return candidateX;
}

/**
 * Spawns one new balloon inside `container`, using difficulty config
 * for size/speed ranges, and avoiding overlap with `activeBalloons`.
 *
 * @param {HTMLElement} container - #game-area
 * @param {object} config - result of DifficultyManager.getConfigForLevel()
 * @param {Balloon[]} activeBalloons - currently-alive balloons (for overlap avoidance)
 * @returns {Balloon}
 */
function spawnBalloon(container, config, activeBalloons) {
  const type = pickRandomType();
  const [minSize, maxSize] = config.balloonSizeRange;
  const size = minSize + Math.random() * (maxSize - minSize);
  const [minSpeed, maxSpeed] = config.speedRange;
  const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  const x = findNonOverlappingX(container, size, activeBalloons);

  return new Balloon(type, container, x, size, speed);
}

/**
 * Spawns a Boss Balloon (larger, requires multiple hits, worth more).
 * Called directly by boss.js when its own spawn-chance roll succeeds.
 */
function spawnBossBalloon(container, config, activeBalloons) {
  const type = BALLOON_TYPES.boss;
  const [minSize, maxSize] = config.balloonSizeRange;
  const size = (maxSize + minSize) * 0.75; // bosses are noticeably bigger
  const [minSpeed, maxSpeed] = config.speedRange;
  const speed = (minSpeed + maxSpeed) / 2 * 0.6; // and slower, to allow multiple clicks
  const x = findNonOverlappingX(container, size, activeBalloons);

  return new Balloon(type, container, x, size, speed, config.bossHitsRequired);
}