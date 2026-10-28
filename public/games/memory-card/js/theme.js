// ==========================================
// 🎨 SHARED THEME SYSTEM
// Single source of truth for light/dark mode across
// every page (index, game, leaderboard, settings).
// Previously each page had its own disconnected theme
// logic (body.dark-theme vs html.dark-mode), so a change
// on one page silently had no effect anywhere else.
// ==========================================

function getSavedTheme() {
    return localStorage.getItem('mcg_theme') || 'light';
}

function applyGlobalTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function setSavedTheme(theme) {
    localStorage.setItem('mcg_theme', theme);
    applyGlobalTheme(theme);
}

// Apply the saved theme as soon as this script runs (placed at the
// end of <body>, so document.body already exists).
applyGlobalTheme(getSavedTheme());
