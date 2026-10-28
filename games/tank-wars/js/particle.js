/**
 * Visual Effects & Particle Engine for Tank Wars.
 * Handles explosions, smoke, tread dust, wood/metal debris, floating damage text, laser beams, and camera shake.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.laserBeams = [];
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  addCameraShake(intensity = 8) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // Create explosion particles (fire & smoke)
  addExplosion(x, y, scale = 1.0) {
    const particleCount = Math.floor(25 * scale);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 140 + 40) * scale;
      const size = (Math.random() * 12 + 6) * scale;
      const isFire = Math.random() < 0.6;
      
      const colors = isFire 
        ? ['#ffcc00', '#ff6600', '#ff3300', '#ffffff'] 
        : ['#444444', '#666666', '#222222', '#888888'];

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        maxSize: size * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: Math.random() * 1.8 + 1.2,
        type: 'explosion'
      });
    }
    this.addCameraShake(10 * scale);
  }

  // Laser Beam Ray Effect
  addLaserBeam(startX, startY, endX, endY, color = '#d500f9') {
    this.laserBeams.push({
      startX, startY, endX, endY,
      color,
      alpha: 1.0,
      width: 6,
      decay: 4.0
    });
  }

  // Rocket Smoke Trail
  addRocketSmoke(x, y) {
    this.particles.push({
      x: x + (Math.random() * 6 - 3),
      y: y + (Math.random() * 6 - 3),
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: Math.random() * 4 + 3,
      maxSize: 12,
      color: '#aaaaaa',
      alpha: 0.7,
      decay: 2.0,
      type: 'smoke'
    });
  }

  // Dust cloud under tank treads while driving
  addTreadDust(x, y) {
    this.particles.push({
      x: x + (Math.random() * 10 - 5),
      y: y + (Math.random() * 10 - 5),
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      size: Math.random() * 6 + 4,
      maxSize: 14,
      color: '#d2b48c',
      alpha: 0.4,
      decay: 0.8,
      type: 'dust'
    });
  }

  // Wood / Steel / Leaf debris fragments
  addDebris(x, y, color = '#a0522d', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 50;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        color: color,
        alpha: 1.0,
        decay: 1.5,
        type: 'debris'
      });
    }
  }

  // Bullet Trail sparks
  addSpark(x, y) {
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      size: Math.random() * 3 + 2,
      color: '#ffea00',
      alpha: 0.9,
      decay: 4.0,
      type: 'spark'
    });
  }

  // Pop-up damage text
  addFloatingDamageText(x, y, damage, isCritical = false) {
    this.damageTexts.push({
      x: x + (Math.random() * 20 - 10),
      y: y - 20,
      text: `-${damage}`,
      color: isCritical ? '#ff0033' : '#ffd700',
      fontSize: isCritical ? 26 : 20,
      alpha: 1.0,
      vy: -50,
      life: 0.8
    });
  }

  update(dt) {
    // Update Camera Shake
    if (this.shakeIntensity > 0) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.05, dt);
      if (this.shakeIntensity < 0.2) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'dust' || p.type === 'explosion' || p.type === 'smoke') {
        p.size += (p.maxSize - p.size) * dt * 2;
      }
      if (p.type === 'debris') {
        p.rotation += p.vRot * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Laser Beams
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const b = this.laserBeams[i];
      b.alpha -= b.decay * dt;
      if (b.alpha <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }

    // Update Floating Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const t = this.damageTexts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      t.alpha = Math.max(0, t.life / 0.8);

      if (t.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render Laser Beams
    for (const b of this.laserBeams) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(b.startX, b.startY);
      ctx.lineTo(b.endX, b.endY);
      ctx.stroke();

      // Beam inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.width * 0.4;
      ctx.stroke();

      ctx.restore();
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Render Floating Text
    for (const t of this.damageTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = `900 ${t.fontSize}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.damageTexts = [];
    this.laserBeams = [];
    this.shakeIntensity = 0;
  }
}

window.particleSystem = new ParticleSystem();
