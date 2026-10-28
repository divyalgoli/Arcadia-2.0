/**
 * Fruit Slash - Monster Entity & Behaviors
 */

import { CONFIG, MONSTER_TYPES } from './config.js';

export class Monster {
    constructor(mode = CONFIG.MODES.SURVIVAL, currentGravity = 550) {
        const typeIndex = Math.floor(Math.random() * MONSTER_TYPES.length);
        this.type = MONSTER_TYPES[typeIndex];
        this.radius = this.type.radius;
        this.gravity = currentGravity;

        this.animTime = Math.random() * 10;
        this.isHit = false;
        this.isDead = false;

        if (mode === CONFIG.MODES.TIME_ATTACK) {
            const spawnSide = Math.random();
            if (spawnSide < 0.4) {
                this.initBottomSpawn();
            } else if (spawnSide < 0.7) {
                this.x = Math.random() * (CONFIG.CANVAS.DESIGN_WIDTH - 200) + 100;
                this.y = -this.radius;
                this.vx = (Math.random() - 0.5) * 150;
                this.vy = Math.random() * 120 + 120; // gentler drop speed
            } else {
                const isLeft = Math.random() < 0.5;
                this.x = isLeft ? -this.radius : CONFIG.CANVAS.DESIGN_WIDTH + this.radius;
                this.y = Math.random() * (CONFIG.CANVAS.DESIGN_HEIGHT * 0.6) + 100;
                this.vx = isLeft ? Math.random() * 200 + 150 : -(Math.random() * 200 + 150);
                this.vy = (Math.random() - 0.5) * 100;
            }
        } else {
            this.initBottomSpawn();
        }
    }

    initBottomSpawn() {
        this.x = Math.random() * (CONFIG.CANVAS.DESIGN_WIDTH - 300) + 150;
        this.y = CONFIG.CANVAS.DESIGN_HEIGHT + this.radius;

        const targetX = CONFIG.CANVAS.DESIGN_WIDTH / 2 + (Math.random() * 400 - 200);
        const apexY = Math.random() * 200 + 240;

        const dy = apexY - this.y;
        this.vy = -Math.sqrt(2 * this.gravity * Math.abs(dy));
        const tUp = Math.abs(this.vy) / this.gravity;
        this.vx = (targetX - this.x) / tUp;
    }

    update(dt) {
        if (this.isHit) return;

        this.animTime += dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * 0.7 * dt;

        if (
            this.y > CONFIG.CANVAS.DESIGN_HEIGHT + 120 ||
            this.x < -150 ||
            this.x > CONFIG.CANVAS.DESIGN_WIDTH + 150
        ) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        if (this.isHit) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        this.type.draw(ctx, this.radius, this.animTime);
        ctx.restore();
    }

    hit() {
        this.isHit = true;
        this.isDead = true;
    }
}
