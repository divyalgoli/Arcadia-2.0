/**
 * UI Module - Handles index.html page interactions
 * Currently responsible for the theme toggle icon/button.
 * Theme state itself lives in theme.js (shared across all pages).
 * (Leaderboard/Settings buttons are plain links to their own pages.)
 */

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;

    function updateIcon(theme) {
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // theme.js already applied the saved theme; just sync the icon.
    updateIcon(getSavedTheme());

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = getSavedTheme() === 'dark' ? 'light' : 'dark';
            setSavedTheme(newTheme);
            updateIcon(newTheme);
        });
    }
});
