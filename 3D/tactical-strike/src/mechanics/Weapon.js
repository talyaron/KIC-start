import * as THREE from 'three';
import Materials from '../world/Materials.js';

class Weapon {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = this.createPlaceholderMesh();
        this.camera.add(this.mesh);

        // Weapon stats (CS:GO style)
        this.recoil = 0.02;
        this.fireRate = 0.1; // seconds
        this.lastFireTime = 0;
        this.ammo = 30;
        this.maxAmmo = 30;

        // Sway
        this.swayAmount = 0.01;
        this.targetPos = new THREE.Vector3(0.3, -0.3, -0.5);
    }

    createPlaceholderMesh() {
        const group = new THREE.Group();
        const mat = Materials.getMilitaristicMaterial(0x222222);

        // Barrel
        const barrel = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.6),
            mat
        );
        barrel.position.set(0.3, -0.3, -0.6);
        group.add(barrel);

        // Frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.15, 0.3),
            mat
        );
        frame.position.set(0.3, -0.35, -0.3);
        group.add(frame);

        return group;
    }

    shoot(raycaster, scene) {
        const now = performance.now() / 1000;
        if (now - this.lastFireTime < this.fireRate) return;
        if (this.ammo <= 0) return;

        this.lastFireTime = now;
        this.ammo--;

        // Raycasting for hits
        raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            console.log("Hit:", hit.name || "World");

            // Check for bot hits
            let parent = hit.parent;
            while (parent) {
                if (parent.botReference) {
                    parent.botReference.takeDamage(25);
                    break;
                }
                parent = parent.parent;
            }

            this.createImpactEffect(intersects[0].point);
        }

        // Visual recoil
        this.mesh.position.z += 0.05;
        setTimeout(() => this.mesh.position.z -= 0.05, 50);
    }

    createImpactEffect(point) {
        const geo = new THREE.SphereGeometry(0.02);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(point);
        this.scene.add(mesh);
        setTimeout(() => this.scene.remove(mesh), 500);
    }

    update(time) {
        // Basic sway logic could go here
    }
}

export default Weapon;
