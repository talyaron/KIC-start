// Game Configuration Constants

export const CONFIG = {
    // Canvas
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,

    // Player Settings
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 50,
        BASE_HP: 100,
        BASE_SPEED: 5,
        BASE_FIRE_RATE: 300, // ms between shots
        BASE_DAMAGE: 20,
        JUMP_FORCE: 10,
        GRAVITY: 0.5,
    },

    // Enemy Settings
    ENEMIES: {
        RED: {
            type: 'RED',
            color: '#ff006e',
            damage: 10,
            score: 5,
            size: 30,
            speed: 2,
            spawnWeight: 70, // High frequency
        },
        YELLOW: {
            type: 'YELLOW',
            color: '#ffbe0b',
            damage: 15,
            score: 10,
            size: 40,
            speed: 1.5,
            spawnWeight: 25, // Medium frequency
        },
        BLUE: {
            type: 'BLUE',
            color: '#3a86ff',
            damage: 30,
            score: 20,
            size: 50,
            speed: 1,
            spawnWeight: 5, // Low frequency (rare)
        },
    },

    // Scoring
    SCORING: {
        ENEMY_BOTTOM_PENALTY: -10, // Points lost when enemy hits bottom
    },

    // Spawning
    SPAWN: {
        INTERVAL: 1500, // ms between spawn checks
        MAX_ENEMIES: 15, // Maximum enemies on screen
        INITIAL_DIFFICULTY: 1,
        DIFFICULTY_INCREASE_RATE: 0.1, // Per 10 seconds
    },

    // Bullet Settings
    BULLET: {
        WIDTH: 6,
        HEIGHT: 15,
        SPEED: 10,
        COLOR: '#06ffa5',
    },

    // Upgrades
    UPGRADES: {
        FIRE_RATE: {
            baseCost: 100,
            maxLevel: 10,
            effect: (level) => Math.max(100, 300 - (level * 20)), // Decreases fire rate delay
            costMultiplier: 1.5,
        },
        DAMAGE: {
            baseCost: 150,
            maxLevel: 10,
            effect: (level) => 20 + (level * 5), // Increases bullet damage
            costMultiplier: 1.6,
        },
        HP: {
            baseCost: 200,
            maxLevel: 10,
            effect: (level) => 100 + (level * 10), // Increases max HP
            costMultiplier: 1.7,
        },
        SPEED: {
            baseCost: 120,
            maxLevel: 10,
            effect: (level) => 5 + (level * 0.5), // Increases movement speed
            costMultiplier: 1.4,
        },
    },

    // Cosmetics
    COSMETICS: [
        { id: 'default', name: 'Default', color: '#8338ec', price: 0 },
        { id: 'red', name: 'Crimson', color: '#ff006e', price: 500 },
        { id: 'blue', name: 'Azure', color: '#3a86ff', price: 500 },
        { id: 'green', name: 'Emerald', color: '#06ffa5', price: 750 },
        { id: 'gold', name: 'Golden', color: '#ffbe0b', price: 1000 },
        { id: 'purple', name: 'Royal', color: '#8338ec', price: 750 },
        { id: 'rainbow', name: 'Rainbow', color: 'linear-gradient', price: 2000 },
    ],

    // Missions
    MISSIONS: {
        DAILY: [
            {
                id: 'daily_kills_50',
                title: 'Enemy Slayer',
                description: 'Kill 50 enemies',
                type: 'kills',
                target: 50,
                reward: 200,
            },
            {
                id: 'daily_red_30',
                title: 'Red Hunter',
                description: 'Kill 30 red enemies',
                type: 'red_kills',
                target: 30,
                reward: 150,
            },
            {
                id: 'daily_survive_300',
                title: 'Survivor',
                description: 'Survive for 300 seconds',
                type: 'survival_time',
                target: 300,
                reward: 250,
            },
        ],
        WEEKLY: [
            {
                id: 'weekly_kills_500',
                title: 'Mass Destruction',
                description: 'Kill 500 enemies',
                type: 'kills',
                target: 500,
                reward: 1000,
            },
            {
                id: 'weekly_blue_20',
                title: 'Blue Elite',
                description: 'Kill 20 blue enemies',
                type: 'blue_kills',
                target: 20,
                reward: 800,
            },
            {
                id: 'weekly_friends_5',
                title: 'Social Butterfly',
                description: 'Play with friends 5 times',
                type: 'friend_games',
                target: 5,
                reward: 600,
            },
        ],
    },

    // Countdown
    COUNTDOWN: {
        START: 5,
        INTERVAL: 1000, // ms
    },

    // Networking
    NETWORK: {
        POSITION_UPDATE_RATE: 150, // ms (approx 6.6 updates per second)
        SCORE_UPDATE_RATE: 800,     // ms (sync score to room every 800ms)
        MAX_PLAYERS: 4,
        ROOM_CODE_LENGTH: 6,
        USER_CODE_LENGTH: 6,
    },
};
