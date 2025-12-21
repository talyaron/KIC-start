// Enemy Spawner Module
import { Enemy } from './Enemy.js';
import { CONFIG } from '../config.js';
import { seededRandom } from '../utils/helpers.js';

export class EnemySpawner {
    constructor(seed, worldWidth) {
        this.seed = seed;
        this.worldWidth = worldWidth;
        this.random = seededRandom(seed);
        this.lastSpawnTime = 0;
        this.difficulty = CONFIG.SPAWN.INITIAL_DIFFICULTY;
    }

    getRandomEnemyType() {
        const types = Object.keys(CONFIG.ENEMIES);
        const weights = types.map(type => CONFIG.ENEMIES[type].spawnWeight);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        let r = this.random() * totalWeight;
        for (let i = 0; i < types.length; i++) {
            r -= weights[i];
            if (r <= 0) return types[i];
        }
        return types[0];
    }

    updateDifficulty(gameStartTime) {
        const elapsed = (Date.now() - gameStartTime) / 1000;
        this.difficulty = CONFIG.SPAWN.INITIAL_DIFFICULTY + (Math.floor(elapsed / 10) * CONFIG.SPAWN.DIFFICULTY_INCREASE_RATE);
    }

    /**
     * Spawn enemies in a radius around a center point (usually the player)
     */
    spawnAround(enemies, currentTime, centerX, centerY) {
        if (currentTime - this.lastSpawnTime < CONFIG.SPAWN.INTERVAL / this.difficulty) {
            return;
        }

        if (enemies.filter(e => e.active).length >= CONFIG.SPAWN.MAX_ENEMIES) {
            return;
        }

        this.lastSpawnTime = currentTime;

        // Choose spawn location on a large circle around player
        const spawnRadius = 800; // Just off screen
        const angle = this.random() * Math.PI * 2;

        const spawnX = centerX + Math.cos(angle) * spawnRadius;
        const spawnY = centerY + Math.sin(angle) * spawnRadius;

        // Direction: towards player with some randomness
        const targetAngle = Math.atan2(centerY - spawnY, centerX - spawnX) + (this.random() - 0.5) * 0.5;

        const type = this.getRandomEnemyType();
        const enemy = new Enemy(type, spawnX, spawnY, targetAngle);

        enemies.push(enemy);
    }
}
