/**
 * Fruit Slash - UI Overlay & Modal Controller
 */

import { STORAGE } from './storage.js';
import { AUDIO } from './audio.js';
import { CONFIG } from './config.js';

export class UIController {
    constructor(gameEngine) {
        this.game = gameEngine;

        this.menuContainer = document.getElementById('menu-overlay');
        this.modeSelectContainer = document.getElementById('mode-select-overlay');
        this.countdownContainer = document.getElementById('countdown-overlay');
        this.gameplayContainer = document.getElementById('gameplay-overlay');
        this.pauseModal = document.getElementById('pause-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.leaderboardModal = document.getElementById('leaderboard-modal');

        this.playerProfileBadge = document.getElementById('menu-player-badge');
        this.hudPlayerName = document.getElementById('hud-player-name');
        this.scoreDisplay = document.getElementById('hud-score');
        this.livesDisplay = document.getElementById('hud-lives');
        this.timerDisplay = document.getElementById('hud-timer');
        this.pauseBtn = document.getElementById('hud-pause-btn');

        this.initButtons();
        this.updatePlayerNameDisplay();
    }

    updatePlayerNameDisplay() {
        const name = STORAGE.getPlayerName();
        if (this.playerProfileBadge) {
            this.playerProfileBadge.textContent = `👤 Player: ${name}`;
        }
        if (this.hudPlayerName) {
            this.hudPlayerName.textContent = `PLAYER: ${name}`;
        }
    }

    initButtons() {
        if (this.playerProfileBadge) {
            this.playerProfileBadge.addEventListener('click', () => {
                AUDIO.playClick();
                this.showSettingsModal();
            });
        }

        const settingsBtn = document.getElementById('menu-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                AUDIO.playClick();
                this.showSettingsModal();
            });
        }

        const highScoresBtn = document.getElementById('menu-highscores-btn');
        if (highScoresBtn) {
            highScoresBtn.addEventListener('click', () => {
                AUDIO.playClick();
                this.showLeaderboardModal();
            });
        }

        this.pauseBtn.addEventListener('click', () => {
            AUDIO.playClick();
            this.game.togglePause();
        });

