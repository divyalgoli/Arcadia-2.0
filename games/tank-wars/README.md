# Tank Wars ⚔️ - Premium 2-Player Browser Game

A high-performance, responsive 2-player local multiplayer browser game built with **Vanilla HTML5, CSS3, and JavaScript**.

![Tank Wars Preview](https://img.shields.value/badge/Engine-HTML5_Canvas-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![FPS](https://img.shields.io/badge/FPS-60-orange)

---

## 🚀 Features

- **Split-Screen Local 1v1 Battle**: Two players fight inside the "Desert Military Outpost" arena.
- **Glassmorphism UI**: High-end modern UI theme with backdrop blur effects, glowing neon accents, and smooth modal overlays.
- **Responsive Controls**:
  - **Desktop Keyboard**: Player 1 (`WASD + Space`), Player 2 (`Arrow Keys + Enter`).
  - **Mobile / Tablet**: Built-in split-screen virtual joysticks + action fire buttons supporting simultaneous multi-touch.
- **Tactical Map Mechanics**:
  - **Indestructible Stone Walls & Steel Barriers** for heavy cover.
  - **Destructible Wooden Crates** with wood splinter particles.
  - **Explosive Oil Barrels** that trigger chain-reaction detonations dealing area damage.
  - **Camouflage Bushes** to hide tanks.
- **Dynamic Physics & Visual Effects**:
  - Animated tank tread tracks & dust trail particles.
  - Cannon barrel recoil and screen shake on fire & hit.
  - Floating damage numbers & red low-HP warning flashes.
  - Multi-stage fire, smoke, and debris explosion particle system.
- **Procedural Audio Synthesizer**: Web Audio API generated sound effects (cannon blasts, explosions, barrel detonations, engine hum, victory fanfare) working offline with zero external audio assets required.

---

## 🎮 Game Controls

### Desktop Keyboard
| Action | Player 1 (Blue) | Player 2 (Orange) |
| :--- | :--- | :--- |
| **Move & Turn** | `W`, `A`, `S`, `D` | `Up`, `Left`, `Down`, `Right` |
| **Shoot Cannon** | `SPACE` | `ENTER` |

### Mobile / Tablet (Touchscreen)
- **Player 1 (Left Half)**: Left Virtual Analog Joystick + Left FIRE Button
- **Player 2 (Right Half)**: Right Virtual Analog Joystick + Right FIRE Button

---

## 📁 Project Structure

```
tank-wars/
├── index.html          # Main HTML structure & UI overlays
├── README.md           # Documentation
├── css/
│   └── style.css       # Glassmorphism styling & mobile layouts
└── js/
    ├── game.js         # Game engine loop & state manager
    ├── player.js       # Tank physics, rendering & combat
    ├── bullet.js       # Cannon shell trajectory & collision
    ├── map.js          # Desert Outpost terrain & obstacles
    ├── particle.js     # Explosion particles, debris & camera shake
    ├── controls.js     # Keyboard & multi-touch virtual joysticks
    ├── audio.js        # Web Audio API sound synthesizer
    └── ui.js           # DOM HUD and modal screen manager
```

---

## 💻 How to Run

1. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Or serve via any local dev server (e.g. `npx serve .` or Live Server extension).
