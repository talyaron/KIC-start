// Game Configuration Constants

export const CONFIG = {
    // World Dimensions (for 360 movement)
    WORLD_WIDTH: 5000,
    WORLD_HEIGHT: 5000,

    // Screen Dimensions (Internal resolution)
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,

    // Player Settings
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 50,
        BASE_HP: 100,
        BASE_SPEED: 7,
        BASE_FIRE_RATE: 250, // ms between shots
        BASE_DAMAGE: 20,
    },

    // Enemy Settings (Asteroids)
    ENEMIES: {
        SMALL: {
            type: 'small',
            category: 'small',
            color: '#ff006e', // Crimson
            damage: 10,
            score: 10,
            size: 90,
            speed: 1.5,
            spawnWeight: 60,
        },
        MEDIUM: {
            type: 'medium',
            category: 'medium',
            color: '#ffbe0b', // Amber
            damage: 25,
            score: 25,
            size: 110,
            speed: 2,
            spawnWeight: 30,
        },
        LARGE: {
            type: 'large',
            category: 'large',
            color: '#3a86ff', // Azure
            damage: 50,
            score: 100,
            size: 150,
            speed: 4,
            spawnWeight: 10,
        },
    },

    // Spawning
    SPAWN: {
        INTERVAL: 700, // Even faster for challenge
        MAX_ENEMIES: 50,
        INITIAL_DIFFICULTY: 1.2,
        DIFFICULTY_INCREASE_RATE: 0.2,
        SPAWN_RADIUS: 1000,
    },

    // Collectibles
    COLLECTIBLES: {
        WRENCH: {
            type: 'WRENCH',
            size: 60,
            healAmount: 25,
            spawnWeight: 25, // ~40 second frequency with 10s checks
            spawnCooldown: 30000,
        }
    },

    // Bullet Settings
    BULLET: {
        WIDTH: 8,
        HEIGHT: 20,
        SPEED: 15,
        COLOR: '#06ffa5',
    },

    // Upgrades
    UPGRADES: {
        FIRE_RATE: { baseCost: 100, maxLevel: 10, effect: (level) => Math.max(100, 300 - (level * 20)), costMultiplier: 1.5 },
        DAMAGE: { baseCost: 150, maxLevel: 10, effect: (level) => 20 + (level * 5), costMultiplier: 1.6 },
        HP: { baseCost: 200, maxLevel: 10, effect: (level) => 100 + (level * 10), costMultiplier: 1.7 },
        SPEED: { baseCost: 120, maxLevel: 10, effect: (level) => 7 + (level * 0.5), costMultiplier: 1.4 },
    },

    // UI & Cosmetics
    COSMETICS: [
        { id: 'default', name: 'Default', color: '#8338ec', price: 0 },
        { id: 'red', name: 'Crimson', color: '#ff006e', price: 500 },
        { id: 'blue', name: 'Azure', color: '#3a86ff', price: 500 },
        { id: 'green', name: 'Emerald', color: '#06ffa5', price: 750 },
        { id: 'gold', name: 'Golden', color: '#ffbe0b', price: 1000 },
    ],

    // Countdown
    COUNTDOWN: {
        START: 5,
        INTERVAL: 1000,
    },

    // Networking
    NETWORK: {
        POSITION_UPDATE_RATE: 50, // Faster updates for 360 movement
        SCORE_UPDATE_RATE: 500,
        MAX_PLAYERS: 4,
        ROOM_CODE_LENGTH: 6,
        USER_CODE_LENGTH: 6,
    },
};
