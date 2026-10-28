/**
 * Bullet and Projectile Class for Tank Wars.
 * Supports Cannon Shells, Machine Gun Tracers, Explosive Rockets, Laser Beams, and Landmines.
 */
class Bullet {
  constructor(x, y, angle, ownerId, weaponType = 'CANNON') {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.ownerId = ownerId; // 1 for P1, 2 for P2
    this.weaponType = weaponType;
    this.active = true;

    const config = window.WeaponSystem?.getWeaponConfig(weaponType) || {
      speed: 520, damage: 20
    };

    this.speed = config.speed;
    this.damage = config.damage;
    this.splashRadius = config.splashRadius || 0;
    this.pierce = !!config.pierce;
    this.radius = weaponType === 'MINE' ? 12 : (weaponType === 'ROCKET' ? 7 : (weaponType === 'MACHINE_GUN' ? 3 : 5));

    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;

    this.armTimer = weaponType === 'MINE' ? 0.6 : 0; // Arm delay for mines
  }

  update(dt, map, players) {
    if (!this.active) return;

    if (this.weaponType === 'MINE') {
      if (this.armTimer > 0) this.armTimer -= dt;

      // Mine proximity trigger
      for (const p of players) {
        if (p.alive && Math.hypot(this.x - p.x, this.y - p.y) < this.radius + p.radius + 10) {
          this.detonateMine(map, players);
          return;
        }
      }
      return;
    }

    // Movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Particle Trail
    if (this.weaponType === 'ROCKET') {
      window.particleSystem?.addRocketSmoke(this.x, this.y);
    } else if (Math.random() < 0.6) {
      window.particleSystem?.addSpark(this.x, this.y);
    }

    // 1. Collision with Walls
    for (const w of map.walls) {
      if (map.checkRectCollision(this.x, this.y, this.radius, w)) {
        this.active = false;
        if (this.splashRadius > 0) {
          this.triggerSplashDamage(map, players);
        } else {
          window.particleSystem?.addDebris(this.x, this.y, '#8a969e', 6);
          window.soundEngine?.playButtonClick();
        }
        return;
      }
    }

    // 2. Collision with Crates
    for (let i = map.crates.length - 1; i >= 0; i--) {
      const crate = map.crates[i];
      if (map.checkRectCollision(this.x, this.y, this.radius, crate)) {
        if (!this.pierce) this.active = false;
        crate.hp -= this.damage;
        window.particleSystem?.addDebris(this.x, this.y, '#a8733b', 8);

        if (crate.hp <= 0) {
          map.crates.splice(i, 1);
          window.particleSystem?.addDebris(crate.x + crate.w / 2, crate.y + crate.h / 2, '#6e451b', 16);
          window.soundEngine?.playExplosion();
        }
        if (!this.pierce) return;
      }
    }

    // 3. Collision with Destructible Trees
    for (let i = map.trees.length - 1; i >= 0; i--) {
      const t = map.trees[i];
      if (Math.hypot(this.x - t.x, this.y - t.y) < this.radius + t.radius) {
        if (!this.pierce) this.active = false;
        t.hp -= this.damage;
        window.particleSystem?.addDebris(this.x, this.y, '#2d5a27', 8);

        if (t.hp <= 0) {
          map.trees.splice(i, 1);
          window.particleSystem?.addDebris(t.x, t.y, '#1e3d1a', 16);
          window.soundEngine?.playExplosion();
        }
        if (!this.pierce) return;
      }
    }

    // 4. Collision with Explosive Barrels
    for (let i = map.barrels.length - 1; i >= 0; i--) {
      const b = map.barrels[i];
      if (Math.hypot(this.x - b.x, this.y - b.y) < this.radius + b.radius) {
        this.active = false;
        b.hp -= this.damage;

        if (b.hp <= 0) {
          const bx = b.x;
          const by = b.y;
          map.barrels.splice(i, 1);

          window.particleSystem?.addExplosion(bx, by, 1.6);
          window.soundEngine?.playBarrelDetonation();

          for (const p of players) {
            if (p.alive && Math.hypot(p.x - bx, p.y - by) < 100 + p.radius) {
              p.takeDamage(35, this.ownerId);
            }
          }
        }
        return;
      }
    }

    // 5. Collision with Tanks
    for (const player of players) {
      if (player.id !== this.ownerId && player.alive) {
        const dist = Math.hypot(this.x - player.x, this.y - player.y);
        if (dist < this.radius + player.radius) {
          this.active = false;
          player.takeDamage(this.damage, this.ownerId);

          if (this.splashRadius > 0) {
            this.triggerSplashDamage(map, players);
          } else {
            window.particleSystem?.addExplosion(this.x, this.y, 0.8);
            window.soundEngine?.playExplosion();
          }
          return;
        }
      }
    }
  }

  triggerSplashDamage(map, players) {
    window.particleSystem?.addExplosion(this.x, this.y, 1.5);
    window.soundEngine?.playExplosion();

    for (const p of players) {
      if (p.alive && Math.hypot(p.x - this.x, p.y - this.y) < this.splashRadius + p.radius) {
        p.takeDamage(this.damage, this.ownerId);
      }
    }
  }

  detonateMine(map, players) {
    this.active = false;
    window.particleSystem?.addExplosion(this.x, this.y, 1.8);
    window.soundEngine?.playBarrelDetonation();

    for (const p of players) {
      if (p.alive && Math.hypot(p.x - this.x, p.y - this.y) < 70 + p.radius) {
        p.takeDamage(this.damage, this.ownerId);
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.weaponType === 'MINE') {
      // Landmine pulsing glow
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '900 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', 0, 1);
      ctx.restore();
      return;
    }

    ctx.rotate(this.angle);

    if (this.weaponType === 'MACHINE_GUN') {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-4, -2, 8, 4);
    } else if (this.weaponType === 'ROCKET') {
      ctx.fillStyle = '#ff3d00';
      ctx.fillRect(-8, -4, 16, 8);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(4, -3, 4, 6);
    } else {
      // Cannon Shell
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.Bullet = Bullet;
