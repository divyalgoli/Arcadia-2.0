/**
 * Fruit Slash - Standalone Single-File Bundle with Bright Vibrant Graphics & Satisfying Sound
 */

(function() {
    'use strict';

    // ==========================================
    // 1. CONFIGURATION & BRIGHT ASSETS SPECS
    // ==========================================
    const CONFIG = {
        CANVAS: {
            DESIGN_WIDTH: 1280,
            DESIGN_HEIGHT: 720,
            GRAVITY_START: 550,
            GRAVITY_MAX: 1050,
        },
        MODES: {
            SURVIVAL: 'SURVIVAL',
            TIME_ATTACK: 'TIME_ATTACK'
        },
        SURVIVAL: {
            INITIAL_LIVES: 3,
        },
        TIME_ATTACK: {
            INITIAL_TIME: 60,
            MISS_PENALTY: 2,
            MONSTER_PENALTY: 10
        },
        SCORING: {
            NORMAL_FRUIT: 1,
            RARE_FRUIT: 10,
            // Combo multiplier tiers: once currentAttackSliceCount (within the
            // combo window) reaches `min`, all points score at `mult`x until
            // the combo resets. Checked in ascending order in getComboMultiplier().
            COMBO_TIERS: [
                { min: 3, mult: 1.5 },
                { min: 5, mult: 2 },
                { min: 8, mult: 3 }
            ]
        },
        SLASH: {
            TRAIL_LIFETIME: 0.35,
            TAP_RADIUS: 55,
            TAP_LIFETIME: 0.35,
            MIN_SWIPE_SPEED: 120
        },
        DIFFICULTY: {
            BASE_SPAWN_INTERVAL: 2.1,
            MIN_SPAWN_INTERVAL: 0.4,
            INTERVAL_DECAY: 0.024,
            MAX_OBJECTS_START: 2,
            MAX_OBJECTS_END: 8,
            RARE_FRUIT_CHANCE: 0.12,
            POWERUP_CHANCE: 0.05,
            MONSTER_CHANCE_START: 0.12,
            MONSTER_CHANCE_END: 0.5
        },
        POWERUPS: {
            FREEZE_DURATION: 4,
            FREEZE_SLOW_FACTOR: 0.35,
            DOUBLE_DURATION: 5,
            FRENZY_FRUIT_COUNT: 7
        }
    };

    const FRUIT_TYPES = [
        {
            id: 'watermelon',
            name: 'Watermelon',
            radius: 50,
            isRare: false,
            outerColor: '#00e676',
            innerColor: '#ff1744',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = '#00e676';
                ctx.fill();
                ctx.strokeStyle = '#1b5e20';
                ctx.lineWidth = r * 0.15;
                for (let i = -0.6; i <= 0.6; i += 0.4) {
                    ctx.beginPath();
                    ctx.arc(0, 0, r * 0.9, i * Math.PI, (i + 0.2) * Math.PI);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#00e676';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.85, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#b9f6ca';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.75, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff1744';
                ctx.fill();
                ctx.fillStyle = '#111111';
                const mult = isLeft ? -1 : 1;
                ctx.beginPath();
                ctx.arc(mult * r * 0.3, -r * 0.2, r * 0.08, 0, Math.PI * 2);
                ctx.arc(mult * r * 0.4, r * 0.2, r * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            id: 'orange',
            name: 'Orange',
            radius: 44,
            isRare: false,
            outerColor: '#ff9100',
            innerColor: '#ffab00',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = '#ff9100';
                ctx.fill();
                ctx.fillStyle = '#e65100';
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                    ctx.beginPath();
                    ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.ellipse(0, -r * 0.9, 9, 5, Math.PI * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = '#00e676';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.3, r * 0.22, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff9100';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffe082';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        },
        {
            id: 'apple',
            name: 'Apple',
            radius: 42,
            isRare: false,
            outerColor: '#ff1744',
            innerColor: '#fffde7',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.1, r * 0.75, 0, Math.PI * 2);
                ctx.arc(r * 0.3, -r * 0.1, r * 0.75, 0, Math.PI * 2);
                ctx.arc(0, r * 0.2, r * 0.75, 0, Math.PI * 2);
                ctx.fillStyle = '#ff1744';
                ctx.fill();
                ctx.beginPath();
                ctx.rect(-2.5, -r - 4, 5, 11);
                ctx.fillStyle = '#5d4037';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.3, r * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff1744';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#fffde7';
                ctx.fill();
                ctx.fillStyle = '#3e2723';
                const mult = isLeft ? -1 : 1;
                ctx.beginPath();
                ctx.ellipse(mult * r * 0.3, 0, 4, 7, mult * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            id: 'banana',
            name: 'Banana',
            radius: 46,
            isRare: false,
            outerColor: '#ffea00',
            innerColor: '#ffff8d',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, 0.2 * Math.PI, 1.1 * Math.PI);
                ctx.lineWidth = r * 0.6;
                ctx.strokeStyle = '#ffea00';
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.fillStyle = '#5d4037';
                ctx.beginPath();
                ctx.arc(-r * 0.7, -r * 0.5, 6, 0, Math.PI * 2);
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffea00';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.7, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffff8d';
                ctx.fill();
            }
        },
        {
            id: 'strawberry',
            name: 'Strawberry',
            radius: 40,
            isRare: false,
            outerColor: '#ff1744',
            innerColor: '#ff8a80',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.moveTo(0, r);
                ctx.bezierCurveTo(r * 1.2, 0, r, -r * 0.8, 0, -r);
                ctx.bezierCurveTo(-r, -r * 0.8, -r * 1.2, 0, 0, r);
                ctx.fillStyle = '#ff1744';
                ctx.fill();
                ctx.fillStyle = '#ffea00';
                for (let i = -0.5; i <= 0.5; i += 0.4) {
                    for (let j = -0.4; j <= 0.6; j += 0.4) {
                        ctx.beginPath();
                        ctx.arc(i * r * 0.8, j * r * 0.7, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.fillStyle = '#00e676';
                ctx.beginPath();
                ctx.arc(0, -r * 0.9, r * 0.4, 0, Math.PI * 2);
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff1744';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.75, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff8a80';
                ctx.fill();
            }
        },
        {
            id: 'pineapple',
            name: 'Pineapple',
            radius: 52,
            isRare: false,
            outerColor: '#ffab00',
            innerColor: '#ffff8d',
            draw: (ctx, r) => {
                ctx.beginPath();
                ctx.ellipse(0, r * 0.2, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#ffab00';
                ctx.fill();
                ctx.strokeStyle = '#e65100';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.fillStyle = '#00e676';
                ctx.beginPath();
                ctx.moveTo(-r * 0.4, -r * 0.5);
                ctx.lineTo(-r * 0.6, -r * 1.3);
                ctx.lineTo(0, -r * 0.7);
                ctx.lineTo(r * 0.6, -r * 1.3);
                ctx.lineTo(r * 0.4, -r * 0.5);
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffab00';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.8, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffff8d';
                ctx.fill();
            }
        },
        {
            id: 'rare_star',
            name: 'Golden Starfruit',
            radius: 48,
            isRare: true,
            outerColor: '#ffd700',
            innerColor: '#ffffff',
            draw: (ctx, r) => {
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
                    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.5), -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.5));
                }
                ctx.closePath();
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.7, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffff8d';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        },
        {
            id: 'power_freeze',
            name: 'Frost Berry',
            radius: 46,
            isRare: false,
            isPowerup: true,
            powerupId: 'freeze',
            outerColor: '#40c4ff',
            innerColor: '#e1f5fe',
            draw: (ctx, r) => {
                ctx.shadowColor = '#80d8ff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = '#40c4ff';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#e1f5fe';
                ctx.lineWidth = 3;
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#40c4ff';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.6, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#e1f5fe';
                ctx.fill();
            }
        },
        {
            id: 'power_double',
            name: 'Dragonfruit',
            radius: 48,
            isRare: false,
            isPowerup: true,
            powerupId: 'double',
            outerColor: '#ff4081',
            innerColor: '#ffffff',
            draw: (ctx, r) => {
                ctx.shadowColor = '#ff4081';
                ctx.shadowBlur = 22;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = '#ff4081';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffea00';
                for (let i = 0; i < 5; i++) {
                    const a = (18 + i * 72) * Math.PI / 180;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * r * 1.15, -Math.sin(a) * r * 1.15);
                    ctx.lineTo(Math.cos(a + 0.25) * r * 0.6, -Math.sin(a + 0.25) * r * 0.6);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.fillStyle = '#ff4081';
                ctx.font = `900 ${Math.floor(r * 0.7)}px 'Fredoka', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2X', 0, 2);
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff4081';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.6, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        },
        {
            id: 'power_frenzy',
            name: 'Rainbow Melon',
            radius: 50,
            isRare: false,
            isPowerup: true,
            powerupId: 'frenzy',
            outerColor: '#ffffff',
            innerColor: '#ffffff',
            draw: (ctx, r) => {
                const colors = ['#ff1744', '#ff9100', '#ffea00', '#00e676', '#40c4ff', '#d500f9'];
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 18;
                for (let i = 0; i < colors.length; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, r, (i / colors.length) * Math.PI * 2, ((i + 1) / colors.length) * Math.PI * 2);
                    ctx.closePath();
                    ctx.fillStyle = colors[i];
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ff4081';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.65, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#ffea00';
                ctx.fill();
            }
        },
        {
            id: 'power_shield',
            name: 'Crystal Shield',
            radius: 46,
            isRare: false,
            isPowerup: true,
            powerupId: 'shield',
            outerColor: '#18ffff',
            innerColor: '#e0ffff',
            draw: (ctx, r) => {
                ctx.shadowColor = '#18ffff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fillStyle = '#18ffff';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const px = Math.cos(a) * r * 0.55;
                    const py = Math.sin(a) * r * 0.55;
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fillStyle = '#e0ffff';
                ctx.fill();
            },
            drawHalf: (ctx, r, isLeft) => {
                ctx.beginPath();
                ctx.arc(0, 0, r, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#18ffff';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.6, isLeft ? Math.PI * 0.5 : -Math.PI * 0.5, isLeft ? Math.PI * 1.5 : Math.PI * 0.5);
                ctx.fillStyle = '#e0ffff';
                ctx.fill();
            }
        }
    ];

    const MONSTER_TYPES = [
        {
            id: 'dark_fiend',
            name: 'Shadow Fiend',
            radius: 46,
            draw: (ctx, r, animTime) => {
                ctx.shadowColor = '#ff1744';
                ctx.shadowBlur = 18 + Math.sin(animTime * 10) * 6;
                ctx.beginPath();
                const spikes = 10;
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = (i % 2 === 0) ? r : r * 0.7;
                    const angle = (i / (spikes * 2)) * Math.PI * 2 + animTime * 2;
                    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                ctx.closePath();
                ctx.fillStyle = '#111111';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.1, r * 0.2, 0, Math.PI * 2);
                ctx.arc(r * 0.3, -r * 0.1, r * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(-r * 0.3, -r * 0.1, r * 0.08, 0, Math.PI * 2);
                ctx.arc(r * 0.3, -r * 0.1, r * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        {
            id: 'spike_slime',
            name: 'Toxic Slime',
            radius: 44,
            draw: (ctx, r, animTime) => {
                ctx.shadowColor = '#00e676';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fillStyle = '#1b5e20';
                ctx.fill();
                ctx.fillStyle = '#76ff03';
                for (let i = 0; i < 4; i++) {
                    const angle = i * (Math.PI / 2) + animTime * 3;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d50000';
                ctx.beginPath();
                ctx.arc(Math.cos(animTime * 4) * 4, Math.sin(animTime * 4) * 4, r * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    ];

    // ==========================================
    // 2. AUDIO ENGINE (SATISFYING SWIPE & CUT)
    // ==========================================
    class AudioManager {
        constructor() {
            this.ctx = null;
            this.muted = false;
            this.bgmGain = null;
            this.bgmTimer = null;
            this.isBgmPlaying = false;
        }

        init() {
            if (this.ctx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.lastSlashSoundTime = 0;
                this.buildNoiseBuffer();
            }
        }

        buildNoiseBuffer() {
            const duration = 0.2;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }

        ensureContext() {
            if (!this.ctx) this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        setMuted(muted) {
            this.muted = muted;
            if (this.bgmGain) {
                this.bgmGain.gain.value = this.muted ? 0 : 0.10;
            }
        }

        toggleMute() {
            this.setMuted(!this.muted);
            return this.muted;
        }

        playSlash() {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx || !this.noiseBuffer) return;

            const now = this.ctx.currentTime;
            if (now - this.lastSlashSoundTime < 0.045) return;
            this.lastSlashSoundTime = now;

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 3.0;
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(180, now + 0.12);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now, 0, 0.12);
        }

        playSlice(isRare = false) {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isRare ? 320 : 180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.10);
            oscGain.gain.setValueAtTime(0.35, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.10);

            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(isRare ? 3500 : 2200, now);
                filter.frequency.linearRampToValueAtTime(400, now + 0.15);

                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.25, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(this.ctx.destination);
                noise.start(now, 0, 0.15);
            }

            if (isRare) {
                const chime = this.ctx.createOscillator();
                const chimeGain = this.ctx.createGain();
                chime.type = 'triangle';
                chime.frequency.setValueAtTime(987.77, now);
                chime.frequency.setValueAtTime(1318.51, now + 0.08);
                chimeGain.gain.setValueAtTime(0.25, now);
                chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                chime.connect(chimeGain);
                chimeGain.connect(this.ctx.destination);
                chime.start(now);
                chime.stop(now + 0.25);
            }
        }

        playMonsterHit() {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }

        playMiss() {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(90, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        playClick() {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        }

        playCountdownBeep(isGo = false) {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.35 : 0.15));
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + (isGo ? 0.35 : 0.15));
        }

        playGameOver() {
            if (this.muted) return;
            this.ensureContext();
            if (!this.ctx) return;
            const notes = [300, 260, 220, 150];
            notes.forEach((freq, i) => {
                const now = this.ctx.currentTime + i * 0.15;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            });
        }

        startBGM() {
            if (this.isBgmPlaying) return;
            this.ensureContext();
            if (!this.ctx) return;
            this.isBgmPlaying = true;
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = this.muted ? 0 : 0.10;
            this.bgmGain.connect(this.ctx.destination);
            const notes = [261.63, 329.63, 392.00, 523.25, 349.23, 440.00, 523.25, 698.46, 392.00, 493.88, 587.33, 783.99, 261.63, 329.63, 392.00, 523.25];
            let step = 0;
            const playStep = () => {
                if (!this.isBgmPlaying || !this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(notes[step % notes.length], now);
                noteGain.gain.setValueAtTime(0.06, now);
                noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(noteGain);
                noteGain.connect(this.bgmGain);
                osc.start(now);
                osc.stop(now + 0.18);
                step++;
            };
            this.bgmTimer = setInterval(playStep, 220);
        }

        stopBGM() {
            this.isBgmPlaying = false;
            if (this.bgmTimer) {
                clearInterval(this.bgmTimer);
                this.bgmTimer = null;
            }
        }
    }

    const AUDIO = new AudioManager();

    // ==========================================
    // 3. STORAGE & LEADERBOARD
    // ==========================================
    const STORAGE_KEYS = {
        PLAYER_NAME: 'fruit_slash_player_name_v2',
        NAME_CHANGE_COUNT: 'fruit_slash_name_change_count_v2',
        HIGH_SCORE_SURVIVAL: 'fruit_slash_hs_survival_v2',
        HIGH_SCORE_TIME_ATTACK: 'fruit_slash_hs_time_attack_v2',
        SOUND_MUTED: 'fruit_slash_sound_muted_v2',
        LEADERBOARD_SURVIVAL: 'fruit_slash_lb_survival_v2',
        LEADERBOARD_TIME_ATTACK: 'fruit_slash_lb_time_attack_v2'
    };

    class StorageManager {
        constructor() {
            this.init();
        }

        init() {
            if (!localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)) {
                // Auto-assigned on first visit — doesn't count against the
                // player's one allowed manual name change.
                localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, 'NinjaSlash' + Math.floor(Math.random() * 8999 + 1000));
            }
        }

        getPlayerName() {
            return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'NinjaSlash1001';
        }

        getNameChangeCount() {
            return parseInt(localStorage.getItem(STORAGE_KEYS.NAME_CHANGE_COUNT) || '0', 10);
        }

        canChangeName() {
            return this.getNameChangeCount() < 1;
        }

        setPlayerName(newName) {
            const cleanName = newName.trim().substring(0, 14) || 'NinjaSlash';
            const count = this.getNameChangeCount();
            if (count >= 1 && localStorage.getItem(STORAGE_KEYS.PLAYER_NAME)) {
                return { success: false, reason: 'Username can only be changed once!' };
            }
            localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, cleanName);
            localStorage.setItem(STORAGE_KEYS.NAME_CHANGE_COUNT, (count + 1).toString());
            return { success: true, name: cleanName };
        }

        getHighScore(mode) {
            const key = mode === 'SURVIVAL' ? STORAGE_KEYS.HIGH_SCORE_SURVIVAL : STORAGE_KEYS.HIGH_SCORE_TIME_ATTACK;
            return parseInt(localStorage.getItem(key) || '0', 10);
        }

        saveHighScore(mode, score) {
            const currentHS = this.getHighScore(mode);
            if (score > currentHS) {
                const key = mode === 'SURVIVAL' ? STORAGE_KEYS.HIGH_SCORE_SURVIVAL : STORAGE_KEYS.HIGH_SCORE_TIME_ATTACK;
                localStorage.setItem(key, score.toString());
                this.submitOnlineScore(mode, this.getPlayerName(), score);
                return true;
            }
            return false;
        }

        isSoundMuted() {
            return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true';
        }

        setSoundMuted(muted) {
            localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, muted ? 'true' : 'false');
        }

        // Local leaderboard — starts empty (no placeholder scores), only ever
        // contains scores actually earned on this device.
        async fetchLeaderboard(mode) {
            const key = mode === 'SURVIVAL' ? STORAGE_KEYS.LEADERBOARD_SURVIVAL : STORAGE_KEYS.LEADERBOARD_TIME_ATTACK;
            const raw = localStorage.getItem(key);
            let entries = [];
            try {
                entries = raw ? JSON.parse(raw) : [];
            } catch (e) {
                entries = [];
            }
            entries.sort((a, b) => b.score - a.score);
            return entries.slice(0, 10);
        }

        async submitOnlineScore(mode, username, score) {
            const key = mode === 'SURVIVAL' ? STORAGE_KEYS.LEADERBOARD_SURVIVAL : STORAGE_KEYS.LEADERBOARD_TIME_ATTACK;
            const raw = localStorage.getItem(key);
            let entries = [];
            try {
                entries = raw ? JSON.parse(raw) : [];
            } catch (e) {
                entries = [];
            }
            const existingIndex = entries.findIndex(e => e.name === username);
            if (existingIndex !== -1) {
                entries[existingIndex].score = Math.max(entries[existingIndex].score, score);
            } else {
                entries.push({ name: username, score });
            }
            entries.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(entries.slice(0, 10)));
        }
    }

    const STORAGE = new StorageManager();

    // ==========================================
    // 4. INPUT HANDLER
    // ==========================================
    class InputHandler {
        constructor(canvas, onSlashPoint, onTapBurst) {
            this.canvas = canvas;
            this.onSlashPoint = onSlashPoint;
            this.onTapBurst = onTapBurst;
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
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    this.handleStart(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: false });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: false });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleEnd();
            }, { passive: false });

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

            if (dist > 8) this.hasMovedSignificantly = true;

            if (speed >= CONFIG.SLASH.MIN_SWIPE_SPEED) {
                if (this.onSlashPoint) {
                    this.onSlashPoint(pos.x, pos.y, dx / dt, dy / dt, false);
                }
            }

            this.lastPos = pos;
            this.lastTime = now;
        }

        handleEnd() {
            const now = performance.now();
            const duration = (now - this.touchStartTime) / 1000;
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

    // ==========================================
    // 5. CANVAS MANAGER (BRIGHT THEMES)
    // ==========================================
    class CanvasManager {
        constructor(containerElement) {
            this.container = containerElement;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.container.appendChild(this.canvas);
            this.dpr = window.devicePixelRatio || 1;
            this.bgCache = new Map();
            let resizeRAF = null;
            this.resize();
            window.addEventListener('resize', () => {
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

            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        }

        clear() {
            this.ctx.clearRect(0, 0, CONFIG.CANVAS.DESIGN_WIDTH, CONFIG.CANVAS.DESIGN_HEIGHT);
        }

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
            this.ctx.drawImage(cached, 0, 0);
        }

        renderBackground(ctx, mode, w, h) {

            if (mode === CONFIG.MODES.SURVIVAL) {
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#00c853');
                grad.addColorStop(0.5, '#64dd17');
                grad.addColorStop(1, '#a7ffeb');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                for (let i = 40; i < w; i += 110) {
                    ctx.fillRect(i, 0, 32, h);
                }
            } else if (mode === CONFIG.MODES.TIME_ATTACK) {
                this.drawWoodTexture(ctx, w, h);
            } else {
                const grad = ctx.createRadialGradient(w / 2, h / 2 - 50, 40, w / 2, h / 2, w * 0.75);
                grad.addColorStop(0, '#e0f7fa');
                grad.addColorStop(0.4, '#00e5ff');
                grad.addColorStop(1, '#0091ea');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

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
                const shadeSeed = Math.sin(p * 12.9898) * 43758.5453;
                const shade = shadeSeed - Math.floor(shadeSeed);

                ctx.save();
                ctx.beginPath();
                ctx.rect(px, 0, plankWidth, h);
                ctx.clip();

                ctx.fillStyle = `rgba(120, 70, 30, ${0.12 + shade * 0.1})`;
                ctx.fillRect(px, 0, plankWidth, h);

                const edgeGrad = ctx.createLinearGradient(px, 0, px + plankWidth, 0);
                edgeGrad.addColorStop(0, 'rgba(255, 220, 170, 0.18)');
                edgeGrad.addColorStop(0.12, 'rgba(255, 220, 170, 0)');
                edgeGrad.addColorStop(0.88, 'rgba(0, 0, 0, 0)');
                edgeGrad.addColorStop(1, 'rgba(60, 30, 10, 0.35)');
                ctx.fillStyle = edgeGrad;
                ctx.fillRect(px, 0, plankWidth, h);

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

            const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(30, 15, 5, 0.35)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, w, h);
        }
    }

    // ==========================================
    // 6. PARTICLE MANAGER
    // ==========================================
    class ParticleManager {
        constructor() {
            this.particles = [];
            this.floatingTexts = [];
            this.screenFlashTimer = 0;
            this.screenFlashDuration = 0.3;
            this.screenFlashColor = 'rgba(255, 0, 0, 0)';
        }

        reset() {
            this.particles = [];
            this.floatingTexts = [];
            this.screenFlashTimer = 0;
            this.screenFlashDuration = 0.3;
        }

        spawnJuice(x, y, color, count = 16, isSparkle = false) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 350 + 100;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: isSparkle ? Math.random() * 4 + 3 : Math.random() * 6 + 3,
                    color, alpha: 1, life: Math.random() * 0.4 + 0.3, maxLife: 0.7, isSparkle
                });
            }
            if (this.particles.length > 220) {
                this.particles.splice(0, this.particles.length - 220);
            }
        }

        spawnFloatingText(text, x, y, color = '#ffffff', fontSize = 28) {
            this.floatingTexts.push({ text, x, y, vy: -120, color, fontSize, alpha: 1, life: 0.8 });
        }

        triggerScreenFlash(color = 'rgba(255, 0, 0, 0.35)', duration = 0.3) {
            this.screenFlashColor = color;
            this.screenFlashTimer = duration;
            this.screenFlashDuration = duration > 0 ? duration : 0.3;
        }

        update(dt) {
            if (this.screenFlashTimer > 0) this.screenFlashTimer -= dt;

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 400 * dt;
                p.life -= dt;
                p.alpha = Math.max(0, p.life / p.maxLife);
                if (p.life <= 0) this.particles.splice(i, 1);
            }

            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const t = this.floatingTexts[i];
                t.y += t.vy * dt;
                t.life -= dt;
                t.alpha = Math.max(0, t.life / 0.8);
                if (t.life <= 0) this.floatingTexts.splice(i, 1);
            }
        }

        draw(ctx) {
            if (this.screenFlashTimer > 0) {
                ctx.save();
                ctx.fillStyle = this.screenFlashColor;
                ctx.globalAlpha = Math.min(1, this.screenFlashTimer / this.screenFlashDuration);
                ctx.fillRect(0, 0, 1280, 720);
                ctx.restore();
            }

            for (const p of this.particles) {
                ctx.save();
                ctx.fillStyle = p.color;
                if (p.isSparkle) {
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

    // ==========================================
    // 7. FRUIT ENTITY & PHYSICS
    // ==========================================
    class FruitHalf {
        constructor(fruitType, x, y, vx, vy, rot, vRot, isLeft, gravity = 550) {
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
            if (this.y > CONFIG.CANVAS.DESIGN_HEIGHT + 100) this.isDead = true;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            this.type.drawHalf(ctx, this.radius, this.isLeft);
            ctx.restore();
        }
    }

    class Fruit {
        constructor(type = null, customX = null, customY = null, customVx = null, customVy = null, currentGravity = 550) {
            if (!type) {
                const roll = Math.random();
                let candidates;
                if (roll < CONFIG.DIFFICULTY.POWERUP_CHANCE) {
                    candidates = FRUIT_TYPES.filter(f => f.isPowerup);
                } else if (roll < CONFIG.DIFFICULTY.POWERUP_CHANCE + CONFIG.DIFFICULTY.RARE_FRUIT_CHANCE) {
                    candidates = FRUIT_TYPES.filter(f => f.isRare && !f.isPowerup);
                } else {
                    candidates = FRUIT_TYPES.filter(f => !f.isRare && !f.isPowerup);
                }
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
                const apexY = Math.random() * 200 + 220;
                const dy = apexY - this.y;
                this.vy = -Math.sqrt(2 * this.gravity * Math.abs(dy));
                const tUp = Math.abs(this.vy) / this.gravity;
                this.vx = (targetX - this.x) / tUp;
            }

            this.rot = Math.random() * Math.PI * 2;
            this.vRot = (Math.random() - 0.5) * 3;
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

            if (this.y < CONFIG.CANVAS.DESIGN_HEIGHT) this.hasBeenOnScreen = true;
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
            const half1 = new FruitHalf(this.type, this.x, this.y, this.vx + Math.cos(pAngle) * speed - 50, this.vy + Math.sin(pAngle) * speed - 30, this.rot, -3, true, this.gravity);
            const half2 = new FruitHalf(this.type, this.x, this.y, this.vx - Math.cos(pAngle) * speed + 50, this.vy - Math.sin(pAngle) * speed - 30, this.rot, 3, false, this.gravity);
            return [half1, half2];
        }
    }

    // ==========================================
    // 8. MONSTER ENTITY
    // ==========================================
    class Monster {
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
                    this.vy = Math.random() * 120 + 120;
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

            if (this.y > CONFIG.CANVAS.DESIGN_HEIGHT + 120 || this.x < -150 || this.x > CONFIG.CANVAS.DESIGN_WIDTH + 150) {
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

    // ==========================================
    // 9. SLASH MANAGER
    // ==========================================
    class SlashManager {
        constructor() {
            this.trailPoints = [];
            this.tapBursts = [];
        }

        reset() {
            this.trailPoints = [];
            this.tapBursts = [];
        }

        addTrailPoint(x, y, vx, vy) {
            this.trailPoints.push({ x, y, vx, vy, life: CONFIG.SLASH.TRAIL_LIFETIME, maxLife: CONFIG.SLASH.TRAIL_LIFETIME });
            if (this.trailPoints.length > 60) {
                this.trailPoints.splice(0, this.trailPoints.length - 60);
            }
        }

        addTapBurst(x, y) {
            this.tapBursts.push({ x, y, radius: 10, maxRadius: CONFIG.SLASH.TAP_RADIUS, life: CONFIG.SLASH.TAP_LIFETIME, maxLife: CONFIG.SLASH.TAP_LIFETIME });
        }

        update(dt) {
            for (let i = this.trailPoints.length - 1; i >= 0; i--) {
                this.trailPoints[i].life -= dt;
                if (this.trailPoints[i].life <= 0) this.trailPoints.splice(i, 1);
            }
            for (let i = this.tapBursts.length - 1; i >= 0; i--) {
                const b = this.tapBursts[i];
                b.life -= dt;
                b.radius = b.maxRadius * (1 - Math.max(0, b.life / b.maxLife));
                if (b.life <= 0) this.tapBursts.splice(i, 1);
            }
        }

        draw(ctx) {
            for (const b of this.tapBursts) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
                ctx.strokeStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 18;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (this.trailPoints.length < 2) return;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            for (let i = 1; i < this.trailPoints.length; i++) {
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
            }
            const newest = this.trailPoints[this.trailPoints.length - 1];
            const newestAlpha = Math.max(0, newest.life / newest.maxLife);
            if (newestAlpha > 0) {
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = `rgba(0, 229, 255, ${newestAlpha * 0.7})`;
                ctx.lineWidth = 11;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            for (let i = 1; i < this.trailPoints.length; i++) {
                const p1 = this.trailPoints[i - 1];
                const p2 = this.trailPoints[i];
                const alpha = Math.max(0, p2.life / p2.maxLife);
                const width = 14 * alpha;
                if (alpha <= 0) continue;

                ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();

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

    // ==========================================
    // 10. GAME ENGINE
    // ==========================================
    const GAME_STATE = {
        MENU: 'MENU',
        MODE_SELECT: 'MODE_SELECT',
        COUNTDOWN: 'COUNTDOWN',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    };

    class GameEngine {
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

            this.freezeTimer = 0;
            this.doublePointsTimer = 0;
            this.hasShield = false;

            this.initMenuState();
        }

        initMenuState() {
            this.state = GAME_STATE.MENU;
            this.fruits = [];
            this.fruitHalves = [];
            this.monsters = [];
            this.particleMgr.reset();
            this.slashMgr.reset();

            const watermelonType = FRUIT_TYPES.find(f => f.id === 'watermelon');
            this.playFruit = new Fruit(watermelonType, 640, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);

            if (this.ui) this.ui.showMenuUI();
        }

        transitionToModeSelect() {
            this.state = GAME_STATE.MODE_SELECT;
            const appleType = FRUIT_TYPES.find(f => f.id === 'apple');
            const pineappleType = FRUIT_TYPES.find(f => f.id === 'pineapple');

            this.survivalFruit = new Fruit(appleType, 420, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);
            this.timeAttackFruit = new Fruit(pineappleType, 860, 360, 0, 0, CONFIG.CANVAS.GRAVITY_START);

            if (this.ui) this.ui.showModeSelectUI();
        }

        startCountdown(mode) {
            this.mode = mode;
            this.state = GAME_STATE.COUNTDOWN;
            this.countdownValue = 3;
            this.countdownTimer = 0;

            if (this.ui) this.ui.showCountdownUI(this.countdownValue);
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

            this.freezeTimer = 0;
            this.doublePointsTimer = 0;
            this.hasShield = false;
            this.currentAttackSliceCount = 0;
            this.currentAttackHitMonster = false;
            this.attackComboTimer = 0;

            if (this.ui) this.ui.showGameplayUI(this.mode, this.score, this.lives, this.timeRemaining);
            if (this.ui) this.ui.updatePowerupStatus(this);
            if (this.ui) this.ui.updateCombo(1);
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

            if (window.Arcadia) {
                const slashSlug = (this.mode === 'TIME_ATTACK') ? 'fruit-slash-time-attack' : 'fruit-slash-survival';
                const slashTitle = (this.mode === 'TIME_ATTACK') ? 'Fruit Slash (Time Attack)' : 'Fruit Slash (Survival)';
                Arcadia.submitScore(slashSlug, slashTitle, this.score);
            }

            if (this.ui) this.ui.showGameOverUI(this.score, highScore, isNewHS, this.mode);
        }

        handleSlashInput(x, y, vx, vy, isTap) {
            if (this.state === GAME_STATE.MENU) {
                if (this.playFruit && !this.playFruit.isSliced) {
                    if (this.checkPointCircleCollision(x, y, isTap ? CONFIG.SLASH.TAP_RADIUS : 25, this.playFruit.x, this.playFruit.y, this.playFruit.radius + 20)) {
                        const halves = this.playFruit.slice(vx, vy);
                        this.fruitHalves.push(...halves);
                        this.particleMgr.spawnJuice(this.playFruit.x, this.playFruit.y, '#ff1744');
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
                        this.particleMgr.spawnJuice(this.survivalFruit.x, this.survivalFruit.y, '#ff1744');
                        AUDIO.playSlice(false);
                        setTimeout(() => this.startCountdown(CONFIG.MODES.SURVIVAL), 400);
                        return;
                    }
                }
                if (this.timeAttackFruit && !this.timeAttackFruit.isSliced) {
                    if (this.checkPointCircleCollision(x, y, isTap ? CONFIG.SLASH.TAP_RADIUS : 25, this.timeAttackFruit.x, this.timeAttackFruit.y, this.timeAttackFruit.radius + 20)) {
                        const halves = this.timeAttackFruit.slice(vx, vy);
                        this.fruitHalves.push(...halves);
                        this.particleMgr.spawnJuice(this.timeAttackFruit.x, this.timeAttackFruit.y, '#ffab00');
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

                    if (fruit.type.isPowerup) {
                        AUDIO.playSlice(true);
                        this.particleMgr.spawnJuice(fruit.x, fruit.y, fruit.type.innerColor, 22, true);
                        this.activatePowerup(fruit.type.powerupId, fruit.x, fruit.y);
                        continue;
                    }

                    this.currentAttackSliceCount++;

                    const basePoints = fruit.type.isRare ? CONFIG.SCORING.RARE_FRUIT : CONFIG.SCORING.NORMAL_FRUIT;
                    const prevMultiplier = this.getComboMultiplier(this.currentAttackSliceCount - 1);
                    const comboMultiplier = this.getComboMultiplier(this.currentAttackSliceCount);
                    const doubleMultiplier = this.doublePointsTimer > 0 ? 2 : 1;
                    const points = Math.round(basePoints * comboMultiplier * doubleMultiplier);
                    this.score += points;

                    AUDIO.playSlice(fruit.type.isRare);
                    this.particleMgr.spawnJuice(fruit.x, fruit.y, fruit.type.innerColor, fruit.type.isRare ? 24 : 14, fruit.type.isRare);

                    const scoreText = `+${points}`;
                    const scoreColor = fruit.type.isRare ? '#ffd700' : '#ffffff';
                    this.particleMgr.spawnFloatingText(scoreText, fruit.x, fruit.y - 20, scoreColor, fruit.type.isRare ? 34 : 28);

                    if (comboMultiplier > prevMultiplier && !this.currentAttackHitMonster) {
                        this.particleMgr.spawnFloatingText(`COMBO x${comboMultiplier}!`, fruit.x, fruit.y - 60, '#ff4081', 36);
                    }

                    if (this.ui) {
                        this.ui.updateScore(this.score);
                        this.ui.updateCombo(comboMultiplier);
                    }
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

                    if (this.hasShield) {
                        this.hasShield = false;
                        this.particleMgr.spawnFloatingText('SHIELD BLOCKED!', monster.x, monster.y - 30, '#18ffff', 32);
                        if (this.ui) this.ui.updatePowerupStatus(this);
                    } else if (this.mode === CONFIG.MODES.SURVIVAL) {
                        this.lives--;
                        this.particleMgr.spawnFloatingText('-1 LIFE', monster.x, monster.y - 30, '#ff1744', 32);
                        if (this.ui) this.ui.updateLives(this.lives);
                        if (this.lives <= 0) this.triggerGameOver();
                    } else if (this.mode === CONFIG.MODES.TIME_ATTACK) {
                        this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.TIME_ATTACK.MONSTER_PENALTY);
                        this.particleMgr.spawnFloatingText(`-${CONFIG.TIME_ATTACK.MONSTER_PENALTY} SEC`, monster.x, monster.y - 30, '#ff1744', 32);
                        if (this.ui) this.ui.updateTimer(this.timeRemaining);
                        if (this.timeRemaining <= 0) this.triggerGameOver();
                    }
                }
            }
        }

        getComboMultiplier(sliceCount) {
            let mult = 1;
            for (const tier of CONFIG.SCORING.COMBO_TIERS) {
                if (sliceCount >= tier.min) mult = tier.mult;
            }
            return mult;
        }

        activatePowerup(id, x, y) {
            switch (id) {
                case 'freeze':
                    this.freezeTimer = CONFIG.POWERUPS.FREEZE_DURATION;
                    this.particleMgr.spawnFloatingText('FREEZE!', x, y - 40, '#40c4ff', 34);
                    this.particleMgr.triggerScreenFlash('rgba(64, 196, 255, 0.25)', 0.3);
                    break;
                case 'double':
                    this.doublePointsTimer = CONFIG.POWERUPS.DOUBLE_DURATION;
                    this.particleMgr.spawnFloatingText('2X POINTS!', x, y - 40, '#ff4081', 34);
                    break;
                case 'frenzy':
                    this.particleMgr.spawnFloatingText('FRUIT FRENZY!', x, y - 40, '#ffea00', 34);
                    for (let i = 0; i < CONFIG.POWERUPS.FRENZY_FRUIT_COUNT; i++) {
                        this.fruits.push(new Fruit(null, null, null, null, null, this.currentGravity));
                    }
                    break;
                case 'shield':
                    this.hasShield = true;
                    this.particleMgr.spawnFloatingText('SHIELD UP!', x, y - 40, '#18ffff', 34);
                    break;
            }
            if (this.ui) this.ui.updatePowerupStatus(this);
        }

        checkPointCircleCollision(px, py, pr, cx, cy, cr) {
            const dx = px - cx;
            const dy = py - cy;
            return (dx * dx + dy * dy) <= (pr + cr) * (pr + cr);
        }

        update(dt) {
            if (this.state !== GAME_STATE.PAUSED) {
                this.particleMgr.update(dt);
                this.slashMgr.update(dt);

                for (let i = this.fruitHalves.length - 1; i >= 0; i--) {
                    this.fruitHalves[i].update(dt);
                    if (this.fruitHalves[i].isDead) this.fruitHalves.splice(i, 1);
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
                if (this.attackComboTimer <= 0) {
                    this.currentAttackSliceCount = 0;
                    this.currentAttackHitMonster = false;
                    if (this.ui) this.ui.updateCombo(1);
                }
            }

            const wasFrozen = this.freezeTimer > 0;
            const wasDoubled = this.doublePointsTimer > 0;
            if (this.freezeTimer > 0) this.freezeTimer = Math.max(0, this.freezeTimer - dt);
            if (this.doublePointsTimer > 0) this.doublePointsTimer = Math.max(0, this.doublePointsTimer - dt);
            if (this.ui && ((wasFrozen && this.freezeTimer === 0) || (wasDoubled && this.doublePointsTimer === 0))) {
                this.ui.updatePowerupStatus(this);
            }
            // Slow-mo: while freeze is active, fruits/monsters/spawning move at a
            // fraction of real time. Player input, particles, and the round timer
            // still run at full speed so freeze is a pure "easier to combo" window.
            const worldDt = this.freezeTimer > 0 ? dt * CONFIG.POWERUPS.FREEZE_SLOW_FACTOR : dt;

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

            this.spawnTimer += worldDt;
            if (this.spawnTimer >= this.currentSpawnInterval) {
                this.spawnTimer = 0;
                this.spawnWave(difficultyProgress);
            }

            for (let i = this.fruits.length - 1; i >= 0; i--) {
                const fruit = this.fruits[i];
                fruit.update(worldDt);

                if (fruit.isMissed) {
                    AUDIO.playMiss();
                    this.particleMgr.spawnFloatingText('MISS!', fruit.x, 680, '#ff3d00', 30);

                    if (this.mode === CONFIG.MODES.SURVIVAL) {
                        this.lives--;
                        this.particleMgr.spawnFloatingText('-1 LIFE', fruit.x, 640, '#ff1744', 32);
                        this.particleMgr.triggerScreenFlash('rgba(255, 0, 0, 0.3)', 0.25);
                        if (this.ui) this.ui.updateLives(this.lives);
                        if (this.lives <= 0) this.triggerGameOver();
                    } else if (this.mode === CONFIG.MODES.TIME_ATTACK) {
                        this.timeRemaining = Math.max(0, this.timeRemaining - CONFIG.TIME_ATTACK.MISS_PENALTY);
                        this.particleMgr.spawnFloatingText(`-${CONFIG.TIME_ATTACK.MISS_PENALTY} SEC`, fruit.x, 640, '#ff9100', 30);
                        this.particleMgr.triggerScreenFlash('rgba(255, 100, 0, 0.25)', 0.2);
                        if (this.ui) this.ui.updateTimer(this.timeRemaining);
                        if (this.timeRemaining <= 0) this.triggerGameOver();
                    }
                }

                if (fruit.isDead) this.fruits.splice(i, 1);
            }

            for (let i = this.monsters.length - 1; i >= 0; i--) {
                const monster = this.monsters[i];
                monster.update(worldDt);
                if (monster.isDead) this.monsters.splice(i, 1);
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

        drawFruitNinjaBorder(ctx, x, y, radius, badgeText) {
            ctx.save();
            ctx.translate(x, y);

            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 22;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 12;
            ctx.strokeStyle = '#ffea00';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 12;

            const bannerW = 140;
            const bannerH = 40;
            const bannerY = radius + 22;

            ctx.fillStyle = '#ff3d00';
            ctx.beginPath();
            ctx.roundRect(-bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 20);
            ctx.fill();

            ctx.strokeStyle = '#ffea00';
            ctx.lineWidth = 3;
            ctx.stroke();

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

            for (const half of this.fruitHalves) half.draw(ctx);
            for (const fruit of this.fruits) fruit.draw(ctx);
            for (const monster of this.monsters) monster.draw(ctx);

            this.slashMgr.draw(ctx);
            this.particleMgr.draw(ctx);
        }
    }

    // ==========================================
    // 11. UI CONTROLLER (BRIGHT & CHEERFUL)
    // ==========================================
    class UIController {
        constructor(gameEngine) {
            this.game = gameEngine;

            this.menuContainer = document.getElementById('menu-overlay');
            this.modeSelectContainer = document.getElementById('mode-select-overlay');
            this.countdownContainer = document.getElementById('countdown-overlay');
            this.gameplayContainer = document.getElementById('gameplay-overlay');
            this.pauseModal = document.getElementById('pause-modal');
            this.gameOverModal = document.getElementById('game-over-modal');
            this.settingsModal = document.getElementById('settings-modal');
            this.leaderboardModal = document.getElementById('leaderboard-modal');

            this.playerProfileBadge = document.getElementById('menu-player-badge');
            this.hudPlayerName = document.getElementById('hud-player-name');
            this.scoreDisplay = document.getElementById('hud-score');
            this.livesDisplay = document.getElementById('hud-lives');
            this.timerDisplay = document.getElementById('hud-timer');
            this.pauseBtn = document.getElementById('hud-pause-btn');
            this.comboDisplay = document.getElementById('hud-combo');
            this.powerupIcons = document.getElementById('hud-powerup-icons');

            this.initButtons();
            this.updatePlayerNameDisplay();
        }

        updatePlayerNameDisplay() {
            const name = STORAGE.getPlayerName();
            if (this.playerProfileBadge) {
                this.playerProfileBadge.textContent = `👤 Player: ${name}`;
            }
            if (this.hudPlayerName) {
                this.hudPlayerName.textContent = `PLAYER: ${name}`;
            }
        }

        initButtons() {
            if (this.playerProfileBadge) {
                this.playerProfileBadge.addEventListener('click', () => {
                    AUDIO.playClick();
                    this.showSettingsModal();
                });
            }

            const settingsBtn = document.getElementById('menu-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    AUDIO.playClick();
                    this.showSettingsModal();
                });
            }

            const highScoresBtn = document.getElementById('menu-highscores-btn');
            if (highScoresBtn) {
                highScoresBtn.addEventListener('click', () => {
                    AUDIO.playClick();
                    this.showLeaderboardModal();
                });
            }

            this.pauseBtn.addEventListener('click', () => {
                AUDIO.playClick();
                this.game.togglePause();
            });

            document.getElementById('pause-resume-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.game.togglePause();
            });

            document.getElementById('pause-restart-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.hidePauseUI();
                this.game.startGame();
            });

            document.getElementById('pause-menu-btn').addEventListener('click', () => {
                AUDIO.playClick();
                AUDIO.stopBGM();
                this.hidePauseUI();
                this.game.initMenuState();
            });

            document.getElementById('go-restart-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.hideGameOverUI();
                this.game.startGame();
            });

            document.getElementById('go-menu-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.hideGameOverUI();
                this.game.initMenuState();
            });

            document.getElementById('close-settings-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.settingsModal.classList.add('hidden');
            });

            document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
                AUDIO.playClick();
                this.leaderboardModal.classList.add('hidden');
            });

            const soundToggle = document.getElementById('sound-toggle-btn');
            soundToggle.addEventListener('click', () => {
                const isMuted = AUDIO.toggleMute();
                STORAGE.setSoundMuted(isMuted);
                soundToggle.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
                soundToggle.classList.toggle('muted', isMuted);
                AUDIO.playClick();
            });

            const saveNameBtn = document.getElementById('save-username-btn');
            const usernameInput = document.getElementById('username-input');
            const nameStatusMsg = document.getElementById('username-status-msg');

            saveNameBtn.addEventListener('click', () => {
                const result = STORAGE.setPlayerName(usernameInput.value);
                if (result.success) {
                    nameStatusMsg.textContent = `Name saved: ${result.name}`;
                    nameStatusMsg.style.color = '#00c853';
                    this.updatePlayerNameDisplay();
                    this.updateSettingsModalState();
                } else {
                    nameStatusMsg.textContent = result.reason;
                    nameStatusMsg.style.color = '#ff1744';
                }
            });

            document.getElementById('tab-survival').addEventListener('click', (e) => {
                AUDIO.playClick();
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderLeaderboard(CONFIG.MODES.SURVIVAL);
            });

            document.getElementById('tab-timeattack').addEventListener('click', (e) => {
                AUDIO.playClick();
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderLeaderboard(CONFIG.MODES.TIME_ATTACK);
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' || e.key === 'Backspace') {
                    if (this.game.state === GAME_STATE.PLAYING && this.game.mode === CONFIG.MODES.SURVIVAL) {
                        this.game.togglePause();
                    }
                }
            });
        }

        hideAllOverlays() {
            this.menuContainer.classList.add('hidden');
            this.modeSelectContainer.classList.add('hidden');
            this.countdownContainer.classList.add('hidden');
            this.gameplayContainer.classList.add('hidden');
            this.pauseModal.classList.add('hidden');
            this.gameOverModal.classList.add('hidden');
        }

        showMenuUI() {
            this.hideAllOverlays();
            this.updatePlayerNameDisplay();
            this.menuContainer.classList.remove('hidden');
        }

        showModeSelectUI() {
            this.hideAllOverlays();
            this.modeSelectContainer.classList.remove('hidden');
        }

        showCountdownUI(val) {
            this.hideAllOverlays();
            this.countdownContainer.classList.remove('hidden');
            document.getElementById('countdown-text').textContent = val;
        }

        updateCountdown(val) {
            document.getElementById('countdown-text').textContent = val;
        }

        showGameplayUI(mode, score, lives, timer) {
            this.hideAllOverlays();
            this.gameplayContainer.classList.remove('hidden');
            this.updatePlayerNameDisplay();
            this.updateScore(score);

            if (mode === CONFIG.MODES.SURVIVAL) {
                this.livesDisplay.classList.remove('hidden');
                this.timerDisplay.classList.add('hidden');
                this.pauseBtn.classList.remove('hidden');
                this.updateLives(lives);
            } else {
                this.livesDisplay.classList.add('hidden');
                this.timerDisplay.classList.remove('hidden');
                this.pauseBtn.classList.add('hidden');
                this.updateTimer(timer);
            }
        }

        updateScore(score) {
            this.scoreDisplay.textContent = `SCORE: ${score}`;
        }

        updateLives(lives) {
            let hearts = '';
            for (let i = 0; i < lives; i++) hearts += '❤️ ';
            this.livesDisplay.textContent = `LIVES: ${hearts || '0'}`;
        }

        updateTimer(seconds) {
            this.timerDisplay.textContent = `TIME: ${Math.max(0, seconds)}s`;
        }

        updateCombo(multiplier) {
            if (!this.comboDisplay) return;
            if (multiplier > 1) {
                this.comboDisplay.textContent = `COMBO x${multiplier}`;
                this.comboDisplay.classList.remove('hidden');
            } else {
                this.comboDisplay.classList.add('hidden');
            }
        }

        updatePowerupStatus(game) {
            if (!this.powerupIcons) return;
            const chips = [];
            if (game.freezeTimer > 0) {
                chips.push(`<span class="powerup-chip powerup-freeze">❄️ ${game.freezeTimer.toFixed(1)}s</span>`);
            }
            if (game.doublePointsTimer > 0) {
                chips.push(`<span class="powerup-chip powerup-double">⭐ 2X ${game.doublePointsTimer.toFixed(1)}s</span>`);
            }
            if (game.hasShield) {
                chips.push(`<span class="powerup-chip powerup-shield">🛡️ Shield</span>`);
            }
            this.powerupIcons.innerHTML = chips.join('');
        }

        showPauseUI() {
            this.pauseModal.classList.remove('hidden');
        }

        hidePauseUI() {
            this.pauseModal.classList.add('hidden');
        }

        showGameOverUI(score, highScore, isNewHS, mode) {
            this.hideAllOverlays();
            this.gameOverModal.classList.remove('hidden');
            document.getElementById('go-score').textContent = score;
            document.getElementById('go-highscore').textContent = highScore;

            const newBadge = document.getElementById('go-new-hs-badge');
            if (isNewHS) {
                newBadge.classList.remove('hidden');
            } else {
                newBadge.classList.add('hidden');
            }

            document.getElementById('go-mode-title').textContent = mode === CONFIG.MODES.SURVIVAL ? 'SURVIVAL MODE' : 'TIME ATTACK MODE';
        }

        hideGameOverUI() {
            this.gameOverModal.classList.add('hidden');
        }

        showSettingsModal() {
            this.updateSettingsModalState();
            this.settingsModal.classList.remove('hidden');
        }

        updateSettingsModalState() {
            const soundToggle = document.getElementById('sound-toggle-btn');
            const isMuted = STORAGE.isSoundMuted();
            soundToggle.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
            soundToggle.classList.toggle('muted', isMuted);

            const usernameInput = document.getElementById('username-input');
            const saveNameBtn = document.getElementById('save-username-btn');
            const nameStatusMsg = document.getElementById('username-status-msg');

            usernameInput.value = STORAGE.getPlayerName();

            if (STORAGE.canChangeName()) {
                usernameInput.disabled = false;
                saveNameBtn.disabled = false;
                nameStatusMsg.textContent = 'You can change your username 1 time.';
                nameStatusMsg.style.color = '#0091ea';
            } else {
                usernameInput.disabled = true;
                saveNameBtn.disabled = true;
                nameStatusMsg.textContent = 'Username change limit reached (1/1).';
                nameStatusMsg.style.color = '#ff9100';
            }
        }

        async showLeaderboardModal() {
            this.leaderboardModal.classList.remove('hidden');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('tab-survival').classList.add('active');
            await this.renderLeaderboard(CONFIG.MODES.SURVIVAL);
        }

        async renderLeaderboard(mode) {
            const tbody = document.getElementById('leaderboard-list');
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px;">Loading scores...</td></tr>';
            const scores = await STORAGE.fetchLeaderboard(mode);
            tbody.innerHTML = '';
            if (scores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#aaa;">No scores yet — be the first to set one! 🏆</td></tr>';
                return;
            }
            scores.forEach((entry, index) => {
                const tr = document.createElement('tr');
                if (entry.name === STORAGE.getPlayerName()) {
                    tr.classList.add('highlight-user');
                }
                const rankTd = document.createElement('td');
                rankTd.textContent = `#${index + 1}`;
                const nameTd = document.createElement('td');
                nameTd.textContent = entry.name;
                const scoreTd = document.createElement('td');
                const strong = document.createElement('strong');
                strong.textContent = entry.score;
                scoreTd.appendChild(strong);
                tr.appendChild(rankTd);
                tr.appendChild(nameTd);
                tr.appendChild(scoreTd);
                tbody.appendChild(tr);
            });
        }
    }

    // ==========================================
    // 12. INITIALIZATION
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
        const gameContainer = document.getElementById('game-container');
        const canvasManager = new CanvasManager(gameContainer);
        const particleManager = new ParticleManager();
        const slashManager = new SlashManager();

        const gameEngine = new GameEngine(canvasManager, particleManager, slashManager, null);
        const uiController = new UIController(gameEngine);
        gameEngine.ui = uiController;

        AUDIO.setMuted(STORAGE.isSoundMuted());

        let lastSlashFxTime = 0;
        const SLASH_FX_MIN_INTERVAL_MS = 45;

        new InputHandler(
            canvasManager.canvas,
            (x, y, vx, vy, isTap) => {
                slashManager.addTrailPoint(x, y, vx, vy);
                gameEngine.handleSlashInput(x, y, vx, vy, false);

                const now = performance.now();
                if (now - lastSlashFxTime >= SLASH_FX_MIN_INTERVAL_MS) {
                    lastSlashFxTime = now;
                    particleManager.spawnJuice(x, y, 'rgba(0, 229, 255, 0.6)', 1, true);
                    AUDIO.playSlash();
                }
            },
            (x, y) => {
                slashManager.addTapBurst(x, y);
                particleManager.spawnJuice(x, y, '#ffffff', 8, true);
                AUDIO.playSlash();
                gameEngine.handleSlashInput(x, y, 0, 0, true);
            }
        );

        gameEngine.initMenuState();

        let lastTime = performance.now();
        function gameLoop(now) {
            const dt = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;
            gameEngine.update(dt);
            gameEngine.render();
            requestAnimationFrame(gameLoop);
        }
        requestAnimationFrame(gameLoop);
    });
})();