        document.getElementById('pause-resume-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.game.togglePause();
        });

        document.getElementById('pause-restart-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.hidePauseUI();
            this.game.startGame();
        });

        document.getElementById('pause-menu-btn').addEventListener('click', () => {
            AUDIO.playClick();
            AUDIO.stopBGM();
            this.hidePauseUI();
            this.game.initMenuState();
        });

        document.getElementById('go-restart-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.hideGameOverUI();
            this.game.startGame();
        });

        document.getElementById('go-menu-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.hideGameOverUI();
            this.game.initMenuState();
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.settingsModal.classList.add('hidden');
        });

        document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
            AUDIO.playClick();
            this.leaderboardModal.classList.add('hidden');
        });

        const soundToggle = document.getElementById('sound-toggle-btn');
        soundToggle.addEventListener('click', () => {
            const isMuted = AUDIO.toggleMute();
            STORAGE.setSoundMuted(isMuted);
            soundToggle.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
            soundToggle.classList.toggle('muted', isMuted);
            AUDIO.playClick();
        });

        const saveNameBtn = document.getElementById('save-username-btn');
        const usernameInput = document.getElementById('username-input');
        const nameStatusMsg = document.getElementById('username-status-msg');

        saveNameBtn.addEventListener('click', () => {
            const result = STORAGE.setPlayerName(usernameInput.value);
            if (result.success) {
                nameStatusMsg.textContent = `Name saved: ${result.name}`;
                nameStatusMsg.style.color = '#4caf50';
                this.updatePlayerNameDisplay();
                this.updateSettingsModalState();
            } else {
                nameStatusMsg.textContent = result.reason;
                nameStatusMsg.style.color = '#ff1744';
            }
        });

        document.getElementById('tab-survival').addEventListener('click', (e) => {
            AUDIO.playClick();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.renderLeaderboard(CONFIG.MODES.SURVIVAL);
        });

        document.getElementById('tab-timeattack').addEventListener('click', (e) => {
            AUDIO.playClick();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.renderLeaderboard(CONFIG.MODES.TIME_ATTACK);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                if (this.game.state === GAME_STATE.PLAYING && this.game.mode === CONFIG.MODES.SURVIVAL) {
                    this.game.togglePause();
                }
            }
        });
    }

    hideAllOverlays() {
        this.menuContainer.classList.add('hidden');
        this.modeSelectContainer.classList.add('hidden');
        this.countdownContainer.classList.add('hidden');
        this.gameplayContainer.classList.add('hidden');
        this.pauseModal.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
    }

    showMenuUI() {
        this.hideAllOverlays();
        this.updatePlayerNameDisplay();
        this.menuContainer.classList.remove('hidden');
    }

    showModeSelectUI() {
        this.hideAllOverlays();
        this.modeSelectContainer.classList.remove('hidden');
    }

    showCountdownUI(val) {
        this.hideAllOverlays();
        this.countdownContainer.classList.remove('hidden');
        document.getElementById('countdown-text').textContent = val;
    }

    updateCountdown(val) {
        document.getElementById('countdown-text').textContent = val;
    }

    showGameplayUI(mode, score, lives, timer) {
        this.hideAllOverlays();
        this.gameplayContainer.classList.remove('hidden');
        this.updatePlayerNameDisplay();
        this.updateScore(score);

        if (mode === CONFIG.MODES.SURVIVAL) {
            this.livesDisplay.classList.remove('hidden');
            this.timerDisplay.classList.add('hidden');
            this.pauseBtn.classList.remove('hidden');
            this.updateLives(lives);
        } else {
            this.livesDisplay.classList.add('hidden');
            this.timerDisplay.classList.remove('hidden');
            this.pauseBtn.classList.add('hidden');
            this.updateTimer(timer);
        }
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `SCORE: ${score}`;
    }

    updateLives(lives) {
        let hearts = '';
        for (let i = 0; i < lives; i++) hearts += '❤️ ';
        this.livesDisplay.textContent = `LIVES: ${hearts || '0'}`;
    }

    updateTimer(seconds) {
        this.timerDisplay.textContent = `TIME: ${Math.max(0, seconds)}s`;
    }

    showPauseUI() {
        this.pauseModal.classList.remove('hidden');
    }

    hidePauseUI() {
        this.pauseModal.classList.add('hidden');
    }

    showGameOverUI(score, highScore, isNewHS, mode) {
        this.hideAllOverlays();
        this.gameOverModal.classList.remove('hidden');

        document.getElementById('go-score').textContent = score;
        document.getElementById('go-highscore').textContent = highScore;

        const newBadge = document.getElementById('go-new-hs-badge');
        if (isNewHS) {
            newBadge.classList.remove('hidden');
        } else {
            newBadge.classList.add('hidden');
        }

        document.getElementById('go-mode-title').textContent = mode === CONFIG.MODES.SURVIVAL ? 'SURVIVAL MODE' : 'TIME ATTACK MODE';
    }

    hideGameOverUI() {
        this.gameOverModal.classList.add('hidden');
    }

    showSettingsModal() {
        this.updateSettingsModalState();
        this.settingsModal.classList.remove('hidden');
    }

    updateSettingsModalState() {
        const soundToggle = document.getElementById('sound-toggle-btn');
        const isMuted = STORAGE.isSoundMuted();
        soundToggle.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
        soundToggle.classList.toggle('muted', isMuted);

        const usernameInput = document.getElementById('username-input');
        const saveNameBtn = document.getElementById('save-username-btn');
        const nameStatusMsg = document.getElementById('username-status-msg');

        usernameInput.value = STORAGE.getPlayerName();

        if (STORAGE.canChangeName()) {
            usernameInput.disabled = false;
            saveNameBtn.disabled = false;
            nameStatusMsg.textContent = 'You can change your username 1 time.';
            nameStatusMsg.style.color = '#bbbbbb';
        } else {
            usernameInput.disabled = true;
            saveNameBtn.disabled = true;
            nameStatusMsg.textContent = 'Username change limit reached (1/1).';
            nameStatusMsg.style.color = '#ff9800';
        }
    }

    async showLeaderboardModal() {
        this.leaderboardModal.classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-survival').classList.add('active');
        await this.renderLeaderboard(CONFIG.MODES.SURVIVAL);
    }

    async renderLeaderboard(mode) {
        const tbody = document.getElementById('leaderboard-list');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px;">Loading online scores...</td></tr>';

        const scores = await STORAGE.fetchLeaderboard(mode);
        tbody.innerHTML = '';

        if (scores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#aaa;">No scores yet — be the first to set one! 🏆</td></tr>';
            return;
        }

        scores.forEach((entry, index) => {
            const tr = document.createElement('tr');
            if (entry.name === STORAGE.getPlayerName()) {
                tr.classList.add('highlight-user');
            }
            tr.innerHTML = `
                <td>#${index + 1}</td>
                <td>${entry.name}</td>
                <td><strong>${entry.score}</strong></td>
            `;
            tbody.appendChild(tr);
        });
    }
}
