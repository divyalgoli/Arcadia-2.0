// ==========================================
// 🧠 GLOBAL GAME MEMORY STATE
// ==========================================
const gameMemory = {
    deck: [],               // The full list of card objects
    flippedCards: [],       // Keeps track of currently selected cards (max 2)
    matchedPairsCount: 0,   // How many successful pairs have been found
    totalPairsTarget: 4,    // Target pairs to win
    columns: 4,             // Grid columns for the current difficulty
    isBoardLocked: false,   // Prevents rapid clicking during a mismatch penalty
    secondsElapsed: 0,      // Total seconds passed on the clock
    timerInterval: null,    // Holds the active timer ID
    friendsMode: false      // Is Friends Mode active?
};

const boardEl = document.getElementById('board');

// ==========================================
// 👥 FRIENDS MODE DETECTION
// ==========================================
function detectFriendsModeOnLoad() {
    if (typeof isFriendsModeActive !== 'undefined' && isFriendsModeActive()) {
        gameMemory.friendsMode = true;
        document.getElementById('friendsModeBadge').style.display = 'block';
        document.getElementById('backToNormalModeBtn').style.display = 'inline-block';
    }
}

// Set up back to normal mode button
document.getElementById('backToNormalModeBtn').addEventListener('click', () => {
    if (typeof deactivateFriendsMode !== 'undefined') {
        deactivateFriendsMode();
    }
});

// ==========================================
// 🎬 INITIALIZATION BOOT
// ==========================================
function getDifficultySettings() {
    // Friends Mode uses however many friend photos exist
    if (typeof isFriendsModeActive !== 'undefined' && isFriendsModeActive()) {
        const friendPairs = getFriendsDeck().length;
        return {
            pairs: friendPairs,
            columns: 4
        };
    }
    
    const difficulty = localStorage.getItem('mcg_difficulty') || 'medium';
    return {
        pairs: DIFFICULTY_PAIRS[difficulty] || 8,
        columns: DIFFICULTY_COLUMNS[difficulty] || 4
    };
}

function startNewGame() {
    const { pairs, columns } = getDifficultySettings();

    gameMemory.matchedPairsCount = 0;
    gameMemory.totalPairsTarget = pairs;
    gameMemory.columns = columns;
    gameMemory.isBoardLocked = false;
    gameMemory.secondsElapsed = 0;
    gameMemory.flippedCards = [];

    if (gameMemory.timerInterval !== null) {
        clearInterval(gameMemory.timerInterval);
        gameMemory.timerInterval = null;
    }

    document.getElementById('time-display').textContent = '0';

    // Build the deck (from cards.js) and score tracker (from score.js)
    gameMemory.deck = generateAndShuffleDeck(pairs);
    Score.initialize(pairs);

    renderBoard();
}

// ==========================================
// 🖼️ RENDER THE BOARD
// ==========================================
function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${gameMemory.columns}, auto)`;

    gameMemory.deck.forEach(card => {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        slot.dataset.id = card.id;
        
        // Check if the value is an image path (Friends Mode) or emoji (Normal Mode)
        const isImagePath = typeof card.value === 'string' && card.value.includes('/');
        let frontContent;
        if (isImagePath) {
            frontContent = `<img src="${card.value}" alt="Friend card" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        } else {
            frontContent = `<div>${card.value}</div>`;
        }
        
        slot.innerHTML = `
            <div class="card-face card-back">❓</div>
            <div class="card-face card-front">${frontContent}</div>
        `;
        slot.addEventListener('click', () => playerClicksCard(card.id));
        boardEl.appendChild(slot);
    });
}

function getSlotEl(id) {
    return boardEl.querySelector(`.card-slot[data-id="${id}"]`);
}

