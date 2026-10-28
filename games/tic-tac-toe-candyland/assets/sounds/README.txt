All sound effects (place, win, draw, combo) and background music currently
play as generated tones via the Web Audio API — see js/audio.js. No mp3
files are required for the game to have full sound.

If you'd like real recorded sounds instead, drop mp3 files here
(place.mp3, win.mp3, draw.mp3, click.mp3, countdown.mp3, background.mp3)
and update audio.js to play them with the <audio> element / Audio() API
instead of (or alongside) the generated tones.
