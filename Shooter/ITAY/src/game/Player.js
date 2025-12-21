// Player Entity

import { CONFIG } from '../config.js';
import { clamp } from '../utils/helpers.js';
import { assets } from './AssetManager.js';

export class Player {
    constructor(uid, x, y, color = '#8338ec') {
        this.uid = uid;
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.color = color;

        // Stats
        this.hp = CONFIG.PLAYER.BASE_HP;
        this.maxHp = CONFIG.PLAYER.BASE_HP;
        this.score = 0;
        this.kills = { small: 0, medium: 0, large: 0 };
        this.damageTaken = 0;

        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = CONFIG.PLAYER.BASE_SPEED;
        this.angle = 0; // Visual rotation angle

        // Shooting
        this.fireRate = CONFIG.PLAYER.BASE_FIRE_RATE;
        this.lastShotTime = 0;
        this.damage = CONFIG.PLAYER.BASE_DAMAGE;

        // Input
        this.inputs = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
        };
    }

    applyUpgrades(upgrades) {
        if (!upgrades) return;
        if (upgrades.fireRateLevel) this.fireRate = CONFIG.UPGRADES.FIRE_RATE.effect(upgrades.fireRateLevel);
        if (upgrades.damageLevel) this.damage = CONFIG.UPGRADES.DAMAGE.effect(upgrades.damageLevel);
        if (upgrades.hpLevel) {
            const newMaxHp = CONFIG.UPGRADES.HP.effect(upgrades.hpLevel);
            const ratio = this.hp / this.maxHp;
            this.maxHp = newMaxHp;
            this.hp = Math.floor(newMaxHp * ratio);
        }
        if (upgrades.speedLevel) this.speed = CONFIG.UPGRADES.SPEED.effect(upgrades.speedLevel);
    }

    canShoot(currentTime) {
        return currentTime - this.lastShotTime >= this.fireRate;
    }

    isDead() {
        return this.hp <= 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.damageTaken += amount;
        if (this.hp < 0) this.hp = 0;
    }

    collidesWith(x, y, width, height) {
        const hitPadding = 5;
        return (
            this.x + hitPadding < x + width &&
            this.x + this.width - hitPadding > x &&
            this.y + hitPadding < y + height &&
            this.y + this.height - hitPadding > y
        );
    }

    update() {
        let moveX = 0;
        let moveY = 0;

        if (this.inputs.up) moveY -= 1;
        if (this.inputs.down) moveY += 1;
        if (this.inputs.left) moveX -= 1;
        if (this.inputs.right) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;

            this.velocityX = moveX * this.speed;
            this.velocityY = moveY * this.speed;

            // Face direction of movement
            this.angle = Math.atan2(moveY, moveX) + Math.PI / 2;
        } else {
            this.velocityX *= 0.9;
            this.velocityY *= 0.9;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        this.x = clamp(this.x, 0, CONFIG.WORLD_WIDTH);
        this.y = clamp(this.y, 0, CONFIG.WORLD_HEIGHT);
    }

    render(ctx) {
        const img = assets.get('spaceship');
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (img) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 35;
            ctx.filter = 'brightness(1.2) contrast(1.1)';
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();

        this.renderHUD(ctx);
    }

    renderHUD(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const barY = this.y - 45;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        const healthPercent = this.hp / this.maxHp;
        if (healthPercent > 0.6) ctx.fillStyle = '#06ffa5';
        else if (healthPercent > 0.3) ctx.fillStyle = '#ffbe0b';
        else ctx.fillStyle = '#ff006e';

        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.hp)}`, this.x, barY - 5);
    }
}
