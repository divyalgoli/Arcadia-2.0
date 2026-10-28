# Arcadia 2.0 — Modern Browser Game Portal

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen.svg)](https://divyalgoli.github.io/Arcadia-2.0/)
[![Repository](https://img.shields.io/badge/GitHub-Arcadia--2.0-blue.svg)](https://github.com/divyalgoli/Arcadia-2.0)
[![Games](https://img.shields.io/badge/Games-10%20Playable-green.svg)](https://divyalgoli.github.io/Arcadia-2.0/)
[![Progression](https://img.shields.io/badge/Progression-XP%20%26%2018%20Achievements-purple.svg)](https://divyalgoli.github.io/Arcadia-2.0/)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

> **Live Website:** [https://divyalgoli.github.io/Arcadia-2.0/](https://divyalgoli.github.io/Arcadia-2.0/)

A modern, fast, responsive web gaming portal built with vanilla HTML5, CSS3, and JavaScript, featuring a unified progression engine, 18 unlockable achievements, player profile cards, cloud synchronization, and live per-game leaderboards powered by Firebase.

---

## 🎮 The Game Catalog

Arcadia hosts 10 independent, fully-featured browser games with dedicated scoring metrics and mobile touch controls:

| # | Game | Category | Scoring Metric | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **🏓 Ping-Pong** | Arcade / Sports | Winning Margin (Points) | Classic 2-player paddle rally with responsive AI and customizable rallies. |
| 2 | **🎈 Balloon Blast** | Casual / Arcade | Pop Count | Pop colorful flying balloons while dodging airborne hazards and bombs. |
| 3 | **🧠 Memory Card** | Puzzle / Brain | Completion Time (sec) | Test cognitive recall across themed icon decks with speed bonuses. |
| 4 | **🎨 Paint Tag Arena** | Action / Arena | Territory Turf (%) | Multiplayer-style arena turf battle claiming arena tiles with paint blaster. |
| 5 | **🍬 Candyland Tic-Tac-Toe** | Strategy / Board | Streak / High Score | Sweet candy-themed classic with multi-level AI and 2-player mode. |
| 6 | **🍉 Fruit Slash** | Arcade / Reflex | Slices (Survival / Time Attack) | Fast-paced fruit blade action featuring Survival and Time-Attack modes. |
| 7 | **🦸 Superman Swing** | Physics / Runner | Distance Traveled (m) | Momentum-based pendulum swinging through neon urban skylines. |
| 8 | **⚔️ Tank Wars** | Action / Strategy | Tanks Eliminated | Tactical artillery tank combat with destructible cover and bullet physics. |
| 9 | **🏹 Outbound** | Arcade / Reflex | Waves Cleared | Quick-draw archery defense against waves of incoming targets. |
| 10 | **🦖 Gravity Run** | Endless Runner | Distance (m) | Infinite runner with upside-down gravity inversion mechanics. |

---

## 🚀 Key Features

- **Integrated Player Progression (Arcadia Progression Engine):**
  - Continuous XP earning across all 10 titles for session completion, milestones, and high scores.
  - Deterministic Level Curve: Levels 1 through 100 with distinct player rank titles (Rookie, Apprentice, Veteran, Champion, Master, Legend).
  - Daily login and session bonuses with daily XP caps.
- **18 Platform Achievements & Badges:**
  - Category masteries, session milestones, multi-game diversity badges, and secret easter eggs.
  - Interactive player profile modal featuring badge showcases, session counts, and progress tracking.
- **Unified Game Shell & In-Game HUD:**
  - Seamless in-game navigation bar (`arcadia-shell.js`) providing instant pause, fullscreen toggle, audio mute, home navigation, and live XP awards.
- **Firebase Authentication & Cloud Synchronization:**
  - Guest-first architecture: Play anonymously right away with automatic local persistence.
  - One-click account creation / login with email and password.
  - Smart progression merge: Non-destructive high-water-mark union of local guest progress with cloud saves upon sign-in.
  - Offline sync queue: Plays offline and automatically flushes pending XP and records once network connectivity is restored.
- **Per-Game Live Leaderboards:**
  - Real-time Firestore-backed leaderboards per game with custom unit metrics, rank trophies, and player avatars.
- **Dark/Light Theme & Responsive Design:**
  - Mobile-first CSS architecture (`mobile.css`) with fluid `clamp()` typography, virtual touch joysticks, and safe-area notch padding.

---

## 📂 Project Architecture

```
Arcadia/
├── index.html              → Portal homepage entry point
├── css/
│   ├── style.css           → Global design tokens, layout, leaderboard, profile modals
│   ├── animations.css      → Keyframe animations, toasts, micro-interactions
│   └── mobile.css          → Responsive breakpoints & touch optimizations
├── js/
│   ├── games-data.js       → Catalog metadata, categories, thumbnails & accent colors
│   ├── storage.js          → Local storage helpers (favorites, recently played, theme)
│   ├── arcadia-progression.js → Core XP curves, level calculation & 18 achievements
│   ├── arcadia-shell.js    → In-game HUD overlay, pause, fullscreen & exit shell
│   ├── arcadia-profile.js  → Player profile modal & badge grid renderer
│   ├── arcadia-cloud.js    → Firestore client operations & cloud persistence
│   ├── arcadia-sync.js     → Guest-to-cloud migration & offline sync queue
│   ├── auth-ui.js          → Firebase auth modal controller & state listeners
│   ├── firebase-config.js  → Client-side Firebase configuration
│   ├── mobile-utils.js     → Mobile touch helpers & virtual joystick controllers
│   └── main.js             → Portal initialization, filters, search & leaderboard tabs
├── assets/
│   ├── icons/              → Brand icons, favicons, vector assets
│   └── thumbnails/         → Crisp SVG/JPG game artwork
├── public/                 → Static document root for web hosting (mirrors portal & holds games)
│   └── games/              → Self-contained HTML5/CSS3/JS game folders
│       ├── ping-pong/
│       ├── balloon-blast/
│       ├── memory-card/
│       ├── paint-tag-arena/
│       ├── tic-tac-toe-candyland/
│       ├── fruit-slash/
│       ├── superman-swing/
│       ├── tank-wars/
│       ├── outbound/
│       └── gravity-run/
├── DEPLOYMENT.md           → Static hosting and cloud deployment guide
├── FIREBASE_SETUP.md       → Firebase Authentication & Firestore configuration guide
└── serve.json              → Local static server configuration (clean routing)
```

---

## 💻 Local Development & Quick Start

Arcadia has no mandatory build step — it runs directly in any modern web browser.

### Option 1: Using `serve` (Recommended)
```bash
# Install serve if not already present
npm install -g serve

# Serve the public directory
serve public -p 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Using Python
```bash
# Python 3
python -m http.server 8000 --directory public
```
Then visit [http://localhost:8000](http://localhost:8000).

---

## ☁️ Firebase Configuration

Arcadia works completely out of the box in guest mode without Firebase. To enable cloud accounts, cross-device progression sync, and global leaderboards:

1. Create a free project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Email/Password** under Authentication.
3. Enable **Cloud Firestore** in production mode.
4. Add the recommended security rules from [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md).
5. Copy your Firebase web app config into `js/firebase-config.js` (and `public/js/firebase-config.js`).

---

## 🔒 Security & Privacy

- **Client-Side Secret Isolation:** No private API keys or service account credentials are used in the client code.
- **Owner-Scoped Firestore Security Rules:** Progression documents (`/progression/{userId}`) and user records (`/users/{userId}`) are protected with owner-only access rules (`request.auth.uid == userId`).
- **High-Water Mark Validation:** Score and progression uploads validate payload structures, preventing negative score injections or level demotions.

---

## 📄 License

This project is open-source under the MIT License.
