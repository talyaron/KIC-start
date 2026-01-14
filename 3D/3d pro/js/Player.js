import * as THREE from 'three';
import { lerp } from './Utils.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.targetX = 0;
        this.currentX = 0;
        this.tilt = 0;

        // Model: Simple Low-Poly Spaceship
        // Body
        const bodyGeo = new THREE.ConeGeometry(0.5, 2, 4);
        bodyGeo.rotateX(Math.PI / 2); // Point forward
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.2,
            metalness: 0.8
        });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);

        // Engine Glow
        const engineGeo = new THREE.CylinderGeometry(0.2, 0, 0.5, 8);
        engineGeo.rotateX(Math.PI / 2);
        engineGeo.translate(0, 0, 1);
        const engineMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 2
        });
        this.engine = new THREE.Mesh(engineGeo, engineMat);

        // Wings
        const wingGeo = new THREE.BoxGeometry(2, 0.1, 0.8);
        wingGeo.translate(0, 0, 0.2);
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.5
        });
        this.wings = new THREE.Mesh(wingGeo, wingMat);

        this.mesh.add(this.body);
        this.mesh.add(this.engine);
        this.mesh.add(this.wings);

        this.mesh.position.y = 1;
        this.scene.add(this.mesh);

        // Collision Helper
        this.box = new THREE.Box3();
        this.boxHelper = new THREE.Box3Helper(this.box, 0xffff00);
        this.boxHelper.visible = false; // Debug
        this.scene.add(this.boxHelper);

        // Bullets
        this.bullets = [];
        this.bulletGeo = new THREE.BoxGeometry(0.1, 0.1, 1);
        this.bulletMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        // Bobbing
        this.time = 0;
    }

    update(dt, inputX) {
        this.time += dt * 2;
        // Smooth movement
        this.targetX = inputX * 8; // Limit range
        this.currentX = lerp(this.currentX, this.targetX, dt * 10);

        this.mesh.position.x = this.currentX;
        // Bobbing effect
        this.mesh.position.y = 1 + Math.sin(this.time) * 0.1;

        // Tilt effect
        const tiltTarget = (this.currentX - this.targetX) * 0.5;
        this.tilt = lerp(this.tilt, tiltTarget, dt * 5);
        this.mesh.rotation.z = this.tilt; // Roll
        this.mesh.rotation.y = -this.tilt * 0.5; // Yaw slightly

        // Update Physics Box
        this.box.setFromObject(this.mesh);
        // Shrink collision box slightly for forgiving gameplay
        this.box.expandByScalar(-0.2);

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.position.z -= 80 * dt; // Speed

            if (b.position.z < -100) {
                this.scene.remove(b);
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot() {
        // Create Bullet
        const bullet = new THREE.Mesh(this.bulletGeo, this.bulletMat);
        bullet.position.copy(this.mesh.position);
        bullet.position.y -= 0.2; // Underslung
        this.scene.add(bullet);
        this.bullets.push(bullet);
        return true; // Fired
    }

    reset() {
        this.currentX = 0;
        this.targetX = 0;
        this.tilt = 0;
        this.mesh.position.x = 0;
        this.bullets.forEach(b => this.scene.remove(b));
        this.bullets = [];
    }
}
