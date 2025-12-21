// Enemy Spawner Module

import { Enemy } from './Enemy.js';
import { CONFIG } from '../config.js';
import { seededRandom } from '../utils/helpers.js';

export class EnemySpawner {
    constructor(seed, canvasWidth) {
        this.seed = seed;
        this.canvasWidth = canvasWidth;
        this.random = seededRandom(seed);
        this.lastSpawnTime = 0;
        this.difficulty = CONFIG.SPAWN.INITIAL_DIFFICULTY;
        this.gameStartTime = Date.now();
        this.spawnCounter = 0; // Incremental counter for spawn IDs
    }

    /**
     * Get enemy type based on spawn weights
     * @returns {string} Enemy type
     */
    getRandomEnemyType() {
        const types = Object.keys(CONFIG.ENEMIES);
        const weights = types.map(type => CONFIG.ENEMIES[type].spawnWeight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        let randomValue = this.random() * totalWeight;

        for (let i = 0; i < types.length; i++) {
            randomValue -= weights[i];
            if (randomValue <= 0) {
                return types[i];
            }
        }

        return types[0]; // Fallback
    }

    /**
     * Update difficulty based on time
     */
    updateDifficulty() {
        const elapsedSeconds = (Date.now() - this.gameStartTime) / 1000;
        this.difficulty = CONFIG.SPAWN.INITIAL_DIFFICULTY + (Math.floor(elapsedSeconds / 10) * CONFIG.SPAWN.DIFFICULTY_INCREASE_RATE);
    }

    /**
     * Spawn enemies
     * @param {Array} enemies - Current enemies array
     * @param {number} currentTime - Current timestamp
     * @param {number} playerCount - Number of players for scaling
     * @param {number} matchStartTime - Timestamp when match actually started
     */
    spawn(enemies, currentTime, playerCount = 1, matchStartTime = null) {
        // Apply 25% increase per additional player
        const playerScale = 1 + (Math.max(0, playerCount - 1) * 0.25);
        const scaledInterval = CONFIG.SPAWN.INTERVAL / (this.difficulty * playerScale);

        if (currentTime - this.lastSpawnTime < scaledInterval) {
            return;
        }

        if (enemies.filter(e => e.active).length >= CONFIG.SPAWN.MAX_ENEMIES) {
            return;
        }

        // Update difficulty
        this.updateDifficulty();

        // Spawn new enemy
        const type = this.getRandomEnemyType();
        const x = this.random() * (this.canvasWidth - CONFIG.ENEMIES[type].size);

        // Generate a STABLE spawnId based on the time slot of the match
        // This allows late-joiners to identify the same enemies accurately.
        const startTime = matchStartTime || this.gameStartTime;
        const timeSlot = Math.floor((currentTime - startTime) / 100); // 100ms precision
        const spawnId = `enemy_${this.seed}_${timeSlot}_${Math.floor(x)}`;

        const enemy = new Enemy(type, x, -CONFIG.ENEMIES[type].size);
        enemy.spawnId = spawnId;

        enemies.push(enemy);
        this.lastSpawnTime = currentTime;
    }
}
