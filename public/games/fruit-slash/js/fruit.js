/**
 * Fruit Slash - Fruit Entity & Sliced Halves Physics
 */

import { CONFIG, FRUIT_TYPES } from './config.js';

export class FruitHalf {
    constructor(fruitType, x, y, vx, vy, rot, vRot, isLeft, gravity = 600) {
        this.type = fruitType;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.rot = rot;
        this.vRot = vRot;
        this.isLeft = isLeft;
        this.radius = fruitType.radius;
        this.gravity = gravity;
        this.isDead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.rot += this.vRot * dt;

        if (this.y > CONFIG.CANVAS.DESIGN_HEIGHT + 100) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        this.type.drawHalf(ctx, this.radius, this.isLeft);
        ctx.restore();
    }
}

export class Fruit {
    constructor(type = null, customX = null, customY = null, customVx = null, customVy = null, currentGravity = 550) {
        if (!type) {
            const isRare = Math.random() < CONFIG.DIFFICULTY.RARE_FRUIT_CHANCE;
            const candidates = FRUIT_TYPES.filter(f => f.isRare === isRare);
            this.type = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            this.type = type;
        }

        this.radius = this.type.radius;
        this.gravity = currentGravity;

        if (customX !== null) {
            this.x = customX;
            this.y = customY;
            this.vx = customVx || 0;
            this.vy = customVy || 0;
        } else {
            this.x = Math.random() * (CONFIG.CANVAS.DESIGN_WIDTH - 300) + 150;
            this.y = CONFIG.CANVAS.DESIGN_HEIGHT + this.radius;

            const targetX = CONFIG.CANVAS.DESIGN_WIDTH / 2 + (Math.random() * 400 - 200);
            // Apex height: 220px to 420px from top (floating arc)
            const apexY = Math.random() * 200 + 220;

            const dy = apexY - this.y;
            this.vy = -Math.sqrt(2 * this.gravity * Math.abs(dy));
            const tUp = Math.abs(this.vy) / this.gravity;
            this.vx = (targetX - this.x) / tUp;
        }

        this.rot = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 3; // gentler rotation

        this.isSliced = false;
        this.isMissed = false;
        this.isDead = false;
        this.hasBeenOnScreen = false;
    }

    update(dt) {
        if (this.isSliced) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.rot += this.vRot * dt;

        if (this.y < CONFIG.CANVAS.DESIGN_HEIGHT) {
            this.hasBeenOnScreen = true;
        }

        if (this.hasBeenOnScreen && this.y > CONFIG.CANVAS.DESIGN_HEIGHT + this.radius) {
            this.isMissed = true;
            this.isDead = true;
        }
    }

    draw(ctx) {
        if (this.isSliced) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        this.type.draw(ctx, this.radius);
        ctx.restore();
    }

    slice(slashVx = 0, slashVy = 0) {
        this.isSliced = true;
        this.isDead = true;

        const pAngle = Math.atan2(slashVy, slashVx) + Math.PI / 2;
        const speed = 160;

        const half1 = new FruitHalf(
            this.type,
            this.x, this.y,
            this.vx + Math.cos(pAngle) * speed - 50,
            this.vy + Math.sin(pAngle) * speed - 30,
            this.rot, -3, true, this.gravity
        );

        const half2 = new FruitHalf(
            this.type,
            this.x, this.y,
            this.vx - Math.cos(pAngle) * speed + 50,
            this.vy - Math.sin(pAngle) * speed - 30,
            this.rot, 3, false, this.gravity
        );

        return [half1, half2];
    }
}
