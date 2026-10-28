/**
 * Leaderboard Module - Handles leaderboard display and interactions
 * Displays ranked players with their statistics
 */

class LeaderboardManager {
    constructor() {
        this.leaderboardBody = document.getElementById('leaderboardBody');
        this.clearBtn = document.getElementById('clearLeaderboardBtn');
        this.backBtn = document.getElementById('backBtn');
        this.totalPlayersEl = document.getElementById('totalPlayers');
        this.totalGamesEl = document.getElementById('totalGames');
        this.avgScoreEl = document.getElementById('avgScore');

        this.initializeEventListeners();
        this.loadLeaderboard();
    }

    /**
     * Initialize event listeners for buttons
     */
    initializeEventListeners() {
        this.clearBtn.addEventListener('click', () => this.handleClearLeaderboard());
        this.backBtn.addEventListener('click', () => this.goBackToGame());
    }

    /**
     * Load and display leaderboard
     */
    loadLeaderboard() {
        const leaderboard = getLeaderboard();
        this.displayLeaderboard(leaderboard);
        this.updateStatistics(leaderboard);
    }

    /**
     * Display leaderboard in table format
     * @param {array} leaderboard - Array of player objects sorted by rank
     */
    displayLeaderboard(leaderboard) {
        // Clear existing content
        this.leaderboardBody.innerHTML = '';

        if (leaderboard.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-state';
            emptyRow.innerHTML = '<td colspan="5">No records yet. Start playing to appear on the leaderboard!</td>';
            this.leaderboardBody.appendChild(emptyRow);
            return;
        }

        // Create rows for each player
        leaderboard.forEach((player, index) => {
            const row = this.createPlayerRow(player, index + 1);
            this.leaderboardBody.appendChild(row);
        });
    }

    /**
     * Create a table row for a player
     * @param {object} player - Player data object
     * @param {number} rank - Player's rank
     * @returns {HTMLElement} Table row element
     */
    createPlayerRow(player, rank) {
        const row = document.createElement('tr');
        row.className = 'leaderboard-row';

        // Rank with medal emoji
        const rankCell = document.createElement('td');
        rankCell.className = 'rank-cell';
        let medal = '';
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';
        rankCell.innerHTML = `<span class="rank-badge">${medal} ${rank}</span>`;

        // Player name
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = player.name;

        // Best score
        const scoreCell = document.createElement('td');
        scoreCell.className = 'score-cell';
        scoreCell.textContent = player.highScore || '0';

        // Best time
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = (player.bestTime === null || player.bestTime === undefined) ? 'N/A' : `${player.bestTime}s`;

        // Least moves
        const movesCell = document.createElement('td');
        movesCell.className = 'moves-cell';
        movesCell.textContent = (player.leastMoves === null || player.leastMoves === undefined) ? 'N/A' : player.leastMoves;

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        row.appendChild(timeCell);
        row.appendChild(movesCell);

        return row;
    }

    /**
     * Update leaderboard statistics cards
     * @param {array} leaderboard - Array of player objects
     */
    updateStatistics(leaderboard) {
        // Total players
        this.totalPlayersEl.textContent = leaderboard.length;

        // Total games played
        const totalGames = leaderboard.reduce((sum, player) => sum + (player.gamesPlayed || 0), 0);
        this.totalGamesEl.textContent = totalGames;

        // Average best score
        const avgScore = leaderboard.length > 0
            ? Math.round(leaderboard.reduce((sum, player) => sum + (player.highScore || 0), 0) / leaderboard.length)
            : 0;
        this.avgScoreEl.textContent = avgScore;
    }

    /**
     * Handle clear leaderboard button click
     */
    handleClearLeaderboard() {
        if (confirm('⚠️ Are you sure you want to clear ALL records? This cannot be undone!')) {
            clearLeaderboard();
            this.loadLeaderboard();
            alert('✓ All leaderboard records have been cleared!');
        }
    }

    /**
     * Go back to game page
     */
    goBackToGame() {
        window.location.href = 'index.html';
    }

    /**
     * Refresh leaderboard (useful for external updates)
     */
    refreshLeaderboard() {
        this.loadLeaderboard();
    }
}

// Initialize leaderboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LeaderboardManager();
});
