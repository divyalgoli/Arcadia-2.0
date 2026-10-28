/**
 * Fruit Slash - Particle & Feedback Visual Effects Manager
 */

export class ParticleManager {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.screenFlashTimer = 0;
        this.screenFlashColor = 'rgba(255, 0, 0, 0)';
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.screenFlashTimer = 0;
    }

    // Spawn juice splashes / sparks
    spawnJuice(x, y, color, count = 16, isSparkle = false) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 350 + 100;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: isSparkle ? Math.random() * 4 + 3 : Math.random() * 6 + 3,
                color,
                alpha: 1,
                life: Math.random() * 0.4 + 0.3,
                maxLife: 0.7,
                isSparkle
            });
        }
        // Safety cap against runaway growth/frame spikes
        if (this.particles.length > 220) {
            this.particles.splice(0, this.particles.length - 220);
        }
    }

    // Floating score / penalty / combo text
    spawnFloatingText(text, x, y, color = '#ffffff', fontSize = 28) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -120, // move upward
            color,
            fontSize,
            alpha: 1,
            life: 0.8
        });
    }

    // Flash screen red or dark impact
    triggerScreenFlash(color = 'rgba(255, 0, 0, 0.35)', duration = 0.3) {
        this.screenFlashColor = color;
        this.screenFlashTimer = duration;
    }

    update(dt) {
        // Update screen flash
        if (this.screenFlashTimer > 0) {
            this.screenFlashTimer -= dt;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 400 * dt; // slight gravity on splash
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            t.alpha = Math.max(0, t.life / 0.8);

            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw screen flash backdrop if active
        if (this.screenFlashTimer > 0) {
            ctx.save();
            ctx.fillStyle = this.screenFlashColor;
            ctx.globalAlpha = Math.min(1, this.screenFlashTimer / 0.3);
            ctx.fillRect(0, 0, 1280, 720);
            ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.save();
            ctx.fillStyle = p.color;

            if (p.isSparkle) {
                // Manual glow instead of native shadowBlur: a soft oversized
                // translucent circle behind a sharp core dot. Visually similar
                // halo effect, but far cheaper — shadowBlur compositing on
                // every one of dozens of simultaneous sparkles (combos, fast
                // swipes) was a major source of stutter.
                ctx.globalAlpha = p.alpha * 0.35;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw floating texts
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.font = `900 ${t.fontSize}px 'Fredoka', 'Poppins', sans-serif`;
            ctx.fillStyle = t.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.textAlign = 'center';
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    }
}
