// ==========================================
// ⏱️ CLOCK CONTROL SYSTEM
// ==========================================

function startTimer() {
    // Prevent creating duplicate clock timers if one is already running
    if (gameMemory.timerInterval !== null) return; 

    console.log("⏰ Clock started!");
    
    // Triggers this block every 1000ms (1 second)
    gameMemory.timerInterval = setInterval(() => {
        // Safety check: If the player won, stop the clock instantly
        if (gameMemory.matchedPairsCount === gameMemory.totalPairsTarget) {
            stopTimer();
            return;
        }

        gameMemory.secondsElapsed++;

        // 📞 UI Hook: push the current time onto the screen
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = gameMemory.secondsElapsed;
        }
    }, 1000);
}

function stopTimer() {
    if (gameMemory.timerInterval !== null) {
        clearInterval(gameMemory.timerInterval);
        gameMemory.timerInterval = null;
        console.log("🛑 Clock stopped successfully!");
    }
}