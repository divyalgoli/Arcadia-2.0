/**
 * Sound Manager - Handles all game sounds and background music
 * Provides methods for playing sounds and managing audio settings
 */

class SoundManager {
    constructor() {
        this.soundEnabled = this.getSoundEnabled();
        this.musicEnabled = this.getMusicEnabled();
        this.sounds = {};
        this.musicPlaying = false;   // real re-entrancy guard (was: an
                                      // always-null `backgroundMusic` field
                                      // that could never block a duplicate
                                      // start, letting loops stack up)
        this.musicTimeoutId = null;  // lets us stop the loop immediately
        this.initializeSounds();
    }

    /**
     * Initialize sound objects using Web Audio API
     * Creates synthesized sounds since we don't have external audio files
     */
    initializeSounds() {
        // Sound definitions with frequency and duration
        this.soundDefinitions = {
            flip: { frequency: 800, duration: 0.1, type: 'sine' },
            match: { frequency: 1200, duration: 0.3, type: 'sine' },
            wrongMatch: { frequency: 300, duration: 0.2, type: 'sine' },
            win: { frequency: 1000, duration: 0.5, type: 'sine' },
            background: { frequency: 440, duration: 0.5, type: 'sine' }
        };
    }

    /**
     * Get sound enabled setting from localStorage
     * @returns {boolean} Sound enabled status
     */
    getSoundEnabled() {
        const saved = localStorage.getItem('mcg_soundEnabled');
        return saved === null ? true : saved === 'true';
    }

    /**
     * Get music enabled setting from localStorage
     * @returns {boolean} Music enabled status
     */
    getMusicEnabled() {
        const saved = localStorage.getItem('mcg_musicEnabled');
        return saved === null ? true : saved === 'true';
    }

    /**
     * Set sound enabled and save to localStorage
     * @param {boolean} enabled - Enable or disable sounds
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('mcg_soundEnabled', enabled);
    }

    /**
     * Set music enabled and save to localStorage
     * @param {boolean} enabled - Enable or disable music
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        localStorage.setItem('mcg_musicEnabled', enabled);
        
        if (enabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }

    /**
     * Create and play a sound using Web Audio API
     * @param {string} type - Type of sound (flip, match, wrongMatch, win)
     * @private
     */
    createAndPlaySound(type) {
        if (!this.soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const definition = this.soundDefinitions[type];

            if (!definition) {
                console.warn(`Sound type "${type}" not found`);
                return;
            }

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = definition.frequency;
            oscillator.type = definition.type;

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + definition.duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + definition.duration);

        } catch (error) {
            console.warn('Audio playback not supported:', error);
        }
    }

    /**
     * Play card flip sound
     * Called when user flips a card
     */
    playFlipSound() {
        this.createAndPlaySound('flip');
    }

    /**
     * Play match sound
     * Called when two matching cards are found
     */
    playMatchSound() {
        this.createAndPlaySound('match');
    }

    /**
     * Play wrong match sound
     * Called when flipped cards don't match
     */
    playWrongMatchSound() {
        this.createAndPlaySound('wrongMatch');
    }

    /**
     * Play win sound
     * Called when player completes the game
     */
    playWinSound() {
        this.createAndPlaySound('win');
    }

    /**
     * Play generic sound by type
     * Main method for playing any sound
     * @param {string} type - Type of sound to play
     */
    playSound(type) {
        const validTypes = ['flip', 'match', 'wrongMatch', 'win'];
        
        if (!validTypes.includes(type)) {
            console.warn(`Invalid sound type: ${type}`);
            return;
        }

        this.createAndPlaySound(type);
    }

    /**
     * Start background ambient music
     */
    startBackgroundMusic() {
        if (!this.musicEnabled || this.musicPlaying) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicPlaying = true;
            this.createAmbientLoop(audioContext);
        } catch (error) {
            console.warn('Background music not supported:', error);
        }
    }

    /**
     * Create and loop ambient background music
     * @param {AudioContext} audioContext - Web Audio API context
     * @private
     */
    createAmbientLoop(audioContext) {
        // Create a simple looping pattern with notes
        const notes = [440, 494, 523, 587]; // A, B, C, D notes
        let noteIndex = 0;

        const playNote = () => {
            if (!this.musicEnabled || !this.musicPlaying) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = notes[noteIndex];
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);

            noteIndex = (noteIndex + 1) % notes.length;

            if (this.musicEnabled && this.musicPlaying) {
                this.musicTimeoutId = setTimeout(playNote, 1000);
            }
        };

        playNote();
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.musicTimeoutId !== null) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = null;
        }
    }

    /**
     * Toggle sound on/off
     */
    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
        return this.soundEnabled;
    }

    /**
     * Toggle music on/off
     */
    toggleMusic() {
        this.setMusicEnabled(!this.musicEnabled);
        return this.musicEnabled;
    }

    /**
     * Mute all sounds
     */
    mute() {
        this.setSoundEnabled(false);
        this.setMusicEnabled(false);
    }

    /**
     * Unmute all sounds
     */
    unmute() {
        this.setSoundEnabled(true);
        this.setMusicEnabled(true);
    }
}

// Create global instance
const soundManager = new SoundManager();
