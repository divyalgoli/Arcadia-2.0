// ==========================================
// 👥 FRIENDS MODE MANAGEMENT
// ==========================================

const SESSION_STORAGE_KEY = 'friendsModeActive';

function isFriendsModeActive() {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
}

function activateFriendsMode() {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    window.location.href = 'game.html';
}

function deactivateFriendsMode() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.reload();
}

function getFriendsDeck() {
    // 4 friend photos = 4 pairs = 8 cards total
    const friendsPool = [
        'friends/friend1.jpeg',
        'friends/friend2.jpeg',
        'friends/friend3.jpeg',
        'friends/friend4.jpeg'
    ];

    return friendsPool;
}
