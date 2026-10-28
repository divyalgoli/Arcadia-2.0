/**
 * Tank Class for Player 1 and Player 2.
 * Handles movement, turret aiming, power-up effects, custom weapons, player names, overhead labels, and stats.
 */
class Tank {
  constructor(id, name, x, y, angle, colorScheme) {
    this.id = id;
    this.name = name || (id === 1 ? 'Player 1' : 'Player 2');
    this.x = x;
    this.y = y;
    this.bodyAngle = angle;
    this.turretAngle = angle;
    this.radius = 22;

    this.colorScheme = colorScheme;

    this.maxHp = 100;
    this.hp = 100;
    this.alive = true;

    this.baseMoveSpeed = 165;
    this.turnSpeed = 2.8;

    this.recoilOffset = 0;
    this.fireCooldown = 0;

    this.treadOffset = 0;
    this.isMoving = false;

    // Weapon State
    this.currentWeapon = 'CANNON';
    this.weaponAmmo = Infinity;

    // Active Power-Up Timers & Status
    this.activePowerUps = {
      SHIELD: 0,
      SPEED: 0,
      DOUBLE_DAMAGE: 0,
      RAPID_FIRE: 0,
      AUTO_AIM: 0
    };

    // Cumulative Match Stats
    this.stats = {
      shotsFired: 0,
      hits: 0,
      damageDealt: 0
    };
  }

  resetStats() {
    this.stats = {
      shotsFired: 0,
      hits: 0,
      damageDealt: 0
    };
  }

  reset(x, y, angle) {
    this.x = x;
    this.y = y;
    this.bodyAngle = angle;
    this.turretAngle = angle;
    this.hp = 100;
    this.alive = true;
    this.recoilOffset = 0;
    this.fireCooldown = 0;
    this.currentWeapon = 'CANNON';
    this.weaponAmmo = Infinity;
    this.activePowerUps = { SHIELD: 0, SPEED: 0, DOUBLE_DAMAGE: 0, RAPID_FIRE: 0, AUTO_AIM: 0 };
  }

  applyPowerUp(typeConfig, map, players) {
    const id = typeConfig.id;

    if (id === 'REPAIR') {
      this.hp = Math.min(this.maxHp, this.hp + 30);
      window.particleSystem?.addFloatingDamageText(this.x, this.y, '+30 HP', false);
    } else if (id === 'ROCKET_AMMO') {
      this.currentWeapon = 'ROCKET';
      this.weaponAmmo = 10;
    } else if (id === 'LASER_BEAM') {
      this.currentWeapon = 'LASER';
      this.weaponAmmo = 8;
    } else if (id === 'MINE_PACK') {
      this.currentWeapon = 'MINE';
      this.weaponAmmo = 5;
    } else if (id === 'MEGA_BOMB') {
      // Tactical Nuke Explosion
      window.particleSystem?.addExplosion(this.x, this.y, 3.0);
      window.soundEngine?.playBarrelDetonation();

      for (const target of players) {
        if (target.id !== this.id && target.alive) {
          target.takeDamage(60, this.id);
        }
      }
    } else {
      // Timed Buff
      this.activePowerUps[id] = typeConfig.duration || 10;
    }
  }

