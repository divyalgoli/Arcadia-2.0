/**
 * Fruit Slash - Game Configuration & Ultra-Vibrant Bright Assets Specifications
 */

export const CONFIG = {
    CANVAS: {
        DESIGN_WIDTH: 1280,
        DESIGN_HEIGHT: 720,
        GRAVITY_START: 550,  // Gentler floaty gravity at start
        GRAVITY_MAX: 1050,   // Faster gravity at max difficulty
    },

    MODES: {
        SURVIVAL: 'SURVIVAL',
        TIME_ATTACK: 'TIME_ATTACK'
    },

    SURVIVAL: {
        INITIAL_LIVES: 3,
    },

    TIME_ATTACK: {
        INITIAL_TIME: 60, // seconds
        MISS_PENALTY: 2,   // -2 seconds
        MONSTER_PENALTY: 10 // -10 seconds
    },

    SCORING: {
        NORMAL_FRUIT: 1,
        RARE_FRUIT: 10,
        COMBO_MIN: 3,
        COMBO_BONUS: 5
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
        MONSTER_CHANCE_START: 0.12,
        MONSTER_CHANCE_END: 0.5
    }
};

// Ultra-Bright & Vibrant Fruit Types
export const FRUIT_TYPES = [
    {
        id: 'watermelon',
        name: 'Watermelon',
        radius: 50,
        isRare: false,
        outerColor: '#00e676',
        innerColor: '#ff1744',
        draw: (ctx, r) => {
            // Bright neon outer green shell
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = '#00e676';
            ctx.fill();
            // Dark lime stripes
            ctx.strokeStyle = '#1b5e20';
            ctx.lineWidth = r * 0.15;
            for (let i = -0.6; i <= 0.6; i += 0.4) {
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.9, i * Math.PI, (i + 0.2) * Math.PI);
                ctx.stroke();
            }
            // Crisp highlight
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
            // Highlight
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
    }
];

export const MONSTER_TYPES = [
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
