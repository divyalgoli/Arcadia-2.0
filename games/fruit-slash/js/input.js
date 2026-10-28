/**
 * Fruit Slash - Unified Input Handler (Touch & Mouse)
 * Handles tap detection, continuous swipe trails, and velocity checks for finger hold prevention.
 */

import { CONFIG } from './config.js';

export class InputHandler {
    constructor(canvas, onSlashPoint, onTapBurst) {
        this.canvas = canvas;
        this.onSlashPoint = onSlashPoint; // Callback (x, y, vx, vy, isTap)
        this.onTapBurst = onTapBurst;     // Callback (x, y)

        this.isPointerDown = false;
        this.lastPos = null;
        this.lastTime = 0;
        this.touchStartPos = null;
        this.touchStartTime = 0;
        this.hasMovedSignificantly = false;

        this.initListeners();
    }

    getCanvasCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CONFIG.CANVAS.DESIGN_WIDTH / rect.width;
        const scaleY = CONFIG.CANVAS.DESIGN_HEIGHT / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    initListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.handleStart(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.handleMove(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        }, { passive: false });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleStart(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPointerDown) {
                this.handleMove(e.clientX, e.clientY);
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isPointerDown) {
                this.handleEnd();
            }
        });
    }

    handleStart(clientX, clientY) {
        this.isPointerDown = true;
        const pos = this.getCanvasCoords(clientX, clientY);
        const now = performance.now();

        this.lastPos = pos;
        this.lastTime = now;
        this.touchStartPos = pos;
        this.touchStartTime = now;
        this.hasMovedSignificantly = false;
    }

    handleMove(clientX, clientY) {
        if (!this.isPointerDown || !this.lastPos) return;

        const pos = this.getCanvasCoords(clientX, clientY);
        const now = performance.now();
        const dt = Math.max(0.001, (now - this.lastTime) / 1000);

        const dx = pos.x - this.lastPos.x;
        const dy = pos.y - this.lastPos.y;
        const dist = Math.hypot(dx, dy);
        const speed = dist / dt;

        // Check if movement is significant
        if (dist > 8) {
            this.hasMovedSignificantly = true;
        }

        // FINGER HOLD RULE: Slicing only triggers if movement speed > MIN_SWIPE_SPEED
        if (speed >= CONFIG.SLASH.MIN_SWIPE_SPEED) {
            const vx = dx / dt;
            const vy = dy / dt;
            if (this.onSlashPoint) {
                this.onSlashPoint(pos.x, pos.y, vx, vy, false);
            }
        }

        this.lastPos = pos;
        this.lastTime = now;
    }

    handleEnd() {
        const now = performance.now();
        const duration = (now - this.touchStartTime) / 1000;

        // TAP RULE: If touch/click duration is short (< 0.25s) and movement was small (< 15px)
        if (!this.hasMovedSignificantly && duration < 0.25 && this.touchStartPos) {
            if (this.onTapBurst) {
                this.onTapBurst(this.touchStartPos.x, this.touchStartPos.y);
            }
        }

        this.isPointerDown = false;
        this.lastPos = null;
        this.touchStartPos = null;
    }
}
