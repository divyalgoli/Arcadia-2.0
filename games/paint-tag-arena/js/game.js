// game.js
// Main controller. Imports every other module, owns the game loop, and
// coordinates input, collision, UI, scoring, rounds, pausing, and power-ups.
// No player-movement or collision-resolution math lives here — that stays
// isolated in player.js and collision.js.

// game.js
// Main controller. Owns the game loop, and coordinates input, collision, UI,
// scoring, rounds, pausing, and power-ups. No player-movement or
// collision-resolution math lives here — that stays isolated in player.js
// and collision.js.
//
// Loaded as a plain (non-module) script, after utils.js, player.js,
// collision.js, mapdata.js, map.js, and ui.js — so Player, MapManager, ui,
// resolveAllCollisions, checkTagCollision, checkPowerupCollision, ROLES,
// POWERUP_TYPES, randomChoice, randomRange, createFrameClock, loadAudio,
// and playSound are all already in scope as shared globals.

// ---------------------------------------------------------------------------
// Tunable match settings
// ---------------------------------------------------------------------------

const COUNTDOWN_SECONDS = 3;
const WINNING_SCORE = 5;
const TAG_IMMUNITY_SECONDS = 1; // brief grace period after a tag so roles can't ping-pong instantly
const POWERUP_SPAWN_INTERVAL = [6, 12]; // random range, seconds
const POWERUP_DURATION = {
  [POWERUP_TYPES.SPEED_BOOST]: 5000, // ms
  [POWERUP_TYPES.SHIELD]: 6000,
  [POWERUP_TYPES.FREEZE_TRAP]: 2000,
};
const POWERUP_RESPAWN_DELAY = [4, 9]; // seconds after collection

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.mapManager = new MapManager();
    this.clock = createFrameClock();

    this.pressedKeys = new Set();
    this.isPaused = false;
    this.isCountingDown = false;
    this.isGameOver = false;
    this.animationFrameId = null;

    this.round = 1;
    this.matchStarted = false;
    this.roundDuration = getRoundDurationPref();
    this.timeRemaining = this.roundDuration;

    this.activePowerups = []; // { type, x, y, radius }
    this.powerupSpawnTimer = randomRange(...POWERUP_SPAWN_INTERVAL);
    this.tagImmunityRemaining = 0; // seconds left before a new tag can register

    // Settings-menu state
    this.masterVolume = 0.7; // 0..1, matches the #vol-master slider's default
    this.sfxVolume = 0.85; // 0..1, matches the #vol-sfx slider's default
    this.screenShakeEnabled = true;
    this.glowFxEnabled = true;
    this.shakeTime = 0; // seconds remaining on the current screen-shake
    this.shakeMagnitude = 0;

    this._baseVolumes = { music: 0.4, tag: 0.8, dash: 0.6, click: 0.7, victory: 0.9 };

    this._initAudio();
    this._initPlayers();
    this._bindInput();

    ui.bindMenuButtons({
      onRestart: () => this.restart(),
      onResume: () => this.resume(),
      onSettings: () => this._handleSettings(),
    });
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  _initAudio() {
    this.audio = {
      music: loadAudio('assets/sound/bgm.mp3', { loop: true }),
      tag: loadAudio('assets/sound/tag.wav'),
      dash: loadAudio('assets/sound/dash.wav'),
      click: loadAudio('assets/sound/click.wav'),
      victory: loadAudio('assets/sound/win.wav'),
    };
    this._applyVolumes();
    this.powerupIcons = {
      [POWERUP_TYPES.SPEED_BOOST]: loadImage('assets/images/speed.svg'),
      [POWERUP_TYPES.SHIELD]: loadImage('assets/images/shield.svg'),
      [POWERUP_TYPES.DOUBLE_DASH]: loadImage('assets/images/double_dash.svg'),
      [POWERUP_TYPES.FREEZE_TRAP]: loadImage('assets/images/freeze.svg'),
    };
  }

  _initPlayers() {
    this.player1 = new Player({
      id: 'player1',
      label: 'Player 1',
      color: '#FF7A00', // orange paint
      keyBindings: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', dash: 'ShiftLeft' },
      role: ROLES.TAGGER,
    });

    this.player2 = new Player({
      id: 'player2',
      label: 'Player 2',
      color: '#3B82F6', // blue paint
      keyBindings: {
        up: 'KeyI',
        down: 'KeyK',
        left: 'KeyJ',
        right: 'KeyL',
        dash: 'KeyU',
      },
      role: ROLES.RUNNER,
    });

    this.players = [this.player1, this.player2];
  }

  _bindInput() {
    window.addEventListener('keydown', (e) => {
      this.pressedKeys.add(e.code);
      if (e.code === 'Escape') this._togglePause();
    });
    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.code);
    });
    // Pause automatically if the tab loses focus mid-match.
    window.addEventListener('blur', () => {
      if (!this.isGameOver && !this.isCountingDown) this.pause();
    });
  }

  // -------------------------------------------------------------------------
  // Boot sequence
  // -------------------------------------------------------------------------

  /** Loads the initial map, positions players, and starts the match. */
  async start(mapName = 'arena1') {
    this.matchStarted = true;
    ui.showLoadingScreen();
    try {
      await this.mapManager.loadMap(mapName);
    } catch (err) {
      console.error(err);
    }
    ui.hideLoadingScreen();
    ui.resetHud();

    this._resetPlayersToSpawn();
    ui.updateRoles(this.player1.role, this.player2.role);
    ui.updateScore(this.player1.score, this.player2.score);
    ui.updateRound(this.round);

    playSound(this.audio.music);
    this._beginCountdown();
  }

  /** Fully resets match state and starts over. */
  async restart() {
    playSound(this.audio.click);
    this.round = 1;
    this.isGameOver = false;
    this.player1.score = 0;
    this.player2.score = 0;
    this.player1.role = ROLES.TAGGER;
    this.player2.role = ROLES.RUNNER;
    this.activePowerups = [];
    ui.hideGameOverScreen();
    await this.start(this.mapManager.currentMapName || 'arena1');
  }

  /**
   * Changes how long each round lasts (in seconds). Takes effect starting
   * with the next round's countdown — it won't cut a round already in
   * progress short or extend it.
   */
  setRoundDuration(seconds) {
    this.roundDuration = seconds;
    if (!this.matchStarted) {
      this.timeRemaining = seconds;
      ui.updateTimer(this.timeRemaining);
    }
  }

  /** Switches to a different arena map mid-session (e.g. from settings). */
  async switchMap(mapName) {
    await this.mapManager.switchMap(mapName);
    this._resetPlayersToSpawn();
  }

  _resetPlayersToSpawn() {
    this.player1.reset(this.mapManager.getSpawnPoint('player1'));
    this.player2.reset(this.mapManager.getSpawnPoint('player2'));
  }

  // -------------------------------------------------------------------------
  // Countdown / round flow
  // -------------------------------------------------------------------------

  _beginCountdown() {
    this.isCountingDown = true;
    let count = COUNTDOWN_SECONDS;
    ui.showCountdown(count);

    const tick = () => {
      count -= 1;
      if (count > 0) {
        ui.showCountdown(count);
        setTimeout(tick, 1000);
      } else {
        ui.showCountdown('GO!');
        setTimeout(() => {
          ui.hideCountdown();
          this.isCountingDown = false;
          this.timeRemaining = this.roundDuration;
          this._loop();
        }, 600);
      }
    };
    setTimeout(tick, 1000);
  }

  /**
   * Called when the tagger catches the runner. This only flips who's "it" —
   * the round keeps running. The round ends when the timer runs out, and
   * whoever is the runner (not currently tagged) at that point scores.
   */
  _handleTagged(tagger, runner) {
    tagger.justTagged = true;
    tagger.justTaggedTimer = 0.4;
    playSound(this.audio.tag);

    if (this.screenShakeEnabled) {
      this.shakeTime = 0.25;
      this.shakeMagnitude = 10;
    }

    // Swap roles: the tagger becomes the new runner, the runner becomes tagger.
    tagger.changeRole(ROLES.RUNNER);
    runner.changeRole(ROLES.TAGGER);
    ui.updateRoles(this.player1.role, this.player2.role);

    // Brief immunity + a physical separation so the same contact can't
    // instantly re-trigger a tag the other way on the very next frame.
    this.tagImmunityRemaining = TAG_IMMUNITY_SECONDS;
    const arena = this.mapManager.getArenaBounds();
    resolvePlayerCollision(this.player1, this.player2);
    resolveArenaBounds(this.player1, arena);
    resolveArenaBounds(this.player2, arena);
  }

  /** Called when the round timer expires. Whoever's the runner (uncaught) scores. */
  _handleTimeExpired() {
    const runner = this.players.find((p) => p.role === ROLES.RUNNER);
    if (runner) runner.score += 1;
    // Roles remain the same going into the next round.
    this._advanceRound();
  }

  /** Shared cleanup for both tag and timeout round endings. */
  _advanceRound() {
    ui.updateScore(this.player1.score, this.player2.score);

    const winner = this.players.find((p) => p.score >= WINNING_SCORE);
    if (winner) {
      this._endMatch(winner);
      return;
    }

    this.round += 1;
    ui.updateRound(this.round);
    ui.updateRoles(this.player1.role, this.player2.role);

    this._resetPlayersToSpawn();
    this.activePowerups = [];
    this.powerupSpawnTimer = randomRange(...POWERUP_SPAWN_INTERVAL);
    this.tagImmunityRemaining = 0;

    cancelAnimationFrame(this.animationFrameId);
    this._beginCountdown();
  }

  _endMatch(winner) {
    this.isGameOver = true;
    cancelAnimationFrame(this.animationFrameId);
    playSound(this.audio.victory);
    recordMatchResult(winner.label, winner.score);
    ui.renderLeaderboard(getLeaderboard());
    ui.showGameOverScreen(winner.label, this.player1.score, this.player2.score);
  }

  // -------------------------------------------------------------------------
  // Settings: volume & FX toggles
  // -------------------------------------------------------------------------

  /** Recomputes every audio element's volume from the base level + sliders. */
  _applyVolumes() {
    if (!this.audio) return;
    this.audio.music.volume = this._baseVolumes.music * this.masterVolume;
    for (const key of ['tag', 'dash', 'click', 'victory']) {
      this.audio[key].volume = this._baseVolumes[key] * this.masterVolume * this.sfxVolume;
    }
  }

  /** @param {number} percent - 0..100, from the #vol-master slider. */
  setMasterVolume(percent) {
    this.masterVolume = clamp(percent, 0, 100) / 100;
    this._applyVolumes();
  }

  /** @param {number} percent - 0..100, from the #vol-sfx slider. */
  setSfxVolume(percent) {
    this.sfxVolume = clamp(percent, 0, 100) / 100;
    this._applyVolumes();
  }

  // -------------------------------------------------------------------------
  // Pause / resume
  // -------------------------------------------------------------------------

  _togglePause() {
    if (this.isGameOver || this.isCountingDown) return;
    if (this.isPaused) this.resume();
    else this.pause();
  }

  pause() {
    if (this.isPaused || this.isGameOver || this.isCountingDown) return;
    this.isPaused = true;
    cancelAnimationFrame(this.animationFrameId);
    ui.showPauseMenu();
  }

  resume() {
    if (!this.isPaused) return;
    playSound(this.audio.click);
    this.isPaused = false;
    ui.hidePauseMenu();
    this.clock.reset();
    this._loop();
  }

  _handleSettings() {
    playSound(this.audio.click);
    // The settings modal itself is opened by the DOMContentLoaded wiring at
    // the bottom of this file; its arena buttons call switchMap() directly.
  }

  // -------------------------------------------------------------------------
  // Power-ups
  // -------------------------------------------------------------------------

  _updatePowerupSpawning(dt) {
    this.powerupSpawnTimer -= dt;
    if (this.powerupSpawnTimer <= 0) {
      this._trySpawnPowerup();
      this.powerupSpawnTimer = randomRange(...POWERUP_SPAWN_INTERVAL);
    }
  }

  _trySpawnPowerup() {
    const spawnPoints = this.mapManager.getPowerupSpawnPoints();
    if (spawnPoints.length === 0) return;

    const freeSpawnPoints = spawnPoints.filter(
      (point) => !this.activePowerups.some((p) => p.x === point.x && p.y === point.y)
    );
    if (freeSpawnPoints.length === 0) return;

    const spawnPoint = randomChoice(freeSpawnPoints);
    const type = spawnPoint.type || randomChoice(Object.values(POWERUP_TYPES));

    this.activePowerups.push({
      type,
      x: spawnPoint.x,
      y: spawnPoint.y,
      radius: 16,
    });
  }

  _updatePowerupCollection() {
    for (const player of this.players) {
      for (const powerup of this.activePowerups) {
        if (powerup.collected) continue;
        if (checkPowerupCollision(player, powerup)) {
          this._applyPowerup(player, powerup);
        }
      }
    }
    // Remove collected power-ups from the active list; schedule a respawn.
    this.activePowerups = this.activePowerups.filter((p) => !p.collected);
  }

  _applyPowerup(player, powerup) {
    powerup.collected = true;
    const now = performance.now();

    switch (powerup.type) {
      case POWERUP_TYPES.SPEED_BOOST:
        player.effects.speedBoostUntil = now + POWERUP_DURATION[POWERUP_TYPES.SPEED_BOOST];
        break;
      case POWERUP_TYPES.SHIELD:
        player.effects.shieldUntil = now + POWERUP_DURATION[POWERUP_TYPES.SHIELD];
        break;
      case POWERUP_TYPES.DOUBLE_DASH:
        player.dashChargesAvailable += 1;
        player.resetCooldown();
        break;
      case POWERUP_TYPES.FREEZE_TRAP: {
        // Freezes the OTHER player, not the collector.
        const other = this.players.find((p) => p.id !== player.id);
        if (other) {
          other.effects.frozenUntil = now + POWERUP_DURATION[POWERUP_TYPES.FREEZE_TRAP];
        }
        break;
      }
      default:
        break;
    }

    // Schedule this spawn point to produce a new power-up later.
    const respawnDelay = randomRange(...POWERUP_RESPAWN_DELAY) * 1000;
    setTimeout(() => {
      this.powerupSpawnTimer = Math.min(this.powerupSpawnTimer, 0.1);
    }, respawnDelay);
  }

  _drawPowerups() {
    const colors = {
      [POWERUP_TYPES.SPEED_BOOST]: '#FACC15',
      [POWERUP_TYPES.SHIELD]: '#3B82F6',
      [POWERUP_TYPES.DOUBLE_DASH]: '#A855F7',
      [POWERUP_TYPES.FREEZE_TRAP]: '#22C55E',
    };
    const now = performance.now();
    for (const powerup of this.activePowerups) {
      const icon = this.powerupIcons[powerup.type];
      const bob = Math.sin(now / 260 + powerup.x) * 4; // gentle floating bob
      const spin = (now / 1800) % (Math.PI * 2); // slow rotation
      const drawX = powerup.x;
      const drawY = powerup.y + bob;

      this.ctx.save();

      // Soft drop shadow on the grass beneath the power-up
      this.ctx.fillStyle = 'rgba(38, 50, 56, 0.18)';
      this.ctx.beginPath();
      this.ctx.ellipse(powerup.x, powerup.y + powerup.radius * 0.9, powerup.radius * 0.8, powerup.radius * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Colorful paint-ring glow behind the icon
      if (this.glowFxEnabled) {
        this.ctx.fillStyle = colors[powerup.type] || '#FFFFFF';
        this.ctx.globalAlpha = 0.22;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, powerup.radius * 1.35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
      }

      this.ctx.translate(drawX, drawY);
      this.ctx.rotate(spin);
      if (icon && icon.complete && icon.naturalWidth > 0) {
        const size = powerup.radius * 2.1;
        this.ctx.drawImage(icon, -size / 2, -size / 2, size, size);
      } else {
        // Icon still loading (rare, since SVGs load fast) — draw a plain
        // colored circle placeholder so the power-up is still visible.
        this.ctx.fillStyle = colors[powerup.type] || '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // Main loop
  // -------------------------------------------------------------------------

  _loop() {
    const dt = this.clock.tick();

    if (!this.isPaused && !this.isCountingDown && !this.isGameOver) {
      this._update(dt);
    }
    this._draw();

    this.animationFrameId = requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    // --- Input & movement ---
    for (const player of this.players) {
      const dashed = player.handleInput(this.pressedKeys, dt);
      if (dashed) playSound(this.audio.dash);
      player.update(dt);
    }

    // --- Environment collisions (walls/obstacles/arena bounds only) ---
    // Deliberately NOT resolving player-vs-player collision yet: doing so
    // would push the tagger and runner apart the instant they touch, which
    // means they'd never actually overlap and a tag could never register.
    const arena = this.mapManager.getArenaBounds();
    const staticRects = this.mapManager.getStaticCollisionRects();
    resolveEnvironmentCollisions(this.player1, arena, staticRects);
    resolveEnvironmentCollisions(this.player2, arena, staticRects);

    // --- Teleport pads ---
    const teleports = this.mapManager.getTeleports();
    for (const player of this.players) {
      if (player.teleportCooldown > 0) continue;
      if (resolveTeleports(player, teleports)) {
        player.teleportCooldown = 0.5; // grace period so a two-way pair can't bounce them right back
      }
    }

    // --- Tag detection ---
    // Checked while the two players are still allowed to overlap, so contact
    // is actually detectable. Skipped for a brief window right after a tag
    // so the just-swapped roles can't immediately tag back.
    if (this.tagImmunityRemaining > 0) {
      this.tagImmunityRemaining = Math.max(0, this.tagImmunityRemaining - dt);
    } else {
      const safeZones = this.mapManager.getSafeZones();
      const tagResult = checkTagCollision(this.player1, this.player2, safeZones);
      if (tagResult) {
        this._handleTagged(tagResult.tagger, tagResult.runner);
      }
    }

    // --- Player-vs-player push-apart ---
    // Only now separate them (for normal "bumping" movement feel), since no
    // tag occurred this frame.
    resolvePlayerCollision(this.player1, this.player2);
    resolveArenaBounds(this.player1, arena);
    resolveArenaBounds(this.player2, arena);

    // --- Power-ups ---
    this._updatePowerupSpawning(dt);
    this._updatePowerupCollection();

    // --- Screen shake decay ---
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    // --- Timer ---
    this.timeRemaining -= dt;
    ui.updateTimer(this.timeRemaining);
    if (this.timeRemaining <= 0) {
      this._handleTimeExpired();
      return;
    }

    // --- HUD ---
    ui.updateEnergyBar('player1', this.player1.energy);
    ui.updateEnergyBar('player2', this.player2.energy);
    ui.updateDashCooldown('player1', this.player1.getDashCooldownPercent());
    ui.updateDashCooldown('player2', this.player2.getDashCooldownPercent());
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (this.screenShakeEnabled && this.shakeTime > 0) {
      const falloff = this.shakeTime / 0.25; // fades out as shakeTime runs down
      const offsetX = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
      const offsetY = (Math.random() * 2 - 1) * this.shakeMagnitude * falloff;
      ctx.translate(offsetX, offsetY);
    }

    // Arena floor — sunlit grass field with a faint mowed-stripe pattern
    const arena = this.mapManager.getArenaBounds();
    ctx.save();
    const floorGradient = ctx.createLinearGradient(0, 0, 0, arena.height);
    floorGradient.addColorStop(0, '#8CE06A');
    floorGradient.addColorStop(1, '#5FBF47');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, 0, arena.width, arena.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const stripeWidth = 64;
    for (let sx = 0; sx < arena.width; sx += stripeWidth * 2) {
      ctx.fillRect(sx, 0, stripeWidth, arena.height);
    }
    ctx.restore();

    // Walls & obstacles — drawn as paintball bunkers / wooden crates
    for (const rect of this.mapManager.getStaticCollisionRects()) {
      drawBunkerRect(ctx, rect.x, rect.y, rect.width, rect.height);
    }

    this._drawPowerups();

    for (const player of this.players) {
      player.draw(ctx);
    }

    ctx.restore(); // matches the screen-shake ctx.save() at the top of _draw()
  }
}

// ---------------------------------------------------------------------------
// Entry point — assumes the existing HTML has a <canvas id="game-canvas">.
// ---------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Cyber Arena Tag: #game-canvas element not found.');
    return;
  }
  const game = new Game(canvas);
  window.cyberArenaTag = game; // exposed for settings/debug hooks
  ui.renderLeaderboard(getLeaderboard());

  const byId = (id) => document.getElementById(id);
  const showEl = (elm) => elm && elm.classList.remove('hidden');
  const hideEl = (elm) => elm && elm.classList.add('hidden');

  const mainMenu = byId('main-menu');
  const gameHeader = document.querySelector('.game-header');
  const gameMain = document.querySelector('.game-main');

  let hasStarted = false;
  let selectedMapName = 'arena1';

  function enterMatch() {
    hideEl(mainMenu);
    showEl(gameHeader);
    showEl(gameMain);
    if (!hasStarted) {
      hasStarted = true;
      game.start(selectedMapName);
    } else {
      game.resume();
    }
  }

  function exitToMenu() {
    hideEl(gameHeader);
    hideEl(gameMain);
    showEl(mainMenu);
    ui.hidePauseMenu();
  }

  // --- Main menu ---
  byId('btn-play')?.addEventListener('click', enterMatch);

  // --- Round time selector (in Settings) ---
  const timeOptionButtons = Array.from(document.querySelectorAll('#round-time-options .time-option-btn'));
  function markSelectedTimeOption(seconds) {
    timeOptionButtons.forEach((btn) => {
      btn.classList.toggle('selected', Number(btn.dataset.seconds) === seconds);
    });
  }
  markSelectedTimeOption(game.roundDuration);
  timeOptionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const seconds = Number(btn.dataset.seconds);
      game.setRoundDuration(seconds);
      setRoundDurationPref(seconds);
      markSelectedTimeOption(seconds);
      playSound(game.audio.click);
    });
  });

  // --- Arena selector (in Settings) ---
  const arenaOptionButtons = Array.from(document.querySelectorAll('#arena-select-options .arena-option-btn'));
  function markSelectedArenaOption(mapName) {
    arenaOptionButtons.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.map === mapName);
    });
  }
  markSelectedArenaOption(selectedMapName);
  arenaOptionButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const mapName = btn.dataset.map;
      selectedMapName = mapName;
      markSelectedArenaOption(mapName);
      playSound(game.audio.click);
      if (hasStarted) {
        await game.switchMap(mapName);
      }
    });
  });

  // --- Volume sliders (in Settings) ---
  const volMaster = byId('vol-master');
  const volSfx = byId('vol-sfx');
  if (volMaster) {
    game.setMasterVolume(Number(volMaster.value));
    volMaster.addEventListener('input', () => game.setMasterVolume(Number(volMaster.value)));
  }
  if (volSfx) {
    game.setSfxVolume(Number(volSfx.value));
    volSfx.addEventListener('input', () => game.setSfxVolume(Number(volSfx.value)));
  }

  // --- Screen shake / Paint Splash FX toggles (in Settings) ---
  const toggleScreenshake = byId('toggle-screenshake');
  const toggleGlow = byId('toggle-glow');
  if (toggleScreenshake) {
    game.screenShakeEnabled = toggleScreenshake.checked;
    toggleScreenshake.addEventListener('change', () => {
      game.screenShakeEnabled = toggleScreenshake.checked;
    });
  }
  if (toggleGlow) {
    game.glowFxEnabled = toggleGlow.checked;
    toggleGlow.addEventListener('change', () => {
      game.glowFxEnabled = toggleGlow.checked;
    });
  }

  // --- Simple modal open/close wiring ---
  const modalToggles = [
    ['btn-character-select', 'character-select-screen'],
    ['btn-leaderboard', 'leaderboard-popup'],
    ['btn-settings-menu', 'settings-menu'],
    ['btn-settings', 'settings-menu'],
    ['btn-settings-bottom', 'settings-menu'],
    ['btn-rules', 'rules-screen'],
  ];
  modalToggles.forEach(([btnId, modalId]) => {
    byId(btnId)?.addEventListener('click', () => {
      showEl(byId(modalId));
      if (modalId === 'character-select-screen') {
        const nameInput = byId('player-name-input');
        const name2Input = byId('player2-name-input');
        if (nameInput) nameInput.value = game.player1.label;
        if (name2Input) name2Input.value = game.player2.label;
      }
    });
  });

  const modalClosers = [
    'btn-character-back',
    'btn-leaderboard-close',
    'btn-settings-save',
    'btn-settings-close',
    'btn-rules-close',
  ];
  modalClosers.forEach((btnId) => {
    byId(btnId)?.addEventListener('click', (e) => {
      hideEl(e.target.closest('.modal-overlay'));
    });
  });

  // --- Character select: apply the entered names to both players ---
  byId('btn-character-confirm')?.addEventListener('click', (e) => {
    const nameInput = byId('player-name-input');
    const name2Input = byId('player2-name-input');
    const typedName = nameInput?.value.trim();
    const typedName2 = name2Input?.value.trim();
    if (typedName) {
      game.player1.label = typedName;
      const nameDisplay = byId('player1-name-display');
      if (nameDisplay) nameDisplay.textContent = typedName;
    }
    if (typedName2) {
      game.player2.label = typedName2;
      const name2Display = byId('player2-name-display');
      if (name2Display) name2Display.textContent = typedName2;
    }
    hideEl(e.target.closest('.modal-overlay'));
  });

  // --- In-match header/bottom-bar controls ---
  byId('btn-pause')?.addEventListener('click', () => game._togglePause());
  byId('btn-pause-bottom')?.addEventListener('click', () => game._togglePause());
  byId('btn-pause-restart')?.addEventListener('click', () => game.restart());
  byId('btn-pause-exit')?.addEventListener('click', exitToMenu);
  byId('btn-pause-settings')?.addEventListener('click', () => showEl(byId('settings-menu')));

  // --- Game over screen ---
  byId('btn-play-again')?.addEventListener('click', () => {
    ui.hideGameOverScreen();
    game.restart();
  });
  byId('btn-gameover-menu')?.addEventListener('click', () => {
    ui.hideGameOverScreen();
    exitToMenu();
  });
});
