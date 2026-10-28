/**
 * Settings Module - Handles settings page functionality
 * Manages theme, sound, music, difficulty, and data management
 */

class SettingsManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.soundToggle = document.getElementById('soundToggle');
        this.musicToggle = document.getElementById('musicToggle');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.resetDataBtn = document.getElementById('resetDataBtn');
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.backBtn = document.getElementById('backBtn');
        
        // Modal elements
        this.confirmationModal = document.getElementById('confirmationModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmYes = document.getElementById('confirmYes');
        this.confirmNo = document.getElementById('confirmNo');

        this.initializeEventListeners();
        this.loadSettings();
        // theme.js already applied the saved theme on load.
    }

    /**
     * Initialize event listeners for all controls
     */
    initializeEventListeners() {
        // Theme toggle
        this.themeToggle.addEventListener('change', (e) => this.handleThemeChange(e));

        // Sound toggles
        this.soundToggle.addEventListener('change', (e) => this.handleSoundChange(e));
        this.musicToggle.addEventListener('change', (e) => this.handleMusicChange(e));

        // Difficulty select
        this.difficultySelect.addEventListener('change', (e) => this.handleDifficultyChange(e));

        // Data management buttons
        this.resetDataBtn.addEventListener('click', () => this.handleResetData());
        this.exportDataBtn.addEventListener('click', () => this.handleExportData());
        this.backBtn.addEventListener('click', () => this.goBackToGame());

        // Modal buttons
        this.confirmYes.addEventListener('click', () => this.executeConfirmedAction());
        this.confirmNo.addEventListener('click', () => this.closeConfirmation());
    }

    /**
     * Load current settings and populate UI
     */
    loadSettings() {
        // Load theme
        const isDarkMode = getSavedTheme() === 'dark';
        this.themeToggle.checked = isDarkMode;

        // Load sound settings
        const soundEnabled = soundManager.getSoundEnabled();
        this.soundToggle.checked = soundEnabled;

        const musicEnabled = soundManager.getMusicEnabled();
        this.musicToggle.checked = musicEnabled;

        // Load difficulty
        const difficulty = localStorage.getItem('mcg_difficulty') || 'medium';
        this.difficultySelect.value = difficulty;
    }

    /**
     * Handle theme toggle change
     * @param {Event} e - Change event
     */
    handleThemeChange(e) {
        const isDarkMode = e.target.checked;
        const theme = isDarkMode ? 'dark' : 'light';
        setSavedTheme(theme);
    }

    /**
     * Handle sound toggle change
     * @param {Event} e - Change event
     */
    handleSoundChange(e) {
        soundManager.setSoundEnabled(e.target.checked);
    }

    /**
     * Handle music toggle change
     * @param {Event} e - Change event
     */
    handleMusicChange(e) {
        soundManager.setMusicEnabled(e.target.checked);
    }

    /**
     * Handle difficulty selection change
     * @param {Event} e - Change event
     */
    handleDifficultyChange(e) {
        const difficulty = e.target.value;
        localStorage.setItem('mcg_difficulty', difficulty);
    }

    /**
     * Handle reset data button click
     */
    handleResetData() {
        this.pendingAction = 'reset';
        this.showConfirmation(
            'Reset All Data',
            'This will delete all your game statistics, scores, and leaderboard records. This cannot be undone. Are you sure?'
        );
    }

    /**
     * Handle export data button click
     */
    handleExportData() {
        const data = exportData();
        this.downloadJSON(data, `memory-game-data-${new Date().getTime()}.json`);
    }

    /**
     * Show confirmation modal
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     */
    showConfirmation(title, message) {
        this.confirmTitle.textContent = title;
        this.confirmMessage.textContent = message;
        this.confirmationModal.classList.remove('hidden');
    }

    /**
     * Close confirmation modal
     */
    closeConfirmation() {
        this.confirmationModal.classList.add('hidden');
        this.pendingAction = null;
    }

    /**
     * Execute the confirmed action
     */
    executeConfirmedAction() {
        if (this.pendingAction === 'reset') {
            clearAllPlayerData();
            alert('✓ All your data has been reset!');
        }
        this.closeConfirmation();
    }

    /**
     * Download JSON file
     * @param {string} data - JSON data to download
     * @param {string} filename - Name of the file
     */
    downloadJSON(data, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    /**
     * Go back to game page
     */
    goBackToGame() {
        window.location.href = 'index.html';
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
