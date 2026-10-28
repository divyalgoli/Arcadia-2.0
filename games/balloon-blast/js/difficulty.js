/**
 * difficulty.js
 * ------------------------------------------------------------------
 * Defines the three difficulty presets (Easy / Normal / Hard) and the
 * "level" system that gradually ramps difficulty up further *within*
 * a single round as the player's score climbs.
 *
 * game.js calls `getConfigForLevel(level)` on every spawn cycle to
 * know how fast to spawn, how fast/big balloons should be, and how
 * likely a Boss Balloon is right now.
 * ------------------------------------------------------------------
 */

// Every this-many points, the in-round level increases by 1.
const LEVEL_UP_SCORE_STEP = 40;
// Level scaling stops compounding after this many level-ups, so a
// very long/high-scoring round doesn't become literally unplayable.
const MAX_LEVEL_STEPS = 12;

const DIFFICULTY_PRESETS = {
  easy: {
    label: 'Easy',
    gameDurationSec: 60,
    startingLives: 5,
    balloonSizeRange: [75, 95],      // px, [min, max]
    speedRange: [35, 55],            // px/sec, [min, max] at level 1
    speedStepPerLevel: 2,            // px/sec added per level-up
    spawnIntervalMs: 1300,           // ms between spawns at level 1
    minSpawnIntervalMs: 650,         // fastest spawn rate ever reaches
    spawnStepMsPerLevel: 40,         // ms shaved off per level-up
    bossSpawnChance: 0.02,           // probability per spawn tick at level 1
    bossChanceStepPerLevel: 0.002,
    maxBossSpawnChance: 0.06,
    bossHitsRequired: 3,
  },
  normal: {
    label: 'Normal',
    gameDurationSec: 60,
    startingLives: 4,
    balloonSizeRange: [65, 85],
    speedRange: [50, 75],
    speedStepPerLevel: 3,
    spawnIntervalMs: 1000,
    minSpawnIntervalMs: 500,
    spawnStepMsPerLevel: 35,
    bossSpawnChance: 0.03,
    bossChanceStepPerLevel: 0.003,
    maxBossSpawnChance: 0.09,
    bossHitsRequired: 4,
  },
  hard: {
    label: 'Hard',
    gameDurationSec: 60,
    startingLives: 3,
    balloonSizeRange: [55, 75],
    speedRange: [70, 100],
    speedStepPerLevel: 4,
    spawnIntervalMs: 750,
    minSpawnIntervalMs: 350,
    spawnStepMsPerLevel: 30,
    bossSpawnChance: 0.045,
    bossChanceStepPerLevel: 0.004,
    maxBossSpawnChance: 0.12,
    bossHitsRequired: 5,
  },
};

class DifficultyManager {
  /** @param {import('./settings.js').SettingsManager} settings */
  constructor(settings) {
    this.settings = settings;
  }

  /** Current difficulty key: 'easy' | 'normal' | 'hard'. Always reads live from Settings. */
  getKey() {
    const key = this.settings.getDifficulty();
    return DIFFICULTY_PRESETS[key] ? key : 'normal';
  }

  /** Raw preset for the currently selected difficulty (unscaled, level-1 values). */
  getBaseConfig() {
    return DIFFICULTY_PRESETS[this.getKey()];
  }

  /**
   * Returns a config object scaled for the given in-round level (1-based).
   * This is what balloons.js / movement.js / boss.js should actually use
   * once the round is running.
   */
  getConfigForLevel(level = 1) {
    const base = this.getBaseConfig();
    const steps = Math.min(level - 1, MAX_LEVEL_STEPS);

    return {
      label: base.label,
      gameDurationSec: base.gameDurationSec,
      startingLives: base.startingLives,
      balloonSizeRange: base.balloonSizeRange,
      bossHitsRequired: base.bossHitsRequired,

      speedRange: [
        base.speedRange[0] + steps * base.speedStepPerLevel,
        base.speedRange[1] + steps * base.speedStepPerLevel,
      ],
      spawnIntervalMs: Math.max(
        base.minSpawnIntervalMs,
        base.spawnIntervalMs - steps * base.spawnStepMsPerLevel
      ),
      bossSpawnChance: Math.min(
        base.maxBossSpawnChance,
        base.bossSpawnChance + steps * base.bossChanceStepPerLevel
      ),
    };
  }

  /** Which in-round level a given score corresponds to (1-based). */
  getLevelForScore(score) {
    return 1 + Math.floor(Math.max(0, score) / LEVEL_UP_SCORE_STEP);
  }

  /**
   * Returns { level, progressPercent } — progressPercent (0-100) is how
   * far the player is through the *current* level, for driving
   * #level-badge and .level-progress-fill.
   */
  getLevelProgress(score) {
    const level = this.getLevelForScore(score);
    const scoreIntoLevel = Math.max(0, score) - (level - 1) * LEVEL_UP_SCORE_STEP;
    const progressPercent = Math.min(100, (scoreIntoLevel / LEVEL_UP_SCORE_STEP) * 100);
    return { level, progressPercent };
  }
}