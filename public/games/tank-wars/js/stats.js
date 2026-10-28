/**
 * Statistics and LocalStorage Data Manager for Tank Wars.
 * Saves player profiles, win counts, total damage dealt, accuracy metrics, and favorite maps.
 */
class StatsManager {
  constructor() {
    this.storageKey = 'tank_wars_stats_v1';
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    return {
      p1Name: 'Player 1',
      p2Name: 'Player 2',
      matchesPlayed: 0,
      p1Wins: 0,
      p2Wins: 0,
      highestDamage: 0,
      bestAccuracy: 0,
      mapPlayCounts: {
        desert: 0,
        snow: 0,
        jungle: 0,
        factory: 0,
        lava: 0
      }
    };
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  recordMatchResult({ p1Name, p2Name, winnerId, mapId, p1Stats, p2Stats }) {
    this.data.p1Name = p1Name || 'Player 1';
    this.data.p2Name = p2Name || 'Player 2';
    this.data.matchesPlayed += 1;

    if (winnerId === 1) this.data.p1Wins += 1;
    if (winnerId === 2) this.data.p2Wins += 1;

    if (!this.data.mapPlayCounts[mapId]) {
      this.data.mapPlayCounts[mapId] = 0;
    }
    this.data.mapPlayCounts[mapId] += 1;

    // Track highest damage & accuracy
    const p1Acc = p1Stats.shotsFired > 0 ? (p1Stats.hits / p1Stats.shotsFired) * 100 : 0;
    const p2Acc = p2Stats.shotsFired > 0 ? (p2Stats.hits / p2Stats.shotsFired) * 100 : 0;

    this.data.highestDamage = Math.max(this.data.highestDamage, p1Stats.damageDealt, p2Stats.damageDealt);
    this.data.bestAccuracy = Math.max(this.data.bestAccuracy, p1Acc, p2Acc);

    this.saveData();
  }

  getFavoriteMap() {
    let max = -1;
    let favorite = 'desert';
    for (const [map, count] of Object.entries(this.data.mapPlayCounts || {})) {
      if (count > max) {
        max = count;
        favorite = map;
      }
    }
    return favorite;
  }
}

window.statsManager = new StatsManager();
