// ==========================================
// 🔀 GAME SETUP & SHUFFLE SYSTEM
// ==========================================

// Full symbol pool - large enough to cover the hardest difficulty
const SYMBOL_POOL = ['🍎', '🐶', '🚗', '⭐', '🍕', '🎸', '🚀', '🎈', '🐱', '🌈', '⚽', '🎮'];

// Difficulty -> number of pairs
const DIFFICULTY_PAIRS = {
    easy: 6,
    medium: 8,
    hard: 12
};

// Difficulty -> grid columns (used by game.js when building the board)
const DIFFICULTY_COLUMNS = {
    easy: 4,
    medium: 4,
    hard: 6
};

function generateAndShuffleDeck(pairCount = 4) {
    let baseSymbols;

    // Check if Friends Mode is active - use all uploaded friend photos
    if (typeof isFriendsModeActive !== 'undefined' && isFriendsModeActive()) {
        baseSymbols = getFriendsDeck(); // One pair per friend photo
    } else {
        // 1. Pick the symbols we need for this difficulty
        baseSymbols = SYMBOL_POOL.slice(0, pairCount);
    }

    // 2. Duplicate them so every symbol has a matching pair
    let fullDeck = [...baseSymbols, ...baseSymbols];

    // 3. The Fisher-Yates Shuffle Algorithm (ensures uniform randomness)
    for (let i = fullDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]]; // Swap positions
    }

    // 4. Convert those mixed symbols into clear data objects
    return fullDeck.map((symbol, index) => {
        return {
            id: index,         // Unique number identifier
            value: symbol,     // The item (e.g., '🍎' or image path)
            isFlipped: false,  // Is it face up?
            isMatched: false   // Is it solved?
        };
    });
}
