/**
 * Comprehensive UI Manager for Tank Wars.
 * Coordinates Player Setup Screen, Map Carousel, Enhanced HUD, and Post-Match Analytics.
 */
class UIManager {
  constructor() {
    // HUD Elements
    this.p1NameText = document.getElementById('p1-name-display');
    this.p2NameText = document.getElementById('p2-name-display');
    this.p1HpText = document.getElementById('p1-hp-text');
    this.p1HpBar = document.getElementById('p1-hp-bar');
    this.p2HpText = document.getElementById('p2-hp-text');
    this.p2HpBar = document.getElementById('p2-hp-bar');

    this.p1WeaponBadge = document.getElementById('p1-weapon-badge');
    this.p2WeaponBadge = document.getElementById('p2-weapon-badge');
    this.p1PowerupBadge = document.getElementById('p1-powerup-badge');
    this.p2PowerupBadge = document.getElementById('p2-powerup-badge');

    this.roundScoreText = document.getElementById('hud-round-score');
    this.matchTimerText = document.getElementById('hud-match-timer');

    // Setup & Overlay Screens
    this.mainMenu = document.getElementById('main-menu');
    this.playerSetupScreen = document.getElementById('player-setup-modal');
    this.howToPlayModal = document.getElementById('how-to-play-modal');
    this.pauseMenu = document.getElementById('pause-menu');
    this.winnerScreen = document.getElementById('winner-screen');

    // Setup Inputs & Controls
    this.inputP1Name = document.getElementById('input-p1-name');
    this.inputP2Name = document.getElementById('input-p2-name');
    this.selectMatchMode = document.getElementById('select-match-mode');

    // Buttons
    this.btnPlayGame = document.getElementById('btn-play-game');
    this.btnStartBattle = document.getElementById('btn-start-battle');
    this.btnBackSetup = document.getElementById('btn-back-setup');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.btnCloseInstructions = document.getElementById('btn-close-instructions');
    this.btnPauseHud = document.getElementById('btn-pause-hud');
    this.btnResumeGame = document.getElementById('btn-resume-game');
    this.btnRestartPause = document.getElementById('btn-restart-pause');
    this.btnExitHubPause = document.getElementById('btn-exit-hub-pause');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnChangeMap = document.getElementById('btn-change-map');
    this.btnExitToHub = document.getElementById('btn-exit-to-hub');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');

    this.selectedMapId = 'desert';
    this.bindEvents();
    this.setupMapCarousel();
  }

  setupMapCarousel() {
    const mapCards = document.querySelectorAll('.map-select-card');
    mapCards.forEach(card => {
      card.addEventListener('click', () => {
        mapCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedMapId = card.dataset.mapId || 'desert';
        window.soundEngine?.playButtonClick();
      });
    });
  }

  bindEvents() {
    this.btnSoundToggle?.addEventListener('click', () => {
      if (window.soundEngine) {
        const isMuted = window.soundEngine.toggleMute();
        this.btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    this.btnHowToPlay?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      this.howToPlayModal.classList.remove('hidden');
    });

    this.btnCloseInstructions?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      this.howToPlayModal.classList.add('hidden');
    });