  update(input, map, opponent, dt, bullets) {
    if (!this.alive) return;

    // Update Timed Power-Up Buffs
    for (const key in this.activePowerUps) {
      if (this.activePowerUps[key] > 0) {
        this.activePowerUps[key] -= dt;
      }
    }

    // Cooldown update
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Recoil recovery
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 40);
    }

    const { move, turn, shoot } = input;
    this.isMoving = move !== 0 || turn !== 0;

    // Movement Speed Calculation (with Speed Boost Buff)
    const speedMult = this.activePowerUps.SPEED > 0 ? 1.4 : 1.0;
    const currentSpeed = this.baseMoveSpeed * speedMult;

    // 1. Turning Body
    if (turn !== 0) {
      this.bodyAngle += turn * this.turnSpeed * dt;
    }

    // 2. Auto Aim Assistance vs Normal Turret Re-Alignment
    if (this.activePowerUps.AUTO_AIM > 0 && opponent && opponent.alive) {
      const targetAngle = Math.atan2(opponent.y - this.y, opponent.x - this.x);
      let angleDiff = targetAngle - this.turretAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.turretAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 6.0 * dt);
    } else {
      // Smoothly re-align turret nozzle back to tank body facing direction
      let angleDiff = this.bodyAngle - this.turretAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (Math.abs(angleDiff) > 0.01) {
        this.turretAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 6.0 * dt);
      } else {
        this.turretAngle = this.bodyAngle;
      }
    }

    this.bodyAngle = (this.bodyAngle + Math.PI * 2) % (Math.PI * 2);
    this.turretAngle = (this.turretAngle + Math.PI * 2) % (Math.PI * 2);

    // 3. Position Movement with Collision
    if (move !== 0) {
      const nextX = this.x + Math.cos(this.bodyAngle) * move * currentSpeed * dt;
      const nextY = this.y + Math.sin(this.bodyAngle) * move * currentSpeed * dt;

      this.treadOffset = (this.treadOffset + move * 14 * dt) % 10;
      if (Math.random() < 0.35) {
        window.particleSystem?.addTreadDust(this.x, this.y);
      }

      let canMoveX = true;
      let canMoveY = true;

      for (const w of map.walls) {
        if (map.checkRectCollision(nextX, this.y, this.radius, w)) canMoveX = false;
        if (map.checkRectCollision(this.x, nextY, this.radius, w)) canMoveY = false;
      }
      for (const c of map.crates) {
        if (map.checkRectCollision(nextX, this.y, this.radius, c)) canMoveX = false;
        if (map.checkRectCollision(this.x, nextY, this.radius, c)) canMoveY = false;
      }
      for (const b of map.barrels) {
        if (Math.hypot(nextX - b.x, this.y - b.y) < this.radius + b.radius) canMoveX = false;
        if (Math.hypot(this.x - b.x, nextY - b.y) < this.radius + b.radius) canMoveY = false;
      }
      if (opponent && opponent.alive) {
        if (Math.hypot(nextX - opponent.x, this.y - opponent.y) < this.radius + opponent.radius) canMoveX = false;
        if (Math.hypot(this.x - opponent.x, nextY - opponent.y) < this.radius + opponent.radius) canMoveY = false;
      }

      if (canMoveX) this.x = nextX;
      if (canMoveY) this.y = nextY;
    }

    // 4. Shooting Cannon / Special Weapons
    if (shoot && this.fireCooldown <= 0) {
      this.fireWeapon(bullets);
    }
  }

  fireWeapon(bullets) {
    const config = window.WeaponSystem?.getWeaponConfig(this.currentWeapon) || { fireRate: 0.38 };
    const rapidMult = this.activePowerUps.RAPID_FIRE > 0 ? 0.5 : 1.0;
    
    this.fireCooldown = config.fireRate * rapidMult;
    this.recoilOffset = 8;
    this.stats.shotsFired += 1;

    const barrelLength = 28;
    let shootAngle = this.turretAngle;

    if (config.spread) {
      shootAngle += (Math.random() - 0.5) * config.spread;
    }

    const muzzleX = this.x + Math.cos(shootAngle) * (barrelLength - 4);
    const muzzleY = this.y + Math.sin(shootAngle) * (barrelLength - 4);

    if (this.currentWeapon === 'LASER') {
      const rayLen = 1000;
      const endX = muzzleX + Math.cos(shootAngle) * rayLen;
      const endY = muzzleY + Math.sin(shootAngle) * rayLen;
      window.particleSystem?.addLaserBeam(muzzleX, muzzleY, endX, endY, this.colorScheme.primary);
      window.soundEngine?.playLaserFire();
    } else if (this.currentWeapon === 'MACHINE_GUN') {
      window.soundEngine?.playMachineGun();
    } else if (this.currentWeapon === 'ROCKET') {
      window.soundEngine?.playRocketLaunch();
    } else if (this.currentWeapon === 'MINE') {
      window.soundEngine?.playMineDeploy();
    } else {
      window.soundEngine?.playCannonFire();
    }

    bullets.push(new Bullet(muzzleX, muzzleY, shootAngle, this.id, this.currentWeapon));

    if (this.weaponAmmo !== Infinity) {
      this.weaponAmmo -= 1;
      if (this.weaponAmmo <= 0) {
        this.currentWeapon = 'CANNON';
        this.weaponAmmo = Infinity;
      }
    }

    window.particleSystem?.addSpark(muzzleX, muzzleY);
    window.particleSystem?.addCameraShake(4);
  }

  takeDamage(amount, attackerId = null) {
    if (!this.alive) return;

    if (this.activePowerUps.SHIELD > 0) {
      window.particleSystem?.addSpark(this.x, this.y);
      return;
    }

    const actualDamage = Math.min(this.hp, amount);
    this.hp = Math.max(0, this.hp - amount);

    // Record damage dealt on attacker
    if (attackerId !== null && window.gameApp) {
      const attacker = attackerId === 1 ? window.gameApp.player1 : window.gameApp.player2;
      if (attacker && attacker.id !== this.id) {
        attacker.stats.hits += 1;
        attacker.stats.damageDealt += Math.round(actualDamage);
      }
    }

    window.particleSystem?.addFloatingDamageText(this.x, this.y, amount, amount >= 30);
    window.particleSystem?.addCameraShake(6);

    if (this.hp <= 0) {
      this.alive = false;
      window.particleSystem?.addExplosion(this.x, this.y, 2.0);
      window.soundEngine?.playExplosion();
    }
  }

  render(ctx) {
    if (!this.alive) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.activePowerUps.SHIELD > 0) {
      ctx.fillStyle = 'rgba(118, 255, 3, 0.2)';
      ctx.strokeStyle = '#76ff03';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#76ff03';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(this.bodyAngle);

    ctx.fillStyle = '#1c2327';
    ctx.fillRect(-24, -22, 48, 10);
    ctx.fillRect(-24, 12, 48, 10);

    ctx.fillStyle = '#3a444a';
    for (let tx = -20 + (this.treadOffset % 8); tx < 20; tx += 8) {
      ctx.fillRect(tx, -22, 4, 10);
      ctx.fillRect(tx, 12, 4, 10);
    }

    ctx.fillStyle = this.colorScheme.dark;
    ctx.fillRect(-20, -14, 40, 28);

    ctx.fillStyle = this.colorScheme.primary;
    ctx.fillRect(-16, -11, 32, 22);

    ctx.restore();

    ctx.save();
    ctx.rotate(this.turretAngle);

    const barrelX = 8 - this.recoilOffset;
    ctx.fillStyle = '#1e2428';
    ctx.fillRect(barrelX, -4, 24, 8);

    ctx.fillStyle = this.colorScheme.primary;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const barWidth = 44;
    const barHeight = 6;
    const barX = -barWidth / 2;
    const barY = -34;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = this.hp / this.maxHp;
    ctx.fillStyle = this.hp <= 20 ? '#ff0033' : this.colorScheme.primary;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(this.name, 0, barY - 6);

    ctx.restore();
  }
}

window.Tank = Tank;
