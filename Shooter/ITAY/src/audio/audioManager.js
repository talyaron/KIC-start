// Audio Manager Module

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.muted = false;

        this.initializeSounds();
    }

    initializeSounds() {
        // Using Web Audio API to generate simple beep sounds
        // In production, replace with actual audio files

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound
     */
    play(soundName) {
        if (this.muted) return;

        switch (soundName) {
            case 'shoot':
                this.playShootSound();
                break;
            case 'enemyHit':
                this.playEnemyHitSound();
                break;
            case 'playerHit':
                this.playPlayerHitSound();
                break;
            case 'countdown':
                this.playCountdownBeep();
                break;
            case 'go':
                this.playGoSound();
                break;
            case 'gameOver':
                this.playGameOverSound();
                break;
            default:
                console.warn('Unknown sound:', soundName);
        }
    }

    playShootSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';

        gain.gain.setValueAtTime(this.sfxVolume * 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }

    playEnemyHitSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = 400;
        oscillator.type = 'sawtooth';

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    playPlayerHitSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = 200;
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }

    playCountdownBeep() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = 600;
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(this.sfxVolume * 0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }

    playGoSound() {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(this.sfxVolume * 0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    }

    playGameOverSound() {
        const ctx = this.audioContext;

        // Create a descending tone
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
    }

    /**
     * Start background music (placeholder - would use actual audio file)
     */
    startMusic() {
        // In production, load and play actual background music file
        console.log('Background music would start here');
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    /**
     * Set volume
     * @param {number} musicVol - Music volume (0-1)
     * @param {number} sfxVol - SFX volume (0-1)
     */
    setVolume(musicVol, sfxVol) {
        this.musicVolume = musicVol;
        this.sfxVolume = sfxVol;

        if (this.music) {
            this.music.volume = musicVol;
        }
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

// Export singleton instance
export const audioManager = new AudioManager();
