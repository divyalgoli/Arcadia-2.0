/**
 * Fruit Slash - Web Audio API Satisfying Audio Synthesizer
 */

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

    // Build one reusable white-noise buffer up front. Regenerating a fresh
    // buffer (sampleRate * duration samples, filled sample-by-sample) on every
    // single slash was the biggest source of stutter during fast swipes —
    // now we just reuse this buffer and trim playback length/offset per sound.
    buildNoiseBuffer() {
        const duration = 0.2; // long enough to cover slash (0.12s) and slice (0.15s) sounds
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

    // Smooth, realistic blade whoosh sound (filtered noise swoop)
    playSlash() {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx || !this.noiseBuffer) return;

        // Throttle: fast swipes can fire this many times per second, and
        // spinning up a full audio graph (buffer source + filter + gain) for
        // every single one is what caused the stutter — cap it to a rate
        // that still sounds continuous but stops flooding the audio thread.
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

    // Satisfying, juicy, crunch-squish fruit slice sound
    playSlice(isRare = false) {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Layer 1: Blade cut impact thud (low sine pulse)
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

        // Layer 2: Juicy squish splash (filtered noise snap)
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

        // Layer 3: Rare fruit chime sparkle
        if (isRare) {
            const chime = this.ctx.createOscillator();
            const chimeGain = this.ctx.createGain();
            chime.type = 'triangle';
            chime.frequency.setValueAtTime(987.77, now); // B5
            chime.frequency.setValueAtTime(1318.51, now + 0.08); // E6

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

        const notes = [
            261.63, 329.63, 392.00, 523.25,
            349.23, 440.00, 523.25, 698.46,
            392.00, 493.88, 587.33, 783.99,
            261.63, 329.63, 392.00, 523.25
        ];

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

export const AUDIO = new AudioManager();
