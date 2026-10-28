/**
 * Fruit Slash - Local Storage & Leaderboard Module
 */

const STORAGE_KEYS = {
    // Renamed with a "_v2" suffix so any previously saved name/score/leaderboard
    // data from older versions of the game is no longer read — everyone starts fresh.
    PLAYER_NAME: 'fruit_slash_player_name_v2',
    NAME_CHANGE_COUNT: 'fruit_slash_name_change_count_v2',
    HIGH_SCORE_SURVIVAL: 'fruit_slash_hs_survival_v2',
    HIGH_SCORE_TIME_ATTACK: 'fruit_slash_hs_time_attack_v2',
    SOUND_MUTED: 'fruit_slash_sound_muted_v2',
    LEADERBOARD_SURVIVAL: 'fruit_slash_lb_survival_v2',
    LEADERBOARD_TIME_ATTACK: 'fruit_slash_lb_time_attack_v2'
};

export class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        if (!this.getPlayerName()) {
            this.setPlayerName('NinjaSlash' + Math.floor(Math.random() * 8999 + 1000));
        }
    }

    getPlayerName() {
        return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'NinjaSlash1001';
    }

    getNameChangeCount() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.NAME_CHANGE_COUNT) || '0', 10);
    }

    canChangeName() {
        return this.getNameChangeCount() < 1;
    }

    setPlayerName(newName) {
        const cleanName = newName.trim().substring(0, 14) || 'NinjaSlash';
        const count = this.getNameChangeCount();
        if (count >= 1 && localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)) {
            return { success: false, reason: 'Username can only be changed once!' };
        }
        localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, cleanName);
        if (localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) !== cleanName || count === 0) {
            localStorage.setItem(STORAGE_KEYS.NAME_CHANGE_COUNT, (count + 1).toString());
        }
        return { success: true, name: cleanName };
    }

    getHighScore(mode) {
        const key = mode === 'SURVIVAL' ? STORAGE_KEYS.HIGH_SCORE_SURVIVAL : STORAGE_KEYS.HIGH_SCORE_TIME_ATTACK;
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    saveHighScore(mode, score) {
        const currentHS = this.getHighScore(mode);
        if (score > currentHS) {
            const key = mode === 'SURVIVAL' ? STORAGE_KEYS.HIGH_SCORE_SURVIVAL : STORAGE_KEYS.HIGH_SCORE_TIME_ATTACK;
            localStorage.setItem(key, score.toString());
            this.submitOnlineScore(mode, this.getPlayerName(), score);
            return true; // New High Score!
        }
        return false;
    }

    isSoundMuted() {
        return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true';
    }

    setSoundMuted(muted) {
        localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, muted ? 'true' : 'false');
    }

    /**
     * Local Leaderboard (starts empty — no fake/placeholder scores).
     * This can be swapped for real fetch() calls to a backend later; for now
     * it persists genuine scores the player has actually earned on this device.
     */
    async fetchLeaderboard(mode) {
        const key = mode === 'SURVIVAL' ? STORAGE_KEYS.LEADERBOARD_SURVIVAL : STORAGE_KEYS.LEADERBOARD_TIME_ATTACK;
        const raw = localStorage.getItem(key);
        let entries = [];
        try {
            entries = raw ? JSON.parse(raw) : [];
        } catch (e) {
            entries = [];
        }
        entries.sort((a, b) => b.score - a.score);
        return entries.slice(0, 10);
    }

    async submitOnlineScore(mode, username, score) {
        const key = mode === 'SURVIVAL' ? STORAGE_KEYS.LEADERBOARD_SURVIVAL : STORAGE_KEYS.LEADERBOARD_TIME_ATTACK;
        const raw = localStorage.getItem(key);
        let entries = [];
        try {
            entries = raw ? JSON.parse(raw) : [];
        } catch (e) {
            entries = [];
        }

        const existingIndex = entries.findIndex(e => e.name === username);
        if (existingIndex !== -1) {
            entries[existingIndex].score = Math.max(entries[existingIndex].score, score);
        } else {
            entries.push({ name: username, score });
        }

        entries.sort((a, b) => b.score - a.score);
        localStorage.setItem(key, JSON.stringify(entries.slice(0, 10)));
    }
}

export const STORAGE = new StorageManager();
