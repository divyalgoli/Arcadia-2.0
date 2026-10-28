/**
 * Storage Module - Handles all Local Storage operations for Memory Card Game
 * Provides reusable functions for saving/loading player data and game statistics
 */

const STORAGE_KEYS = {
    PLAYER_NAME: 'mcg_playerName',
    HIGH_SCORE: 'mcg_highScore',
    BEST_TIME: 'mcg_bestTime',
    LEAST_MOVES: 'mcg_leastMoves',
    GAMES_PLAYED: 'mcg_gamesPlayed',
    GAMES_WON: 'mcg_gamesWon',
    LAST_PLAYED: 'mcg_lastPlayed',
    TOTAL_MOVES: 'mcg_totalMoves',
    LEADERBOARD: 'mcg_leaderboard',
    THEME: 'mcg_theme',
    SOUND_ENABLED: 'mcg_soundEnabled',
    MUSIC_ENABLED: 'mcg_musicEnabled',
    DIFFICULTY: 'mcg_difficulty'
};

/**
 * Initialize a new player with default values
 * @param {string} playerName - Name of the player
 * @returns {object} Player object with default values
 */
function initializePlayer(playerName) {
    return {
        name: playerName,
        highScore: 0,
        // null means "no record yet". We deliberately avoid Infinity here:
        // JSON.stringify() silently turns Infinity into null when saving to
        // localStorage, which used to desync the "=== Infinity" checks used
        // for display after a reload. null is stable across save/load.
        bestTime: null,
        leastMoves: null,
        gamesPlayed: 0,
        gamesWon: 0,
        totalMoves: 0,
        lastPlayed: new Date().toISOString()
    };
}

/**
 * Save player name to Local Storage
 * @param {string} playerName - Name of the player
 */
function savePlayerName(playerName) {
    if (!playerName || playerName.trim() === '') {
        console.error('Player name cannot be empty');
        return false;
    }
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, playerName.trim());
    return true;
}

/**
 * Get player name from Local Storage
 * @returns {string|null} Player name or null if not set
 */
function getPlayerName() {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
}

/**
 * Save game result and update player statistics
 * Called after each game by the game logic module
 * @param {number} score - Score achieved in the game
 * @param {number} time - Time taken (in seconds)
 * @param {number} moves - Number of moves made
 * @param {boolean} won - Whether the game was won
 */
function saveGameResult(score, time, moves, won = true) {
    const playerName = getPlayerName();
    if (!playerName) {
        console.error('Player name not set');
        return false;
    }

    const currentData = getPlayerData(playerName) || initializePlayer(playerName);
    
    // Update statistics
    currentData.gamesPlayed = (currentData.gamesPlayed || 0) + 1;
    if (won) currentData.gamesWon = (currentData.gamesWon || 0) + 1;
    currentData.totalMoves = (currentData.totalMoves || 0) + moves;
    currentData.lastPlayed = new Date().toISOString();

    // Update best records
    if (score > currentData.highScore) {
        currentData.highScore = score;
    }
    if (currentData.bestTime === null || time < currentData.bestTime) {
        currentData.bestTime = time;
    }
    if (currentData.leastMoves === null || moves < currentData.leastMoves) {
        currentData.leastMoves = moves;
    }

    // Save to leaderboard
    saveToLeaderboard(currentData);
    
    return true;
}

/**
 * Get all player data
 * @param {string} playerName - Name of the player (if not provided, uses current player)
 * @returns {object|null} Player data object or null if not found
 */
function getPlayerData(playerName = null) {
    const name = playerName || getPlayerName();
    if (!name) return null;

    const leaderboard = getLeaderboard();
    return leaderboard.find(player => player.name === name) || null;
}

/**
 * Update high score for current player
 * @param {number} newScore - New high score
 * @returns {boolean} Success status
 */
function updateHighScore(newScore) {
    const playerName = getPlayerName();
    if (!playerName) return false;

    const playerData = getPlayerData(playerName) || initializePlayer(playerName);
    if (newScore > playerData.highScore) {
        playerData.highScore = newScore;
        saveToLeaderboard(playerData);
        return true;
    }
    return false;
}

/**
 * Save player to leaderboard
 * @param {object} playerData - Player data object
 */
function saveToLeaderboard(playerData) {
    const leaderboard = getLeaderboard();
    const existingIndex = leaderboard.findIndex(p => p.name === playerData.name);
    
    if (existingIndex >= 0) {
        leaderboard[existingIndex] = playerData;
    } else {
        leaderboard.push(playerData);
    }
    
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
}

/**
 * Get entire leaderboard sorted by highest score, then lowest time
 * @returns {array} Sorted leaderboard array
 */
