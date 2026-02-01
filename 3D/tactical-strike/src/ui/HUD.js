import * as THREE from 'three';

class HUD {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute; bottom: 20px; left: 20px;
            color: #0f0; font-family: monospace; font-size: 24px;
            text-shadow: 2px 2px #000; pointer-events: none;
        `;
        document.body.appendChild(this.container);

        this.healthLabel = document.createElement('div');
        this.ammoLabel = document.createElement('div');
        this.container.appendChild(this.healthLabel);
        this.container.appendChild(this.ammoLabel);

        this.crosshair = document.createElement('div');
        this.crosshair.style.cssText = `
            position: absolute; top: 50%; left: 50%;
            width: 20px; height: 20px;
            border: 2px solid #0f0; border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        document.body.appendChild(this.crosshair);

        this.update(100, 30);
    }

    update(health, ammo) {
        this.healthLabel.textContent = `HP: ${health}`;
        this.ammoLabel.textContent = `AMMO: ${ammo}`;
    }
}

export default HUD;
