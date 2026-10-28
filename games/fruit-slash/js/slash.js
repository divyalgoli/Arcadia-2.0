/**
 * Fruit Slash - Slash Trail & Tap Shockwave Effects Rendering
 */

import { CONFIG } from './config.js';

export class SlashManager {
    constructor() {
        this.trailPoints = [];
        this.tapBursts = [];
    }

    reset() {
        this.trailPoints = [];
        this.tapBursts = [];
    }

    addTrailPoint(x, y, vx, vy) {
        this.trailPoints.push({
            x,
            y,
            vx,
            vy,
            time: performance.now(),
            life: CONFIG.SLASH.TRAIL_LIFETIME
        });
        // Safety cap: prevents unbounded growth (e.g. a backlog of pointer
        // events flushing at once after the tab regains focus) from ever
        // causing a frame spike.
        if (this.trailPoints.length > 60) {
            this.trailPoints.splice(0, this.trailPoints.length - 60);
        }
    }

    addTapBurst(x, y) {
        this.tapBursts.push({
            x,
            y,
            radius: 10,
            maxRadius: CONFIG.SLASH.TAP_RADIUS,
            time: performance.now(),
            life: CONFIG.SLASH.TAP_LIFETIME,
            maxLife: CONFIG.SLASH.TAP_LIFETIME
        });
    }

    update(dt) {
        const now = performance.now();

        // Update trail points lifetime
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            const age = (now - this.trailPoints[i].time) / 1000;
            if (age >= CONFIG.SLASH.TRAIL_LIFETIME) {
                this.trailPoints.splice(i, 1);
            }
        }

        // Update tap bursts
        for (let i = this.tapBursts.length - 1; i >= 0; i--) {
            const b = this.tapBursts[i];
            b.life -= dt;
            b.radius = b.maxRadius * (1 - Math.max(0, b.life / b.maxLife));
            if (b.life <= 0) {
                this.tapBursts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw Tap Bursts (Radial Magical Shockwave)
        for (const b of this.tapBursts) {
            ctx.save();
            const alpha = Math.max(0, b.life / b.maxLife);
            ctx.globalAlpha = alpha;

            // Outer glowing ring
            ctx.strokeStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner magic star
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Draw Swipe Trail (Continuous Magical Sword Energy Line)
        if (this.trailPoints.length < 2) return;

        const now = performance.now();
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Single cheap glow pass for the WHOLE trail at once. Native shadowBlur
        // is expensive per stroke() call — applying it to every one of up to
        // ~60 individual segments (120 strokes/frame) during a fast swipe was
        // the single biggest cause of stutter during actual play. One glow
        // pass over the full path costs the same as one segment used to.
        ctx.beginPath();
        ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
        for (let i = 1; i < this.trailPoints.length; i++) {
            ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
        }
        const newest = this.trailPoints[this.trailPoints.length - 1];
        const newestAlpha = Math.max(0, 1 - ((now - newest.time) / 1000) / CONFIG.SLASH.TRAIL_LIFETIME);
        if (newestAlpha > 0) {
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = `rgba(0, 229, 255, ${newestAlpha * 0.7})`;
            ctx.lineWidth = 11;
            ctx.stroke();
        }
        ctx.shadowBlur = 0; // shadow off for the cheap tapered detail pass below

        for (let i = 1; i < this.trailPoints.length; i++) {
            const p1 = this.trailPoints[i - 1];
            const p2 = this.trailPoints[i];

            const age2 = (now - p2.time) / 1000;
            const alpha = Math.max(0, 1 - (age2 / CONFIG.SLASH.TRAIL_LIFETIME));
            const width = 14 * alpha;

            if (alpha <= 0) continue;

            // Outer cyan line (no shadow — the single glow pass above covers that)
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Inner white-hot energy core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.lineWidth = width * 0.4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    }
}
