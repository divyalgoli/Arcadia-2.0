// player.js
// Defines the Player class: position, movement, dash, role, score, energy.
// Player logic is kept isolated here — no collision resolution or UI code.

// Uses MOVEMENT, PLAYER_SIZE, ROLES, clamp, normalizeVector, createCooldown,
// circlesIntersect from utils.js (loaded earlier as a plain script).

class Player {
  /**
   * @param {Object} options
   * @param {string} options.id - unique id, e.g. 'player1'
   * @param {string} options.label - display label, e.g. 'Player 1'
   * @param {string} options.color - draw color
   * @param {Object} options.keyBindings - { up, down, left, right, dash }
   * @param {string} options.role - initial ROLES value
   */
  constructor({ id, label, color, keyBindings, role }) {
    this.id = id;
    this.label = label;
    this.color = color;
    this.keyBindings = keyBindings;

    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;

    // Position / motion
    this.x = 0;
    this.y = 0;
    this.velocity = { x: 0, y: 0 };
    this.facing = { x: 0, y: 1 };

    // Role & score
    this.role = role;
    this.score = 0;

    // Energy (drives regen-limited abilities / HUD bar)
    this.maxEnergy = 100;
    this.energy = 100;
    this.energyRegenRate = 18; // per second

    // Dash state
    this.isDashing = false;
    this.dashTimeRemaining = 0;
    this.dashCooldown = createCooldown(MOVEMENT.DASH_COOLDOWN);
    this.dashTrail = []; // list of { x, y, alpha } for visual trail
    this.dashChargesAvailable = 0; // extra chained dashes; only granted by Double Dash power-up

    // Status effects (populated/cleared by the power-up system in game.js)
    this.effects = {
      speedBoostUntil: 0,
      shieldUntil: 0, // timestamp-based, like speedBoostUntil, so stacked pickups extend cleanly
      frozenUntil: 0,
    };

    // Just-tagged flag/timer lets the player draw a brief one-shot "tag flash"
    // effect; cleared automatically once the flash has played out (see update()).
    this.justTagged = false;
    this.justTaggedTimer = 0;

    // Brief grace period after teleporting so a two-way portal pair can't
    // immediately bounce the player straight back where they came from.
    this.teleportCooldown = 0;

    this.spawnPoint = { x: 0, y: 0 };
  }

  // -------------------------------------------------------------------------
  // Role / lifecycle
  // -------------------------------------------------------------------------

  /** Swaps this player's role between tagger and runner. */
  changeRole(newRole) {
    this.role = newRole;
  }

  /** Moves the player back to its spawn point and clears transient state. */
  reset(spawnPoint) {
    if (spawnPoint) this.spawnPoint = spawnPoint;
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.isDashing = false;
    this.dashTimeRemaining = 0;
    this.dashTrail = [];
    this.dashChargesAvailable = 0;
    this.justTagged = false;
    this.justTaggedTimer = 0;
    this.teleportCooldown = 0;
    this.effects.shieldUntil = 0;
    this.effects.speedBoostUntil = 0;
    this.effects.frozenUntil = 0;
  }

  /** Resets only the dash cooldown (used by the Double Dash power-up). */
  resetCooldown() {
    this.dashCooldown.remaining = 0;
  }

  // -------------------------------------------------------------------------
  // Input / movement
  // -------------------------------------------------------------------------

  /**
   * Reads the current keyboard state and applies acceleration/dash requests.
   * @param {Set<string>} pressedKeys - set of currently-held key codes
   * @param {number} dt - frame delta time in seconds
   */
  handleInput(pressedKeys, dt) {
    const frozen = performance.now() < this.effects.frozenUntil;
    if (frozen) {
      // Frozen players cannot accelerate or dash this frame.
      return;
    }

    let inputX = 0;
    let inputY = 0;
    if (pressedKeys.has(this.keyBindings.left)) inputX -= 1;
    if (pressedKeys.has(this.keyBindings.right)) inputX += 1;
    if (pressedKeys.has(this.keyBindings.up)) inputY -= 1;
    if (pressedKeys.has(this.keyBindings.down)) inputY += 1;

    const normalized = normalizeVector(inputX, inputY);

    if (!this.isDashing) {
      this.velocity.x += normalized.x * MOVEMENT.ACCELERATION * dt;
      this.velocity.y += normalized.y * MOVEMENT.ACCELERATION * dt;
    }

    if (normalized.x !== 0 || normalized.y !== 0) {
      this.facing = normalized;
    }

    if (pressedKeys.has(this.keyBindings.dash)) {
      return this.startDash();
    }
  }

