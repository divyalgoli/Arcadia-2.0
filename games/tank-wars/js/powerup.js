/**
 * Power-Up Spawner and Manager for Tank Wars.
 * Features 10 unique power-up types with floating animations and active effect timers.
 */
class PowerUp {
  static TYPES = {
    REPAIR: { id: 'REPAIR', name: 'Repair Kit', icon: '❤️', color: '#ff3366', duration: 0 },
    SPEED: { id: 'SPEED', name: 'Speed Boost', icon: '⚡', color: '#00e5ff', duration: 10 },
    SHIELD: { id: 'SHIELD', name: 'Energy Shield', icon: '🛡', color: '#76ff03', duration: 8 },
    DOUBLE_DAMAGE: { id: 'DOUBLE_DAMAGE', name: 'Double Damage', icon: '🔥', color: '#ff6d00', duration: 10 },
    RAPID_FIRE: { id: 'RAPID_FIRE', name: 'Rapid Fire', icon: '🔫', color: '#ffff00', duration: 10 },
    ROCKET_AMMO: { id: 'ROCKET_AMMO', name: 'Rocket Pack', icon: '🚀', color: '#ff3d00', duration: 15 },
    LASER_BEAM: { id: 'LASER_BEAM', name: 'Laser Beam', icon: '⚡', color: '#d500f9', duration: 10 },
    MINE_PACK: { id: 'MINE_PACK', name: 'Mine Pack', icon: '💣', color: '#3d5aff', duration: 0 },
    AUTO_AIM: { id: 'AUTO_AIM', name: 'Auto Aim', icon: '🎯', color: '#00e676', duration: 8 },
    MEGA_BOMB: { id: 'MEGA_BOMB', name: 'Mega Bomb', icon: '☢', color: '#ff1744', duration: 0, rare: true }
  };

  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.type = PowerUp.TYPES[typeKey] || PowerUp.TYPES.REPAIR;
    this.radius = 18;
    this.active = true;

    this.age = 0; // seconds of in-game (unpaused) time since spawn
    this.lifespan = 15.0; // Despawns after 15 seconds
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  update(dt, players, map) {
    if (!this.active) return;

    // Check Lifespan expiry
    this.age += dt;
    if (this.age >= this.lifespan) {
      this.active = false;
      window.particleSystem?.addSpark(this.x, this.y);
      return;
    }

    // Check collision with tanks
    for (const p of players) {
      if (p.alive && Math.hypot(this.x - p.x, this.y - p.y) < this.radius + p.radius) {
        this.active = false;
        p.applyPowerUp(this.type, map, players);
        window.particleSystem?.addExplosion(this.x, this.y, 0.6);
        window.soundEngine?.playPowerUpPickup();
        return;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    const hoverY = this.y + Math.sin(this.age * 4 + this.bobOffset) * 5;

    ctx.save();
    ctx.translate(this.x, hoverY);

    // Glowing Aura
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 16;

    // Outer Rotating Badge
    ctx.fillStyle = 'rgba(15, 23, 26, 0.85)';
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Icon Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, 0, 1);

    ctx.restore();
  }
}

class PowerUpSpawner {
  constructor() {
    this.powerUps = [];
    this.spawnTimer = 0;
    this.spawnInterval = 16; // 16 seconds
  }

  reset() {
    this.powerUps = [];
    this.spawnTimer = 5; // First spawn 5s into match
  }

  update(dt, map, players) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval + (Math.random() * 4 - 2);
      this.spawnRandomPowerUp(map);
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.update(dt, players, map);
      if (!p.active) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  spawnRandomPowerUp(map) {
    const keys = Object.keys(PowerUp.TYPES);
    // Weighted selection (Mega Bomb is rare)
    let selectedKey = keys[Math.floor(Math.random() * keys.length)];
    if (selectedKey === 'MEGA_BOMB' && Math.random() > 0.25) {
      selectedKey = 'REPAIR'; // Fallback if rare roll fails
    }

    // Find random open location
    let validSpot = false;
    let spotX = map.width / 2;
    let spotY = map.height / 2;
    let attempts = 0;

    while (!validSpot && attempts < 30) {
      attempts++;
      spotX = Math.random() * (map.width - 240) + 120;
      spotY = Math.random() * (map.height - 240) + 120;

      let collides = false;
      for (const w of map.walls) {
        if (map.checkRectCollision(spotX, spotY, 25, w)) collides = true;
      }
      for (const c of map.crates) {
        if (map.checkRectCollision(spotX, spotY, 25, c)) collides = true;
      }
      if (!collides) validSpot = true;
    }

    this.powerUps.push(new PowerUp(spotX, spotY, selectedKey));
  }

  render(ctx) {
    for (const p of this.powerUps) {
      p.render(ctx);
    }
  }
}

window.PowerUp = PowerUp;
window.PowerUpSpawner = PowerUpSpawner;
