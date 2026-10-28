# 🍭 Candy Land Tic Tac Toe

A colorful, kid-friendly Tic Tac Toe game with a Candy Land theme —
built with plain HTML, CSS, and JavaScript (no build tools, no dependencies).

## Features
- 🍭 vs 🍬 symbols instead of X/O
- Single player (vs computer with Easy / Medium / Hard AI) or Two Player mode
- Minimax-based computer opponent
- Pastel candy visuals, wobble/spin/pop animations, sparkling win-line
- Confetti burst + win streak tracking (best streak saved locally)
- Sound effects & music generated via the Web Audio API — works out of the box,
  no audio files needed (see assets/sounds/README.txt to swap in real mp3s)
- Fully responsive (mobile-first)

## How to run
Just open `index.html` in a browser — no server or build step required.
For best results (Web Audio autoplay policies), interact with a button once
(e.g. tap "Start Game") to enable sound.

## File structure
```
tic-tac-toe-candyland/
├── index.html        # Home page — mode & difficulty select
├── game.html          # Game board screen
├── result.html        # Winner / draw screen
├── css/                # Styles (theme tokens, board, result, animations, responsive)
├── js/                  # Game logic (board, moves, win-check, AI, scoring, audio, effects...)
└── assets/               # Icons (svg) + optional folders for custom symbols/backgrounds/sounds
```

## Customizing
- Change symbols: edit `SYMBOLS` in `js/player.js`
- Change palette: edit CSS variables at the top of `css/style.css`
- Swap emoji for real art / real audio: see the README.txt notes inside
  `assets/symbols/`, `assets/backgrounds/`, `assets/particles/`, `assets/sounds/`

## License
MIT — see LICENSE.
