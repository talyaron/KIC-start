// Enemy Spawner Module
import { Enemy } from './Enemy.js';
import { Collectible } from './Collectible.js';
import { CONFIG } from '../config.js';
import { seededRandom } from '../utils/helpers.js';

export class EnemySpawner {
    constructor(seed, worldWidth) {
        this.seed = seed;
        this.worldWidth = worldWidth;
        this.random = seededRandom(seed);
        this.lastSpawnTime = 0;
        this.lastCollectibleSpawnTime = 0;
        this.gameStartTime = Date.now();
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

    updateDifficulty() {
        const elapsed = (Date.now() - this.gameStartTime) / 1000;
        this.difficulty = CONFIG.SPAWN.INITIAL_DIFFICULTY + (Math.floor(elapsed / 10) * CONFIG.SPAWN.DIFFICULTY_INCREASE_RATE);
    }

    /**
     * Spawn enemies and collectibles in a radius around a center point
     */
    spawnAround(enemies, collectibles, currentTime, centerX, centerY) {
        this.updateDifficulty();

        // Spawn Enemies
        if (currentTime - this.lastSpawnTime >= CONFIG.SPAWN.INTERVAL / this.difficulty) {
            if (enemies.filter(e => e.active).length < CONFIG.SPAWN.MAX_ENEMIES) {
                this.lastSpawnTime = currentTime;

                const spawnRadius = 1000;
                const angle = this.random() * Math.PI * 2;
                const spawnX = centerX + Math.cos(angle) * spawnRadius;
                const spawnY = centerY + Math.sin(angle) * spawnRadius;

                // Move generally towards center but with spread
                const targetAngle = Math.atan2(centerY - spawnY, centerX - spawnX) + (this.random() - 0.5) * 0.8;

                const type = this.getRandomEnemyType();
                enemies.push(new Enemy(type, spawnX, spawnY, targetAngle));
            }
        }

        // Spawn Collectibles (Wrenches)
        if (currentTime - this.lastCollectibleSpawnTime > 10000) {
            this.lastCollectibleSpawnTime = currentTime;

            const roll = this.random() * 100;
            if (roll < CONFIG.COLLECTIBLES.WRENCH.spawnWeight) {
                const angle = this.random() * Math.PI * 2;
                const radius = 400 + this.random() * 400; // Closer to player
                const sx = centerX + Math.cos(angle) * radius;
                const sy = centerY + Math.sin(angle) * radius;

                collectibles.push(new Collectible('WRENCH', sx, sy));
            }
        }
    }
}
