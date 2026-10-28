/**
 * Fruit Slash - Main Entry Point & Loop Orchestrator
 */

import { CanvasManager } from './canvas.js';
import { ParticleManager } from './particle.js';
import { SlashManager } from './slash.js';
import { GameEngine } from './game.js';
import { UIController } from './ui.js';
import { InputHandler } from './input.js';
import { AUDIO } from './audio.js';
import { STORAGE } from './storage.js';

window.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');

    // Initialize Canvas Manager
    const canvasManager = new CanvasManager(gameContainer);

    // Initialize Particle & Slash Effects Managers
    const particleManager = new ParticleManager();
    const slashManager = new SlashManager();

    // Initialize Game Engine (without UI controller first)
    const gameEngine = new GameEngine(canvasManager, particleManager, slashManager, null);

    // Initialize UI Controller
    const uiController = new UIController(gameEngine);
    gameEngine.ui = uiController;

    // Load saved sound mute setting
    const isMuted = STORAGE.isSoundMuted();
    AUDIO.setMuted(isMuted);

    // Initialize Input Handler
    let lastSlashFxTime = 0;
    const SLASH_FX_MIN_INTERVAL_MS = 45; // caps particle+audio spawn rate during fast swipes

    const inputHandler = new InputHandler(
        canvasManager.canvas,
        // Continuous Swipe point callback
        (x, y, vx, vy, isTap) => {
            // Trail point + hit-testing stay on every event for a fully responsive feel.
            slashManager.addTrailPoint(x, y, vx, vy);
            gameEngine.handleSlashInput(x, y, vx, vy, false);

            // Visual/audio juice is throttled — spawning a particle+sound on
            // every single pointermove (which can fire 60-120+ times/sec) is
            // what caused the stutter; this cap keeps it feeling continuous
            // without flooding the frame.
            const now = performance.now();
            if (now - lastSlashFxTime >= SLASH_FX_MIN_INTERVAL_MS) {
                lastSlashFxTime = now;
                particleManager.spawnJuice(x, y, 'rgba(0, 229, 255, 0.6)', 1, true);
                AUDIO.playSlash();
            }
        },
        // Tap Burst callback
        (x, y) => {
            slashManager.addTapBurst(x, y);
            particleManager.spawnJuice(x, y, '#ffffff', 8, true);
            AUDIO.playSlash();
            gameEngine.handleSlashInput(x, y, 0, 0, true);
        }
    );

    // Initialize main menu
    gameEngine.initMenuState();

    // Main Game Loop via requestAnimationFrame
    let lastTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.1, (now - lastTime) / 1000); // cap max dt to 100ms
        lastTime = now;

        gameEngine.update(dt);
        gameEngine.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
