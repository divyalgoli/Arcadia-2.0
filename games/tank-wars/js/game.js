/**
 * Main Game Loop and State Manager for Tank Wars.
 * Coordinates 60 FPS requestAnimationFrame loop, power-up spawner, 5 maps, multi-round scoring, and stats.
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.logicalWidth = 1200;
    this.logicalHeight = 750;

    this.state = 'MENU'; // 'MENU', 'SETUP', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.lastTime = 0;

    this.map = null;
    this.player1 = null;
    this.player2 = null;
    this.bullets = [];
    this.powerUpSpawner = new window.PowerUpSpawner();

    this.matchMode = 'BO3'; // 'BO3', 'BO5', 'ENDLESS'
    this.targetWins = 2;
    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.matchTimeSeconds = 0;

    this.setupCanvasResize();
    this.bindUIEvents();
    this.initGameWorld('desert', 'Player 1', 'Player 2');

    requestAnimationFrame(this.loop.bind(this));
  }

  setupCanvasResize() {
    const resize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const targetAspect = this.logicalWidth / this.logicalHeight;

      let displayWidth = windowWidth;
      let displayHeight = windowWidth / targetAspect;

      if (displayHeight > windowHeight) {
        displayHeight = windowHeight;
        displayWidth = windowHeight * targetAspect;
      }

      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;

      this.canvas.width = this.logicalWidth;
      this.canvas.height = this.logicalHeight;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  bindUIEvents() {
    const ui = window.uiManager;

    ui.btnStartBattle?.addEventListener('click', () => {
      window.soundEngine?.init();
      window.soundEngine?.playButtonClick();

      const setup = ui.getSetupData();
      this.matchMode = setup.matchMode;
      this.targetWins = setup.matchMode === 'BO5' ? 3 : (setup.matchMode === 'BO3' ? 2 : Infinity);
      this.p1Rounds = 0;
      this.p2Rounds = 0;
      this.matchTimeSeconds = 0;

      ui.playerSetupScreen.classList.add('hidden');
      this.startNewMatch(setup.mapId, setup.p1Name, setup.p2Name);
    });

    ui.btnPauseHud?.addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        window.soundEngine?.playButtonClick();
        this.state = 'PAUSED';
        ui.showPauseMenu();
      }
    });

    ui.btnResumeGame?.addEventListener('click', () => {
      if (this.state === 'PAUSED') {
        window.soundEngine?.playButtonClick();
        ui.pauseMenu.classList.add('hidden');
        this.state = 'PLAYING';
      }
    });

    ui.btnRestartPause?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      ui.pauseMenu.classList.add('hidden');
      this.p1Rounds = 0;
      this.p2Rounds = 0;
      const setup = ui.getSetupData();
      this.startNewMatch(setup.mapId, setup.p1Name, setup.p2Name);
    });

    ui.btnExitHubPause?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      ui.pauseMenu.classList.add('hidden');
      this.state = 'MENU';
      ui.mainMenu.classList.remove('hidden');
    });

    ui.btnPlayAgain?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      ui.winnerScreen.classList.add('hidden');
      this.p1Rounds = 0;
      this.p2Rounds = 0;
      const setup = ui.getSetupData();
      this.startNewMatch(setup.mapId, setup.p1Name, setup.p2Name);
    });

    ui.btnChangeMap?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      ui.winnerScreen.classList.add('hidden');
      ui.playerSetupScreen.classList.remove('hidden');
    });

    ui.btnExitToHub?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      ui.winnerScreen.classList.add('hidden');
      this.state = 'MENU';
      ui.mainMenu.classList.remove('hidden');
    });
  }

  initGameWorld(mapId, p1Name, p2Name) {
    this.map = new window.ArenaMap(mapId, this.logicalWidth, this.logicalHeight);

    const p1Colors = { primary: '#00d2ff', dark: '#006699', glow: 'rgba(0,210,255,0.4)' };
    const p2Colors = { primary: '#ff6b00', dark: '#994000', glow: 'rgba(255,107,0,0.4)' };

    this.player1 = new window.Tank(1, p1Name, 120, 375, 0, p1Colors);
    this.player2 = new window.Tank(2, p2Name, 1080, 375, Math.PI, p2Colors);

    this.bullets = [];
    this.powerUpSpawner.reset();
    window.particleSystem?.clear();
  }

  startNewMatch(mapId, p1Name, p2Name) {
    this.player1.resetStats();
    this.player2.resetStats();
    this.startMatchRound(mapId, p1Name, p2Name);
  }

  startMatchRound(mapId, p1Name, p2Name) {
    this.map = new window.ArenaMap(mapId, this.logicalWidth, this.logicalHeight);
    this.player1.name = p1Name;
    this.player2.name = p2Name;
    this.player1.reset(120, 375, 0);
    this.player2.reset(1080, 375, Math.PI);

    this.bullets = [];
    this.powerUpSpawner.reset();
    window.particleSystem?.clear();

    this.state = 'PLAYING';
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.matchTimeSeconds += dt;

    const input = window.inputManager;
    const p1Input = input ? input.getP1Input() : { move: 0, turn: 0, shoot: false };
    const p2Input = input ? input.getP2Input() : { move: 0, turn: 0, shoot: false };

    // Update Tanks
    this.player1.update(p1Input, this.map, this.player2, dt, this.bullets);
    this.player2.update(p2Input, this.map, this.player1, dt, this.bullets);

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.map, [this.player1, this.player2]);
      if (!b.active) {
        this.bullets.splice(i, 1);
      }
    }

    // Update PowerUps
    this.powerUpSpawner.update(dt, this.map, [this.player1, this.player2]);

    // Update Particles
    window.particleSystem?.update(dt);

    // Update HUD
    window.uiManager?.updateHUD(
      this.player1,
      this.player2,
      this.p1Rounds,
      this.p2Rounds,
      this.matchTimeSeconds
    );

    // Check Round Winner
    if (!this.player1.alive && this.state === 'PLAYING') {
      this.state = 'ROUNDOVER';
      this.p2Rounds += 1;
      this.checkMatchEnd(2);
    } else if (!this.player2.alive && this.state === 'PLAYING') {
      this.state = 'ROUNDOVER';
      this.p1Rounds += 1;
      this.checkMatchEnd(1);
    }
  }

  checkMatchEnd(roundWinnerId) {
    const isMatchOver = (this.p1Rounds >= this.targetWins || this.p2Rounds >= this.targetWins);

    setTimeout(() => {
      if (isMatchOver) {
        this.state = 'GAMEOVER';
        const finalWinnerId = this.p1Rounds > this.p2Rounds ? 1 : 2;
        const winnerName = finalWinnerId === 1 ? this.player1.name : this.player2.name;

        window.statsManager?.recordMatchResult({
          p1Name: this.player1.name,
          p2Name: this.player2.name,
          winnerId: finalWinnerId,
          mapId: this.map.mapId,
          p1Stats: this.player1.stats,
          p2Stats: this.player2.stats
        });

        // Note: Tank Wars is local 2P multiplayer; global cloud score submission is excluded in Phase 2C
        // to prevent meaningless 2-3 round count constants from polluting leaderboards.
        // Local stats tracking in StatsManager continues below.
        // if (window.Arcadia) Arcadia.submitScore('tank-wars', 'Tank Wars', Math.max(this.p1Rounds, this.p2Rounds));
        if (window.ArcadiaProgression && typeof window.ArcadiaProgression.recordGameSession === 'function') {
          window.ArcadiaProgression.recordGameSession('tank-wars', {
            rounds: Math.max(this.p1Rounds, this.p2Rounds),
            matchTime: this.matchTimeSeconds,
            title: 'Tank Wars'
          });
        }

        window.uiManager?.showWinnerScreen(
          winnerName,
          finalWinnerId,
          this.player1.stats,
          this.player2.stats,
          this.matchTimeSeconds,
          this.p1Rounds,
          this.p2Rounds
        );
      } else {
        const setup = window.uiManager ? window.uiManager.getSetupData() : { mapId: 'desert', p1Name: 'Player 1', p2Name: 'Player 2' };
        this.startMatchRound(setup.mapId, setup.p1Name, setup.p2Name);
      }
    }, 1200);
  }

  render() {
    const ctx = this.ctx;
    const ps = window.particleSystem;

    ctx.save();
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    if (ps) {
      ctx.translate(ps.shakeOffsetX, ps.shakeOffsetY);
    }

    // 1. Map Base & Terrain
    this.map.renderTerrain(ctx);

    // 2. Obstacles & Crates
    this.map.renderObstacles(ctx);

    // 3. PowerUps
    this.powerUpSpawner.render(ctx);

    // 4. Bullets
    for (const b of this.bullets) {
      b.render(ctx);
    }

    // 5. Players
    this.player1.render(ctx);
    this.player2.render(ctx);

    // 6. Camouflage Bushes
    this.map.renderBushes(ctx);

    // 7. Particle Visual Effects
    if (ps) {
      ps.render(ctx);
    }

    ctx.restore();
  }
}

function initGameApp() {
  if (!window.gameApp) {
    window.gameApp = new Game();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGameApp);
} else {
  initGameApp();
}
