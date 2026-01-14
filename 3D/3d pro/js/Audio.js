import * as THREE from 'three';

export class AudioController {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.sounds = {};
        this.enabled = true;

        // Load sounds (Simulated with oscillator for now to avoid needing external assets immediately, 
        // OR placeholder logic if real files aren't provided)
        // Since I cannot create .mp3 files, I will use browser synthetic audio (Web Audio API) wrapped cleanly.
        // Actually, THREE.Audio usually requires loading a buffer. 
        // For a quick agentic demo without assets, I will create a simple synth helper.
    }

    playSound(type) {
        if (!this.enabled) return;

        // Creating a temporary oscillator for immediate feedback without assets
        const ctx = this.listener.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'shoot') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'explode') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'music') {
            // Placeholder for music logic
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
