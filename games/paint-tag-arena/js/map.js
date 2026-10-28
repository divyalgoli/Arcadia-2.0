// map.js
// Loads and stores arena map data from JSON files. No UI or rendering code
// lives here — game.js is responsible for drawing what this module exposes.
//
// Expected JSON shape (maps/arena1.json, arena2.json, arena3.json, ...):
// {
//   "name": "Arena 1",
//   "width": 960,
//   "height": 640,
//   "walls": [ { "x": 0, "y": 0, "width": 960, "height": 16 }, ... ],
//   "obstacles": [ { "x": 200, "y": 300, "width": 48, "height": 48 }, ... ],
//   "spawnPoints": {
//     "player1": { "x": 40, "y": 40 },
//     "player2": { "x": 880, "y": 560 }
//   },
//   "powerupSpawnPoints": [ { "x": 480, "y": 320 }, ... ]
// }

const DEFAULT_MAP_LIST = ['arena1', 'arena2', 'arena3'];
const MAP_BASE_PATH = 'maps/';

class MapManager {
  constructor(mapList = DEFAULT_MAP_LIST) {
    this.mapList = mapList;
    this.currentMapName = null;
    this.currentMap = null;
    this.cache = new Map(); // avoid re-fetching maps already loaded
  }

  /** Loads (or returns cached) map JSON by name, e.g. 'arena1'. */
  async loadMap(name) {
    if (this.cache.has(name)) {
      this.currentMap = this.cache.get(name);
      this.currentMapName = name;
      return this.currentMap;
    }

    // Maps are embedded in js/mapdata.js (MAP_DATA) so the game works when
    // opened straight from disk, not just from a web server. Fall back to
    // fetching the JSON file directly in case a map is added to maps/ later
    // without also being embedded.
    let data = MAP_DATA[name];
    if (!data) {
      const response = await fetch(`${MAP_BASE_PATH}${name}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load map "${name}": ${response.status}`);
      }
      data = await response.json();
    }

    const normalized = this._normalizeMapData(data);
    this.cache.set(name, normalized);
    this.currentMap = normalized;
    this.currentMapName = name;
    return normalized;
  }

  /** Switches to a different map by name, loading it if necessary. */
  async switchMap(name) {
    return this.loadMap(name);
  }

  /** Picks a random map name from the configured list (excluding current, if possible). */
  getRandomMapName() {
    const candidates = this.mapList.filter((m) => m !== this.currentMapName);
    const pool = candidates.length > 0 ? candidates : this.mapList;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ---------------------------------------------------------------------
  // Accessors — game.js and collision.js read arena geometry through these
  // rather than reaching into currentMap directly, so the storage format
  // can change later without touching callers.
  // ---------------------------------------------------------------------

  getArenaBounds() {
    if (!this.currentMap) return { width: 0, height: 0 };
    return { width: this.currentMap.width, height: this.currentMap.height };
  }

  getWalls() {
    return this.currentMap ? this.currentMap.walls : [];
  }

  getObstacles() {
    return this.currentMap ? this.currentMap.obstacles : [];
  }

  /** Returns all static (non-moving) collision rects: walls + obstacles combined. */
  getStaticCollisionRects() {
    return [...this.getWalls(), ...this.getObstacles()];
  }

  getSpawnPoint(playerId) {
    if (!this.currentMap) return { x: 0, y: 0 };
    return this.currentMap.spawnPoints[playerId] || { x: 0, y: 0 };
  }

  getPowerupSpawnPoints() {
    return this.currentMap ? this.currentMap.powerupSpawnPoints : [];
  }

  /** Returns the map's teleport pad pairs: { fromX, fromY, toX, toY }. */
  getTeleports() {
    return this.currentMap ? this.currentMap.teleports : [];
  }

  /** Returns the map's tag-immune safe zones: { x, y, radius }. */
  getSafeZones() {
    return this.currentMap ? this.currentMap.safeZones : [];
  }

  getMapName() {
    return this.currentMap ? this.currentMap.name : '';
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  /** Fills in sane defaults for any optional fields missing from the JSON. */
  _normalizeMapData(data) {
    return {
      name: data.name || 'Unnamed Arena',
      width: data.width || 960,
      height: data.height || 640,
      walls: data.walls || [],
      obstacles: data.obstacles || [],
      spawnPoints: this._normalizeSpawnPoints(data.spawnPoints),
      powerupSpawnPoints: this._normalizePowerupSpawns(data.powerUpSpawns || data.powerupSpawnPoints),
      teleports: data.teleports || [],
      safeZones: data.safeZones || [],
    };
  }

  /**
   * The map JSON files store spawn points as an array of
   * { id, x, y } entries rather than a { player1, player2 } object.
   * Convert whichever shape shows up into the { player1, player2 } form
   * the rest of the game expects.
   */
  _normalizeSpawnPoints(spawnPoints) {
    const fallback = {
      player1: { x: 40, y: 40 },
      player2: { x: 880, y: 560 },
    };
    if (!spawnPoints) return fallback;

    if (Array.isArray(spawnPoints)) {
      if (spawnPoints.length === 0) return fallback;
      return {
        player1: { x: spawnPoints[0].x, y: spawnPoints[0].y },
        player2: { x: (spawnPoints[1] || spawnPoints[0]).x, y: (spawnPoints[1] || spawnPoints[0]).y },
      };
    }

    return spawnPoints;
  }

  /**
   * Power-up spawn points may arrive as { type, x, y } entries. The map JSON
   * uses short-form type names ("speed", "freeze", ...) — translate those to
   * the canonical POWERUP_TYPES values the rest of the game expects.
   */
  _normalizePowerupSpawns(powerupSpawns) {
    if (!powerupSpawns) return [];
    const typeAliases = {
      speed: POWERUP_TYPES.SPEED_BOOST,
      speedBoost: POWERUP_TYPES.SPEED_BOOST,
      shield: POWERUP_TYPES.SHIELD,
      doubleDash: POWERUP_TYPES.DOUBLE_DASH,
      freeze: POWERUP_TYPES.FREEZE_TRAP,
      freezeTrap: POWERUP_TYPES.FREEZE_TRAP,
    };
    return powerupSpawns.map((p) => ({ x: p.x, y: p.y, type: typeAliases[p.type] || p.type }));
  }
}