// ==========================================
// 👆 THE CARD SELECTION ENGINE
// ==========================================
function playerClicksCard(clickedCardId) {
    if (gameMemory.isBoardLocked === true) return;

    let card = gameMemory.deck.find(c => c.id === clickedCardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Start the clock on the very first click of the game
    if (gameMemory.secondsElapsed === 0 && gameMemory.flippedCards.length === 0 && gameMemory.matchedPairsCount === 0 && gameMemory.timerInterval === null) {
        startTimer();
    }

    card.isFlipped = true;
    gameMemory.flippedCards.push(card);
    getSlotEl(card.id).classList.add('flipped');
    soundManager.playFlipSound();

    if (gameMemory.flippedCards.length === 2) {
        Score.incrementMove();
        checkIfCardsMatch();
    }
}

// ==========================================
// ✅ EVALUATION STATE MACHINE
// ==========================================
function checkIfCardsMatch() {
    let card1 = gameMemory.flippedCards[0];
    let card2 = gameMemory.flippedCards[1];

    if (card1.value === card2.value) {
        // --- MATCH SUCCESS ---
        card1.isMatched = true;
        card2.isMatched = true;
        getSlotEl(card1.id).classList.add('matched');
        getSlotEl(card2.id).classList.add('matched');
        soundManager.playMatchSound();
        Score.incrementMatch();

        gameMemory.matchedPairsCount++;
        gameMemory.flippedCards = [];

        if (gameMemory.matchedPairsCount === gameMemory.totalPairsTarget) {
            handleGameWon();
        }
    } else {
        // --- MATCH MISMATCH ---
        soundManager.playWrongMatchSound();
        gameMemory.isBoardLocked = true;
        getSlotEl(card1.id).classList.add('mismatch');
        getSlotEl(card2.id).classList.add('mismatch');

        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;
            getSlotEl(card1.id).classList.remove('flipped', 'mismatch');
            getSlotEl(card2.id).classList.remove('flipped', 'mismatch');
            gameMemory.flippedCards = [];
            gameMemory.isBoardLocked = false;
        }, 800);
    }
}

// ==========================================
// 🏆 WIN HANDLING
// ==========================================
function handleGameWon() {
    stopTimer();
    soundManager.playWinSound();

    const stats = Score.getStats(gameMemory.secondsElapsed);

    document.getElementById('resultTime').textContent = `${stats.time}s`;
    document.getElementById('resultMoves').textContent = stats.moves;
    document.getElementById('resultScore').textContent = stats.score;

    saveGameResult(stats.score, stats.time, stats.moves, true);

    if (window.Arcadia) Arcadia.submitScore('memory-card', 'Memory Card', stats.score);

    openModal('resultModal');
}

// ==========================================
// 🙋 PLAYER NAME HANDLING
// ==========================================
const gameModalOverlay = document.getElementById('gameModalOverlay');

function openModal(id) {
    document.getElementById(id).classList.add('active');
    gameModalOverlay.classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    gameModalOverlay.classList.remove('active');
}

function ensurePlayerName() {
    const existingName = getPlayerName();
    if (existingName) {
        startNewGame();
        return;
    }
    openModal('nameModal');
}

document.getElementById('startPlayingBtn').addEventListener('click', () => {
    const input = document.getElementById('playerNameInput');
    const name = input.value.trim();
    if (!name) {
        input.focus();
        return;
    }
    loadPlayer(name);
    closeModal('nameModal');
    startNewGame();
});

document.getElementById('playerNameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('startPlayingBtn').click();
});

// ==========================================
// 🎛️ CONTROL BUTTONS
// ==========================================
document.getElementById('newGameBtn').addEventListener('click', startNewGame);
document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
    window.location.href = 'leaderboard.html';
});
document.getElementById('goToLeaderboardBtn').addEventListener('click', () => {
    window.location.href = 'leaderboard.html';
});
document.getElementById('playAgainBtn').addEventListener('click', () => {
    closeModal('resultModal');
    startNewGame();
});

// Detect Friends Mode and show badge/button if active
detectFriendsModeOnLoad();

// Boot the game once the player's name is confirmed
ensurePlayerName();
