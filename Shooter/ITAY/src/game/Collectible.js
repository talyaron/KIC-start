// Collectible item class
import { CONFIG } from '../config.js';
import { assets } from './AssetManager.js';

export class Collectible {
    constructor(type, x, y) {
        const stats = CONFIG.COLLECTIBLES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = stats.size;
        this.height = stats.size;
        this.active = true;
        this.rotation = 0;
        this.rotationSpeed = 0.03;
    }

    update() {
        this.rotation += this.rotationSpeed;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // High visibility glow
        ctx.shadowColor = '#ffbe0b'; // Amber/Gold glow
        ctx.shadowBlur = 20;

        // Draw Wrench (Vector shape for zero-border perfection)
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#e2e8f0'; // Bright silver/white body

        // Wrench Main Shaft
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();

        // Top Head (Open end)
        ctx.beginPath();
        ctx.arc(-20, 0, 12, 0.5, 5.8);
        ctx.stroke();

        // Bottom Head (Box end)
        ctx.beginPath();
        ctx.arc(20, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Inner detail for box end
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(20, 0, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
