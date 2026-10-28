/**
 * Fruit Slash - Core Game Engine & State Machine
 */

import { CONFIG, FRUIT_TYPES } from './config.js';
import { Fruit } from './fruit.js';
import { Monster } from './monster.js';
import { AUDIO } from './audio.js';
import { STORAGE } from './storage.js';

export const GAME_STATE = {
    MENU: 'MENU',
    MODE_SELECT: 'MODE_SELECT',
    COUNTDOWN: 'COUNTDOWN',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

export class GameEngine {
    constructor(canvasManager, particleManager, slashManager, uiController) {
        this.canvasMgr = canvasManager;
        this.particleMgr = particleManager;
        this.slashMgr = slashManager;
        this.ui = uiController;

        this.state = GAME_STATE.MENU;
        this.mode = CONFIG.MODES.SURVIVAL;

        this.playFruit = null;
        this.survivalFruit = null;
        this.timeAttackFruit = null;

        this.fruits = [];
        this.fruitHalves = [];
        this.monsters = [];

        this.score = 0;
        this.lives = CONFIG.SURVIVAL.INITIAL_LIVES;
        this.timeRemaining = CONFIG.TIME_ATTACK.INITIAL_TIME;
        this.gameTime = 0;

        this.spawnTimer = 0;
        this.currentSpawnInterval = CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL;
        this.currentGravity = CONFIG.CANVAS.GRAVITY_START;

        this.countdownValue = 3;
        this.countdownTimer = 0;

        this.currentAttackSliceCount = 0;
        this.currentAttackHitMonster = false;
        this.attackComboTimer = 0;

        this.initMenuState();
    }

    // Initialize Main Menu with Play Fruit EXACTLY IN THE MIDDLE (640, 360)
    initMenuState() {
        this.state = GAME_STATE.MENU;
        this.fruits = [];
        this.fruitHalves = [];
        this.monsters = [];
        this.particleMgr.reset();
        this.slashMgr.reset();

        const watermelonType = FRUIT_TYPES.find(f => f.id === 'watermelon');
        // Positioned dead center at (640, 360)
        this.playFruit = new Fruit(watermelonType, 640, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);

        if (this.ui) {
            this.ui.showMenuUI();
        }
    }

    // Transition to Mode Select with mode fruits centered
    transitionToModeSelect() {
        this.state = GAME_STATE.MODE_SELECT;

        const appleType = FRUIT_TYPES.find(f => f.id === 'apple');
        const pineappleType = FRUIT_TYPES.find(f => f.id === 'pineapple');

        this.survivalFruit = new Fruit(appleType, 420, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);
        this.timeAttackFruit = new Fruit(pineappleType, 860, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);

        if (this.ui) {
            this.ui.showModeSelectUI();
        }
    }

    startCountdown(mode) {
        this.mode = mode;
        this.state = GAME_STATE.COUNTDOWN;
        this.countdownValue = 3;
        this.countdownTimer = 0;

        if (this.ui) {
            this.ui.showCountdownUI(this.countdownValue);
        }
        AUDIO.playCountdownBeep(false);
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.score = 0;
        this.lives = CONFIG.SURVIVAL.INITIAL_LIVES;
        this.timeRemaining = CONFIG.TIME_ATTACK.INITIAL_TIME;
        this.gameTime = 0;

        this.fruits = [];
        this.fruitHalves = [];
        this.monsters = [];
        this.spawnTimer = 0;
        this.currentSpawnInterval = CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL;
        this.currentGravity = CONFIG.CANVAS.GRAVITY_START;

        if (this.ui) {
            this.ui.showGameplayUI(this.mode, this.score, this.lives, this.timeRemaining);
        }

        AUDIO.startBGM();
    }

    togglePause() {
        if (this.mode === CONFIG.MODES.TIME_ATTACK) return;

        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            if (this.ui) this.ui.showPauseUI();
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            if (this.ui) this.ui.hidePauseUI();
        }
    }

    triggerGameOver() {
        this.state = GAME_STATE.GAME_OVER;
        AUDIO.stopBGM();
        AUDIO.playGameOver();

        const isNewHS = STORAGE.saveHighScore(this.mode, this.score);
        const highScore = STORAGE.getHighScore(this.mode);

        if (this.ui) {
            this.ui.showGameOverUI(this.score, highScore, isNewHS, this.mode);
        }
    }

    handleSlashInput(x, y, vx, vy, isTap) {
        if (this.state === GAME_STATE.MENU) {
            if (this.playFruit && !this.playFruit.isSliced) {
                if (this.checkPointCircleCollision(x, y, isTap ? CONFIG.SLASH.TAP_RADIUS : 25, this.playFruit.x, this.playFruit.y, this.playFruit.radius + 20)) {
                    const halves = this.playFruit.slice(vx, vy);
                    this.fruitHalves.push(...halves);
                    this.particleMgr.spawnJuice(this.playFruit.x, this.playFruit.y, '#e53935');
                    AUDIO.playSlice(false);
                    setTimeout(() => this.transitionToModeSelect(), 400);
                }
            }
            return;
        }

        if (this.state === GAME_STATE.MODE_SELECT) {
            if (this.survivalFruit && !this.survivalFruit.isSliced) {
                if (this.checkPointCircleCollision(x, y, isTap ? CONFIG.SLASH.TAP_RADIUS : 25, this.survivalFruit.x, this.survivalFruit.y, this.survivalFruit.radius + 20)) {
                    const halves = this.survivalFruit.slice(vx, vy);
                    this.fruitHalves.push(...halves);
                    this.particleMgr.spawnJuice(this.survivalFruit.x, this.survivalFruit.y, '#d32f2f');
                    AUDIO.playSlice(false);
                    setTimeout(() => this.startCountdown(CONFIG.MODES.SURVIVAL), 400);
                    return;
                }
            }
            if (this.timeAttackFruit && !this.timeAttackFruit.isSliced) {
                if (this.checkPointCircleCollision(x, y, isTap ? CONFIG.SLASH.TAP_RADIUS : 25, this.timeAttackFruit.x, this.timeAttackFruit.y, this.timeAttackFruit.radius + 20)) {
                    const halves = this.timeAttackFruit.slice(vx, vy);
                    this.fruitHalves.push(...halves);
                    this.particleMgr.spawnJuice(this.timeAttackFruit.x, this.timeAttackFruit.y, '#f57f17');
                    AUDIO.playSlice(false);
                    setTimeout(() => this.startCountdown(CONFIG.MODES.TIME_ATTACK), 400);
                    return;
                }
            }
            return;
        }

        if (this.state !== GAME_STATE.PLAYING) return;

        if (this.attackComboTimer <= 0) {
            this.currentAttackSliceCount = 0;
            this.currentAttackHitMonster = false;
        }
        this.attackComboTimer = 0.25;

        for (const fruit of this.fruits) {
            if (fruit.isSliced) continue;

            const hit = isTap ?
                this.checkPointCircleCollision(x, y, CONFIG.SLASH.TAP_RADIUS, fruit.x, fruit.y, fruit.radius) :
                this.checkPointCircleCollision(x, y, 25, fruit.x, fruit.y, fruit.radius);

            if (hit) {
                const halves = fruit.slice(vx, vy);
                this.fruitHalves.push(...halves);

                const points = fruit.type.isRare ? CONFIG.SCORING.RARE_FRUIT : CONFIG.SCORING.NORMAL_FRUIT;
                this.score += points;
                this.currentAttackSliceCount++;

                AUDIO.playSlice(fruit.type.isRare);
                this.particleMgr.spawnJuice(
                    fruit.x, fruit.y,
                    fruit.type.innerColor,
                    fruit.type.isRare ? 24 : 14,
                    fruit.type.isRare
                );

                const scoreText = `+${points}`;
                const scoreColor = fruit.type.isRare ? '#ffd700' : '#ffffff';
                this.particleMgr.spawnFloatingText(scoreText, fruit.x, fruit.y - 20, scoreColor, fruit.type.isRare ? 34 : 28);

                if (this.currentAttackSliceCount >= CONFIG.SCORING.COMBO_MIN && !this.currentAttackHitMonster) {
                    this.score += CONFIG.SCORING.COMBO_BONUS;
                    this.particleMgr.spawnFloatingText(`COMBO! +${CONFIG.SCORING.COMBO_BONUS}`, fruit.x, fruit.y - 60, '#ff4081', 36);
                }

                if (this.ui) this.ui.updateScore(this.score);
            }
        }

        for (const monster of this.monsters) {
            if (monster.isHit) continue;

            const hit = isTap ?
                this.checkPointCircleCollision(x, y, CONFIG.SLASH.TAP_RADIUS, monster.x, monster.y, monster.radius) :
                this.checkPointCircleCollision(x, y, 25, monster.x, monster.y, monster.radius);

            if (hit) {
                monster.hit();
                this.currentAttackHitMonster = true;

                AUDIO.playMonsterHit();
                this.particleMgr.triggerScreenFlash('rgba(255, 0, 0, 0.45)', 0.35);
                this.particleMgr.spawnJuice(monster.x, monster.y, '#212121', 20, false);

                if (this.mode === CONFIG.MODES.SURVIVAL) {
                    this.lives--;
                    this.particleMgr.spawnFloatingText('-1 LIFE', monster.x, monster.y - 30, '#ff1744', 32);
                    if (this.ui) this.ui.updateLives(this.lives);

                    if (this.lives <= 0) {
                        this.triggerGameOver();
                    }
                } else if (this.mode === CONFIG.MODES.TIME_ATTACK) {
                    this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.TIME_ATTACK.MONSTER_PENALTY);
                    this.particleMgr.spawnFloatingText(`-${CONFIG.TIME_ATTACK.MONSTER_PENALTY} SEC`, monster.x, monster.y - 30, '#ff1744', 32);
                    if (this.ui) this.ui.updateTimer(this.timeRemaining);

                    if (this.timeRemaining <= 0) {
                        this.triggerGameOver();
                    }
                }
            }
        }
    }

    checkPointCircleCollision(px, py, pr, cx, cy, cr) {
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) <= (pr + cr) * (pr + cr);
    }

    update(dt) {
        this.particleMgr.update(dt);
        this.slashMgr.update(dt);

        for (let i = this.fruitHalves.length - 1; i >= 0; i--) {
            this.fruitHalves[i].update(dt);
            if (this.fruitHalves[i].isDead) {
                this.fruitHalves.splice(i, 1);
            }
        }

        if (this.state === GAME_STATE.COUNTDOWN) {
            this.countdownTimer += dt;
            if (this.countdownTimer >= 0.85) {
                this.countdownTimer = 0;
                this.countdownValue--;
                if (this.countdownValue > 0) {
                    AUDIO.playCountdownBeep(false);
                    if (this.ui) this.ui.updateCountdown(this.countdownValue);
                } else if (this.countdownValue === 0) {
                    AUDIO.playCountdownBeep(true);
                    if (this.ui) this.ui.updateCountdown('GO!');
                } else {
                    this.startGame();
                }
            }
            return;
        }

        if (this.state !== GAME_STATE.PLAYING) {
            if (this.state === GAME_STATE.MENU && this.playFruit) {
                this.playFruit.rot += 0.5 * dt;
            }
            return;
        }

        this.gameTime += dt;
        if (this.attackComboTimer > 0) {
            this.attackComboTimer -= dt;
        }

        if (this.mode === CONFIG.MODES.TIME_ATTACK) {
            this.timeRemaining -= dt;
            if (this.ui) this.ui.updateTimer(Math.ceil(this.timeRemaining));
            if (this.timeRemaining <= 0) {
                this.triggerGameOver();
                return;
            }
        }

        const difficultyProgress = Math.min(1, this.gameTime / 120);

        this.currentGravity = CONFIG.CANVAS.GRAVITY_START + difficultyProgress * (CONFIG.CANVAS.GRAVITY_MAX - CONFIG.CANVAS.GRAVITY_START);
        this.currentSpawnInterval = Math.max(
            CONFIG.DIFFICULTY.MIN_SPAWN_INTERVAL,
            CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL - (this.gameTime * CONFIG.DIFFICULTY.INTERVAL_DECAY)
        );

        this.spawnTimer += dt;
        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.spawnTimer = 0;
            this.spawnWave(difficultyProgress);
        }

        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.update(dt);

            if (fruit.isMissed) {
                AUDIO.playMiss();
                this.particleMgr.spawnFloatingText('MISS!', fruit.x, 680, '#ff3d00', 30);

                if (this.mode === CONFIG.MODES.SURVIVAL) {
                    this.lives--;
                    this.particleMgr.spawnFloatingText('-1 LIFE', fruit.x, 640, '#ff1744', 32);
                    this.particleMgr.triggerScreenFlash('rgba(255, 0, 0, 0.3)', 0.25);
                    if (this.ui) this.ui.updateLives(this.lives);

                    if (this.lives <= 0) {
                        this.triggerGameOver();
                    }
                } else if (this.mode === CONFIG.MODES.TIME_ATTACK) {
                    this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.TIME_ATTACK.MISS_PENALTY);
                    this.particleMgr.spawnFloatingText(`-${CONFIG.TIME_ATTACK.MISS_PENALTY} SEC`, fruit.x, 640, '#ff9100', 30);
                    this.particleMgr.triggerScreenFlash('rgba(255, 100, 0, 0.25)', 0.2);
                    if (this.ui) this.ui.updateTimer(this.timeRemaining);

                    if (this.timeRemaining <= 0) {
                        this.triggerGameOver();
                    }
                }
            }

            if (fruit.isDead) {
                this.fruits.splice(i, 1);
            }
        }

        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            monster.update(dt);

            if (monster.isDead) {
                this.monsters.splice(i, 1);
            }
        }
    }

    spawnWave(progress = 0) {
        const count = Math.floor(
            CONFIG.DIFFICULTY.MAX_OBJECTS_START +
            progress * (CONFIG.DIFFICULTY.MAX_OBJECTS_END - CONFIG.DIFFICULTY.MAX_OBJECTS_START)
        );

        for (let i = 0; i < count; i++) {
            const monsterChance = CONFIG.DIFFICULTY.MONSTER_CHANCE_START + progress * (CONFIG.DIFFICULTY.MONSTER_CHANCE_END - CONFIG.DIFFICULTY.MONSTER_CHANCE_START);

            if (Math.random() < monsterChance) {
                this.monsters.push(new Monster(this.mode, this.currentGravity));
            } else {
                this.fruits.push(new Fruit(null, null, null, null, null, this.currentGravity));
            }
        }
    }

    // Helper: Draw Fruit Ninja Style Glowing Border Ring with "PLAY" text banner
    drawFruitNinjaBorder(ctx, x, y, radius, badgeText) {
        ctx.save();
        ctx.translate(x, y);

        // 1. Glowing outer energy ring
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Inner golden dotted ring
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // 3. Wooden / Golden Ribbon Banner Plate with "PLAY" text
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;

        const bannerW = 140;
        const bannerH = 40;
        const bannerY = radius + 22;

        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.roundRect(-bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 20);
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Banner Text ("PLAY" / "SURVIVAL" / "TIME ATTACK")
        ctx.shadowBlur = 0;
        ctx.font = "900 22px 'Fredoka', 'Poppins', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 0, bannerY);

        ctx.restore();
    }

    render() {
        const ctx = this.canvasMgr.ctx;
        this.canvasMgr.clear();

        this.canvasMgr.drawBackground(this.state === GAME_STATE.PLAYING ? this.mode : null);

        // Draw Menu Fruits with Fruit Ninja Style "PLAY" Border Plate
        if (this.state === GAME_STATE.MENU && this.playFruit) {
            this.playFruit.draw(ctx);
            if (!this.playFruit.isSliced) {
                this.drawFruitNinjaBorder(ctx, this.playFruit.x, this.playFruit.y, this.playFruit.radius, 'PLAY');
            }
        } else if (this.state === GAME_STATE.MODE_SELECT) {
            if (this.survivalFruit) {
                this.survivalFruit.draw(ctx);
                if (!this.survivalFruit.isSliced) {
                    this.drawFruitNinjaBorder(ctx, this.survivalFruit.x, this.survivalFruit.y, this.survivalFruit.radius, 'SURVIVAL');
                }
            }
            if (this.timeAttackFruit) {
                this.timeAttackFruit.draw(ctx);
                if (!this.timeAttackFruit.isSliced) {
                    this.drawFruitNinjaBorder(ctx, this.timeAttackFruit.x, this.timeAttackFruit.y, this.timeAttackFruit.radius, 'TIME ATTACK');
                }
            }
        }

        for (const half of this.fruitHalves) {
            half.draw(ctx);
        }

        for (const fruit of this.fruits) {
            fruit.draw(ctx);
        }

        for (const monster of this.monsters) {
            monster.draw(ctx);
        }

        this.slashMgr.draw(ctx);
        this.particleMgr.draw(ctx);
    }
}
