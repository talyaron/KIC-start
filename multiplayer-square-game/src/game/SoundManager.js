import { Howl } from 'howler';

// Note: You need to add these files to public/assets/ or replace with valid URLs
// For MVP, we'll use some free online placeholders or just comment them out if they strictly fail.
// Howler won't crash if file missing, just 404 in console.

const sounds = {
    shoot: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], // Laser
        volume: 0.5
    }),
    explosion: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'], // Explosion
        volume: 0.5
    }),
    bgm: new Howl({
        src: ['https://assets.mixkit.co/active_storage/sfx/138/138-preview.mp3'], // Ambient (Placeholder)
        loop: true,
        volume: 0.3
    })
};

export const playSound = (name) => {
    if (sounds[name]) {
        sounds[name].play();
    }
};

export const stopSound = (name) => {
    if (sounds[name]) {
        sounds[name].stop();
    }
};