    this.btnPlayGame?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      this.mainMenu.classList.add('hidden');
      this.playerSetupScreen.classList.remove('hidden');
    });

    this.btnBackSetup?.addEventListener('click', () => {
      window.soundEngine?.playButtonClick();
      this.playerSetupScreen.classList.add('hidden');
      this.mainMenu.classList.remove('hidden');
    });
  }

  getSetupData() {
    return {
      p1Name: this.inputP1Name?.value.trim() || 'Player 1',
      p2Name: this.inputP2Name?.value.trim() || 'Player 2',
      mapId: this.selectedMapId || 'desert',
      matchMode: this.selectMatchMode?.value || 'BO3'
    };
  }

  updateHUD(player1, player2, p1Rounds, p2Rounds, matchTimeSeconds) {
    if (this.p1NameText) this.p1NameText.textContent = player1.name;
    if (this.p2NameText) this.p2NameText.textContent = player2.name;

    if (this.p1HpText) this.p1HpText.textContent = `${Math.ceil(player1.hp)} HP`;
    if (this.p1HpBar) this.p1HpBar.style.width = `${Math.max(0, player1.hp)}%`;

    if (this.p2HpText) this.p2HpText.textContent = `${Math.ceil(player2.hp)} HP`;
    if (this.p2HpBar) this.p2HpBar.style.width = `${Math.max(0, player2.hp)}%`;

    // Weapon Icons & Ammo
    if (this.p1WeaponBadge) {
      const w1 = window.WeaponSystem?.getWeaponConfig(player1.currentWeapon);
      const ammoStr = player1.weaponAmmo === Infinity ? '∞' : player1.weaponAmmo;
      this.p1WeaponBadge.textContent = `${w1.icon} ${w1.name} [${ammoStr}]`;
    }
    if (this.p2WeaponBadge) {
      const w2 = window.WeaponSystem?.getWeaponConfig(player2.currentWeapon);
      const ammoStr = player2.weaponAmmo === Infinity ? '∞' : player2.weaponAmmo;
      this.p2WeaponBadge.textContent = `${w2.icon} ${w2.name} [${ammoStr}]`;
    }

    // Powerup Timers
    if (this.p1PowerupBadge) {
      const activeP1 = this.getActivePowerupString(player1);
      this.p1PowerupBadge.textContent = activeP1 || 'No Buff';
      this.p1PowerupBadge.style.opacity = activeP1 ? '1' : '0.5';
    }
    if (this.p2PowerupBadge) {
      const activeP2 = this.getActivePowerupString(player2);
      this.p2PowerupBadge.textContent = activeP2 || 'No Buff';
      this.p2PowerupBadge.style.opacity = activeP2 ? '1' : '0.5';
    }

    // Round Score & Match Timer
    if (this.roundScoreText) {
      this.roundScoreText.textContent = `SCORE: ${p1Rounds} - ${p2Rounds}`;
    }
    if (this.matchTimerText) {
      const mins = Math.floor(matchTimeSeconds / 60).toString().padStart(2, '0');
      const secs = Math.floor(matchTimeSeconds % 60).toString().padStart(2, '0');
      this.matchTimerText.textContent = `${mins}:${secs}`;
    }
  }

  getActivePowerupString(player) {
    const parts = [];
    for (const [key, sec] of Object.entries(player.activePowerUps)) {
      if (sec > 0) {
        parts.push(`${key} (${Math.ceil(sec)}s)`);
      }
    }
    return parts.join(' | ');
  }

  showPauseMenu() {
    this.pauseMenu.classList.remove('hidden');
  }

  showWinnerScreen(winnerName, winnerId, p1Stats, p2Stats, matchTimeSeconds, p1Rounds, p2Rounds) {
    const winnerTitle = document.getElementById('winner-name-text');
    if (winnerTitle) {
      winnerTitle.textContent = `${winnerName.toUpperCase()} VICTORIOUS!`;
      winnerTitle.style.color = winnerId === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
    }

    // Fill Analytics Table
    const statP1Rounds = document.getElementById('stat-p1-rounds');
    const statP2Rounds = document.getElementById('stat-p2-rounds');
    const statP1Dmg = document.getElementById('stat-p1-dmg');
    const statP2Dmg = document.getElementById('stat-p2-dmg');
    const statP1Shots = document.getElementById('stat-p1-shots');
    const statP2Shots = document.getElementById('stat-p2-shots');

    if (statP1Rounds) statP1Rounds.textContent = p1Rounds;
    if (statP2Rounds) statP2Rounds.textContent = p2Rounds;
    if (statP1Dmg) statP1Dmg.textContent = p1Stats.damageDealt;
    if (statP2Dmg) statP2Dmg.textContent = p2Stats.damageDealt;
    if (statP1Shots) statP1Shots.textContent = p1Stats.shotsFired;
    if (statP2Shots) statP2Shots.textContent = p2Stats.shotsFired;

    this.winnerScreen.classList.remove('hidden');
    window.soundEngine?.playVictory();
  }
}

window.uiManager = new UIManager();