function getLeaderboard() {
    const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    let leaderboard = data ? JSON.parse(data) : [];
    
    // Sort by highest score, then by lowest time.
    // bestTime may be null ("no completed game yet") — treat null as
    // worst-case (Infinity) for sorting only, so players without a
    // finished time never get ranked above players who have one.
    // (Without this, JS coerces null to 0 in subtraction, which would
    // wrongly make "no record" look like the best possible time.)
    leaderboard.sort((a, b) => {
        if (b.highScore !== a.highScore) {
            return b.highScore - a.highScore;
        }
        const aTime = a.bestTime === null ? Infinity : a.bestTime;
        const bTime = b.bestTime === null ? Infinity : b.bestTime;
        return aTime - bTime;
    });
    
    return leaderboard;
}

/**
 * Calculate win percentage for current player
 * @param {string} playerName - Name of the player (if not provided, uses current player)
 * @returns {number} Win percentage (0-100)
 */
function calculateWinPercentage(playerName = null) {
    const player = getPlayerData(playerName);
    if (!player || player.gamesPlayed === 0) return 0;
    return Math.round((player.gamesWon / player.gamesPlayed) * 100);
}

/**
 * Calculate average moves for current player
 * @param {string} playerName - Name of the player (if not provided, uses current player)
 * @returns {number} Average moves
 */
function calculateAverageMoves(playerName = null) {
    const player = getPlayerData(playerName);
    if (!player || player.gamesPlayed === 0) return 0;
    return Math.round(player.totalMoves / player.gamesPlayed);
}

/**
 * Clear entire leaderboard (with confirmation)
 * @returns {boolean} Success status
 */
function clearLeaderboard() {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify([]));
    return true;
}

/**
 * Clear all player data for current player
 * @returns {boolean} Success status
 */
function clearAllPlayerData() {
    const playerName = getPlayerName();
    if (!playerName) return false;

    Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.PLAYER_NAME && key !== STORAGE_KEYS.THEME && 
            key !== STORAGE_KEYS.SOUND_ENABLED && key !== STORAGE_KEYS.MUSIC_ENABLED &&
            key !== STORAGE_KEYS.DIFFICULTY) {
            localStorage.removeItem(key);
        }
    });

    // Remove from leaderboard
    const leaderboard = getLeaderboard().filter(p => p.name !== playerName);
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));

    return true;
}

/**
 * Clear all data including settings (nuclear option)
 * @returns {boolean} Success status
 */
function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    return true;
}

/**
 * Export all data as JSON
 * @returns {string} JSON string of all stored data
 */
function exportData() {
    const data = {
        playerName: getPlayerName(),
        playerData: getPlayerData(),
        leaderboard: getLeaderboard(),
        settings: {
            theme: localStorage.getItem(STORAGE_KEYS.THEME),
            soundEnabled: localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED),
            musicEnabled: localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED),
            difficulty: localStorage.getItem(STORAGE_KEYS.DIFFICULTY)
        },
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 * @param {string} jsonData - JSON string of data to import
 * @returns {boolean} Success status
 */
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        if (data.playerName) {
            savePlayerName(data.playerName);
        }
        
        if (data.leaderboard && Array.isArray(data.leaderboard)) {
            localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(data.leaderboard));
        }
        
        if (data.settings) {
            if (data.settings.theme) localStorage.setItem(STORAGE_KEYS.THEME, data.settings.theme);
            if (data.settings.soundEnabled) localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, data.settings.soundEnabled);
            if (data.settings.musicEnabled) localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, data.settings.musicEnabled);
            if (data.settings.difficulty) localStorage.setItem(STORAGE_KEYS.DIFFICULTY, data.settings.difficulty);
        }
        
        return true;
    } catch (error) {
        console.error('Failed to import data:', error);
        return false;
    }
}

/**
 * Get all player statistics for display
 * @param {string} playerName - Name of the player (if not provided, uses current player)
 * @returns {object} Statistics object
 */
function getPlayerStats(playerName = null) {
    const player = getPlayerData(playerName);
    if (!player) return null;

    return {
        name: player.name,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        winPercentage: calculateWinPercentage(playerName),
        bestScore: player.highScore,
        bestTime: player.bestTime === null ? 'N/A' : `${player.bestTime}s`,
        leastMoves: player.leastMoves === null ? 'N/A' : player.leastMoves,
        averageMoves: calculateAverageMoves(playerName),
        lastPlayed: new Date(player.lastPlayed).toLocaleDateString()
    };
}

/**
 * Load player and initialize if first time
 * @param {string} playerName - Name of the player
 * @returns {object} Player data
 */
function loadPlayer(playerName) {
    savePlayerName(playerName);
    let player = getPlayerData(playerName);
    
    if (!player) {
        player = initializePlayer(playerName);
        saveToLeaderboard(player);
    }
    
    return player;
}
