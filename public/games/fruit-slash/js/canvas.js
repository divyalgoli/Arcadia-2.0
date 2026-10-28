/**
 * Fruit Slash - Responsive Canvas Manager with Bright Background Themes
 */

import { CONFIG } from './config.js';

export class CanvasManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.scale = 1;
        this.dpr = window.devicePixelRatio || 1;

        // Offscreen background cache, keyed by mode. Backgrounds are expensive
        // to draw (gradients, wood grain, sunburst) but never change while a
        // mode is active, so we render each one once and blit it every frame.
        this.bgCache = new Map();

        let resizeRAF = null;
        this.resize();
        window.addEventListener('resize', () => {
            // Debounce resize so a drag-resize doesn't trigger a resize+cache
            // rebuild on every intermediate pixel.
            if (resizeRAF) cancelAnimationFrame(resizeRAF);
            resizeRAF = requestAnimationFrame(() => this.resize());
        });
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    }

    resize() {
        const containerWidth = this.container.clientWidth || window.innerWidth;
        const containerHeight = this.container.clientHeight || window.innerHeight;

        const targetAspect = CONFIG.CANVAS.DESIGN_WIDTH / CONFIG.CANVAS.DESIGN_HEIGHT;
        const containerAspect = containerWidth / containerHeight;

        let renderWidth, renderHeight;
        if (containerAspect > targetAspect) {
            renderHeight = containerHeight;
            renderWidth = containerHeight * targetAspect;
        } else {
            renderWidth = containerWidth;
            renderHeight = containerWidth / targetAspect;
        }

        this.dpr = window.devicePixelRatio || 1;

        this.canvas.width = CONFIG.CANVAS.DESIGN_WIDTH * this.dpr;
        this.canvas.height = CONFIG.CANVAS.DESIGN_HEIGHT * this.dpr;

        this.canvas.style.width = `${renderWidth}px`;
        this.canvas.style.height = `${renderHeight}px`;

        this.scale = renderWidth / CONFIG.CANVAS.DESIGN_WIDTH;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    clear() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS.DESIGN_WIDTH, CONFIG.CANVAS.DESIGN_HEIGHT);
    }

    // Draw Bright Cheerful Backgrounds (cached offscreen per mode for smooth 60fps)
    drawBackground(mode) {
        const key = mode || 'MENU';
        let cached = this.bgCache.get(key);

        if (!cached) {
            const w = CONFIG.CANVAS.DESIGN_WIDTH;
            const h = CONFIG.CANVAS.DESIGN_HEIGHT;
            cached = document.createElement('canvas');
            cached.width = w;
            cached.height = h;
            this.renderBackground(cached.getContext('2d'), mode, w, h);
            this.bgCache.set(key, cached);
        }

        // Cheap every-frame operation: just blit the pre-rendered background.
        this.ctx.drawImage(cached, 0, 0);
    }

    // Actual (expensive) background drawing — only ever runs once per mode,
    // the first time that mode is needed, or after a resize invalidates the cache.
    renderBackground(ctx, mode, w, h) {
        if (mode === CONFIG.MODES.SURVIVAL) {
            // Bright Survival Theme: Vibrant Tropical Emerald Jungle Sky
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#00c853');
            grad.addColorStop(0.5, '#64dd17');
            grad.addColorStop(1, '#a7ffeb');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Bright translucent bamboo stalks
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            for (let i = 40; i < w; i += 110) {
                ctx.fillRect(i, 0, 32, h);
            }
        } else if (mode === CONFIG.MODES.TIME_ATTACK) {
            // Time Attack Theme: Warm Wood Cutting Board Texture
            this.drawWoodTexture(ctx, w, h);
        } else {
            // Bright Main Menu Theme: Vibrant Azure Sky with Sunburst
            const grad = ctx.createRadialGradient(w / 2, h / 2 - 50, 40, w / 2, h / 2, w * 0.75);
            grad.addColorStop(0, '#e0f7fa');
            grad.addColorStop(0.4, '#00e5ff');
            grad.addColorStop(1, '#0091ea');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Bright Sunburst rays
            ctx.save();
            ctx.translate(w / 2, h / 2 - 50);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            const numRays = 12;
            for (let i = 0; i < numRays; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const a1 = (i / numRays) * Math.PI * 2;
                const a2 = ((i + 0.5) / numRays) * Math.PI * 2;
                ctx.arc(0, 0, w, a1, a2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // Deterministic (non-flickering) wood plank texture used for Time Attack mode
    drawWoodTexture(ctx, w, h) {
        // Base warm wood gradient
        const base = ctx.createLinearGradient(0, 0, 0, h);
        base.addColorStop(0, '#c47a3d');
        base.addColorStop(0.5, '#a8632e');
        base.addColorStop(1, '#8a4f24');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);

        const plankWidth = 170;
        const plankCount = Math.ceil(w / plankWidth) + 1;

        for (let p = 0; p < plankCount; p++) {
            const px = p * plankWidth;
            // Deterministic pseudo-random shade per plank (no Math.random -> no flicker)
            const shadeSeed = Math.sin(p * 12.9898) * 43758.5453;
            const shade = shadeSeed - Math.floor(shadeSeed); // 0..1

            ctx.save();
            ctx.beginPath();
            ctx.rect(px, 0, plankWidth, h);
            ctx.clip();

            // Plank body tint (slightly different tone per plank for a real-board look)
            const tone = 0.85 + shade * 0.3;
            ctx.fillStyle = `rgba(120, 70, 30, ${0.12 + shade * 0.1})`;
            ctx.fillRect(px, 0, plankWidth, h);

            // Plank edge highlight (left) and shadow (right) for 3D board effect
            const edgeGrad = ctx.createLinearGradient(px, 0, px + plankWidth, 0);
            edgeGrad.addColorStop(0, 'rgba(255, 220, 170, 0.18)');
            edgeGrad.addColorStop(0.12, 'rgba(255, 220, 170, 0)');
            edgeGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0)');
            edgeGrad.addColorStop(1, 'rgba(60, 30, 10, 0.35)');
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(px, 0, plankWidth, h);
            void tone;

            // Wavy horizontal wood grain lines (deterministic sine waves)
            ctx.strokeStyle = 'rgba(70, 38, 15, 0.28)';
            ctx.lineWidth = 1.4;
            const grainLines = 7;
            for (let g = 0; g < grainLines; g++) {
                const baseY = (h / grainLines) * g + (shade * 30);
                const amp = 8 + (g % 3) * 4;
                const freq = 0.015 + (g % 4) * 0.004;
                ctx.beginPath();
                for (let x = 0; x <= plankWidth; x += 10) {
                    const y = baseY + Math.sin((x + p * 77) * freq + g) * amp;
                    if (x === 0) ctx.moveTo(px + x, y);
                    else ctx.lineTo(px + x, y);
                }
                ctx.stroke();
            }

            // Occasional wood knot
            if (shade > 0.55) {
                const knotX = px + plankWidth * 0.5;
                const knotY = h * (0.2 + (shade * 0.6));
                const knotR = 10 + shade * 8;
                const knotGrad = ctx.createRadialGradient(knotX, knotY, 1, knotX, knotY, knotR);
                knotGrad.addColorStop(0, 'rgba(50, 25, 10, 0.55)');
                knotGrad.addColorStop(0.6, 'rgba(70, 38, 15, 0.35)');
                knotGrad.addColorStop(1, 'rgba(70, 38, 15, 0)');
                ctx.fillStyle = knotGrad;
                ctx.beginPath();
                ctx.ellipse(knotX, knotY, knotR, knotR * 1.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(50, 25, 10, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(knotX, knotY, knotR * 0.55, knotR * 0.8, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();

            // Plank seam (groove) between boards
            ctx.strokeStyle = 'rgba(40, 20, 8, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, h);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 210, 160, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 1.5, 0);
            ctx.lineTo(px + 1.5, h);
            ctx.stroke();
        }

        // Subtle overall vignette to add depth
        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(30, 15, 5, 0.35)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
    }
}