  /** Applies friction and clamps to max speed; call once per frame after handleInput. */
  applyFrictionAndClamp(dt) {
    if (this.isDashing) return; // dash ignores friction while active

    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > 0) {
      const frictionAmount = MOVEMENT.FRICTION * dt;
      const newSpeed = Math.max(0, speed - frictionAmount);
      const scale = speed > 0 ? newSpeed / speed : 0;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }

    const maxSpeed = this.getMaxSpeed();
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }
  }

  /** Returns the player's current max speed, factoring in the Speed Boost effect. */
  getMaxSpeed() {
    const boosted = performance.now() < this.effects.speedBoostUntil;
    return boosted ? MOVEMENT.MAX_SPEED * 1.6 : MOVEMENT.MAX_SPEED;
  }

  /**
   * Integrates velocity into position. Collision resolution (walls, arena
   * bounds, other players) happens afterwards in collision.js — this method
   * only performs the raw move.
   */
  move(dt) {
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
  }

  // -------------------------------------------------------------------------
  // Dash
  // -------------------------------------------------------------------------

  /** Attempts to start a dash in the player's current facing direction. */
  startDash() {
    if (this.isDashing) return;
    if (!this.dashCooldown.isReady() && this.dashChargesAvailable <= 0) return;
    if (performance.now() < this.effects.frozenUntil) return;

    if (!this.dashCooldown.isReady()) {
      // Consume an extra charge (granted by Double Dash) instead of cooldown.
      this.dashChargesAvailable -= 1;
    } else {
      this.dashCooldown.trigger();
    }

    this.isDashing = true;
    this.dashTimeRemaining = MOVEMENT.DASH_DURATION;

    const dir = normalizeVector(this.facing.x, this.facing.y);
    this.velocity.x = dir.x * MOVEMENT.DASH_SPEED;
    this.velocity.y = dir.y * MOVEMENT.DASH_SPEED;

    return true; // signals caller (game.js) to play the dash sound
  }

  /** Updates dash duration/cooldown/trail; call once per frame. */
  updateDash(dt) {
    this.dashCooldown.tick(dt);

    if (this.isDashing) {
      // Record a trail point before moving.
      this.dashTrail.push({ x: this.x, y: this.y, alpha: 0.6 });
      if (this.dashTrail.length > 8) this.dashTrail.shift();

      this.dashTimeRemaining -= dt;
      if (this.dashTimeRemaining <= 0) {
        this.isDashing = false;
        this.dashTimeRemaining = 0;
      }
    }

    // Fade out existing trail points regardless of dash state.
    this.dashTrail.forEach((point) => {
      point.alpha = Math.max(0, point.alpha - dt * 1.5);
    });
    this.dashTrail = this.dashTrail.filter((point) => point.alpha > 0);
  }

  /** Fraction (0..1) of dash cooldown remaining, for the HUD indicator. */
  getDashCooldownPercent() {
    return this.dashCooldown.percentRemaining();
  }

  // -------------------------------------------------------------------------
  // Energy
  // -------------------------------------------------------------------------

  /** Passive energy regeneration; call once per frame. */
  regenEnergy(dt) {
    this.energy = clamp(this.energy + this.energyRegenRate * dt, 0, this.maxEnergy);
  }

  drainEnergy(amount) {
    this.energy = clamp(this.energy - amount, 0, this.maxEnergy);
  }

  // -------------------------------------------------------------------------
  // Tag detection
  // -------------------------------------------------------------------------

  /**
   * Returns true if this player (must be the tagger) is currently touching
   * the given runner and the runner isn't shielded.
   */
  checkTag(otherPlayer, safeZones) {
    if (this.role !== ROLES.TAGGER || otherPlayer.role !== ROLES.RUNNER) {
      return false;
    }
    if (performance.now() < otherPlayer.effects.shieldUntil) {
      return false;
    }
    if (isInsideSafeZone(otherPlayer.x + otherPlayer.width / 2, otherPlayer.y + otherPlayer.height / 2, safeZones)) {
      return false;
    }
    const radius = this.width / 2;
    const otherRadius = otherPlayer.width / 2;
    return circlesIntersect(
      this.x + radius,
      this.y + radius,
      radius,
      otherPlayer.x + otherRadius,
      otherPlayer.y + otherRadius,
      otherRadius
    );
  }

  // -------------------------------------------------------------------------
  // Update / Draw
  // -------------------------------------------------------------------------

  /** Full per-frame update, excluding collision resolution (handled externally). */
  update(dt) {
    this.updateDash(dt);
    this.applyFrictionAndClamp(dt);
    this.move(dt);
    this.regenEnergy(dt);

    if (this.teleportCooldown > 0) {
      this.teleportCooldown = Math.max(0, this.teleportCooldown - dt);
    }

    if (this.justTagged) {
      this.justTaggedTimer -= dt;
      if (this.justTaggedTimer <= 0) {
        this.justTagged = false;
        this.justTaggedTimer = 0;
      }
    }
  }

  /**
   * Renders the player as a rounded paintball mascot: jersey body, helmet
   * with a goggle-mask, a small paint-gun nub pointing the way it's facing,
   * and a tiny backpack tank. Purely cosmetic — the hitbox used by
   * collision.js is still the plain this.x/this.y/this.width/this.height
   * square from getBounds(), untouched by any of this.
   */
  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;
    const frozen = performance.now() < this.effects.frozenUntil;
    const bodyColor = frozen ? '#BEE7FF' : this.color;
    const shadeColor = shadeHexColor(bodyColor, -22);

    // ---- Paint-droplet dash trail (rendered first, beneath the player) ----
    this.dashTrail.forEach((point) => {
      const pcx = point.x + this.width / 2;
      const pcy = point.y + this.height / 2;
      ctx.save();
      ctx.globalAlpha = point.alpha * 0.7;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(pcx, pcy, r * (0.4 + point.alpha * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ---- Small backpack tank (drawn behind the body) ----
    ctx.save();
    ctx.fillStyle = shadeColor;
    roundRectPath(ctx, cx - r * 0.32, cy - r * 0.15, r * 0.62, r * 0.95, r * 0.18);
    ctx.fill();
    ctx.restore();

    // ---- Paint-gun nub, pointing in the facing direction ----
    const fx = this.facing.x || 0;
    const fy = this.facing.y || 1;
    ctx.save();
    ctx.fillStyle = '#37474F';
    roundRectPath(
      ctx,
      cx + fx * r * 0.55 - r * 0.16,
      cy + fy * r * 0.55 - r * 0.16,
      r * 0.75,
      r * 0.32,
      r * 0.12
    );
    ctx.fill();
    ctx.restore();

    // ---- Jersey body (rounded square) ----
    ctx.save();
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    roundRectPath(ctx, this.x, this.y + r * 0.35, this.width, this.height * 0.85, r * 0.4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ---- Jersey number stripe ----
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundRectPath(ctx, cx - r * 0.55, cy + r * 0.1, r * 1.1, r * 0.28, r * 0.12);
    ctx.fill();
    ctx.restore();

    // ---- Helmet / head ----
    ctx.save();
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, this.y + r * 0.55, r * 0.78, Math.PI, Math.PI * 2.35);
    ctx.arc(cx, this.y + r * 0.55, r * 0.78, Math.PI * -0.35, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ---- Goggle mask ----
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, cx - r * 0.62, this.y + r * 0.4, r * 1.24, r * 0.42, r * 0.18);
    ctx.fill();
    ctx.stroke();
    // tinted lenses
    ctx.fillStyle = frozen ? '#8FD6FF' : shadeColor;
    const lensY = this.y + r * 0.44;
    const lensR = r * 0.16;
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, lensY + lensR, lensR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.32, lensY + lensR, lensR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ---- Frozen sparkle overlay ----
    if (frozen) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ang = (Math.PI * 2 * i) / 3 + performance.now() / 600;
        const sx = cx + Math.cos(ang) * r * 0.9;
        const sy = cy + Math.sin(ang) * r * 0.9;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy);
        ctx.lineTo(sx + 3, sy);
        ctx.moveTo(sx, sy - 3);
        ctx.lineTo(sx, sy + 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ---- Shield bubble ----
    if (performance.now() < this.effects.shieldUntil) {
      ctx.save();
      const pulse = 1 + Math.sin(performance.now() / 160) * 0.05;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
      ctx.fillStyle = 'rgba(96, 165, 250, 0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, (r + 8) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // small highlight glint
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, (r + 8) * pulse, Math.PI * 1.15, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    }

    // ---- Just-tagged paint splash (brief expanding ring, fades with the timer) ----
    if (this.justTagged && window.cyberArenaTag && window.cyberArenaTag.glowFxEnabled) {
      const life = clamp(this.justTaggedTimer / 0.4, 0, 1); // 1 -> just tagged, 0 -> about to clear
      ctx.save();
      ctx.globalAlpha = life;
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + (1 - life) * r * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ---- Tag indicator (small arrow above the head, tagger only) ----
    if (this.role === ROLES.TAGGER) {
      ctx.save();
      ctx.fillStyle = '#FF7A00';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 1.5;
      const ax = cx;
      const ay = this.y - r * 0.7;
      const halfWidth = 6;
      const height = 8;
      ctx.beginPath();
      ctx.moveTo(ax, ay + height); // tip, pointing down toward the head
      ctx.lineTo(ax - halfWidth, ay);
      ctx.lineTo(ax + halfWidth, ay);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Axis-aligned bounding box for collision checks. */
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
