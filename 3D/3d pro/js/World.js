import * as THREE from 'three';
import { randomRange } from './Utils.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.speed = 20;
        this.distance = 0;

        // --- Infinite Grid ---
        // We create two large grids to leapfrog
        const gridHelper1 = new THREE.GridHelper(200, 100, 0xff00ff, 0x220033);
        const gridHelper2 = new THREE.GridHelper(200, 100, 0xff00ff, 0x220033);
        gridHelper1.position.z = -50;
        gridHelper2.position.z = -250;
        this.scene.add(gridHelper1);
        this.scene.add(gridHelper2);
        this.grids = [gridHelper1, gridHelper2];

        // --- Starfield Particles ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 1000;
        const posArray = new Float32Array(starsCount * 3);
        const velocities = [];

        for (let i = 0; i < starsCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 100; // x
            posArray[i + 1] = (Math.random() - 0.5) * 50 + 20; // y (sky)
            posArray[i + 2] = (Math.random() - 0.5) * 200 - 50; // z
            velocities.push(Math.random() * 0.5 + 0.1);
        }

        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });
        this.starField = new THREE.Points(starsGeo, starsMat);
        this.scene.add(this.starField);

        // --- Obstacle Pool ---
        this.poolSize = 20;
        this.objectPool = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        const geomCube = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const geomPyramid = new THREE.ConeGeometry(1, 2, 4);
        const matObstacle = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.5,
            roughness: 0
        });

        for (let i = 0; i < this.poolSize; i++) {
            let mesh;
            if (Math.random() > 0.5) {
                mesh = new THREE.Mesh(geomCube, matObstacle);
            } else {
                mesh = new THREE.Mesh(geomPyramid, matObstacle);
            }
            mesh.visible = false;
            // Add a dedicated box for simpler logic updates
            mesh.userData = {
                active: false,
                box: new THREE.Box3()
            };
            this.scene.add(mesh);
            this.objectPool.push(mesh);
        }
    }

    update(dt) {
        // Move World (Grids)
        const moveDist = this.speed * dt;
        this.distance += moveDist;

        this.grids.forEach(grid => {
            grid.position.z += moveDist;
            if (grid.position.z > 50) {
                grid.position.z -= 400; // Reset
            }
        });

        // Spawn Obstacles
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnObstacle();
            this.spawnTimer = this.spawnInterval - Math.min(this.distance * 0.0001, 1.0); // Get harder
        }

        // Move Obstacles
        this.objectPool.forEach(obj => {
            if (obj.userData.active) {
                obj.position.z += moveDist;
                // Rotate for style
                obj.rotation.x += dt;
                obj.rotation.y += dt;

                // Update Collision Box
                obj.userData.box.setFromObject(obj);

                if (obj.position.z > 10) { // Passed player
                    obj.visible = false;
                    obj.userData.active = false;
                }
            }
        });

        // Speed up
        this.speed += dt * 0.5;
    }

    spawnObstacle() {
        // Find inactive
        const obj = this.objectPool.find(o => !o.userData.active);
        if (obj) {
            obj.userData.active = true;
            obj.visible = true;
            obj.position.z = -100;
            obj.position.x = Math.floor(randomRange(-2, 3)) * 3; // Lanes: -6, -3, 0, 3, 6
            obj.position.y = 1;
        }
    }

    checkCollisions(playerBox) {
        for (let obj of this.objectPool) {
            if (obj.userData.active) {
                if (playerBox.intersectsBox(obj.userData.box)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkBulletCollisions(bullets, particleSystem) {
        let hitCount = 0;
        // Optimization: checking all bullets vs all active obstacles
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            const bulletBox = new THREE.Box3().setFromObject(b);

            for (let obj of this.objectPool) {
                if (obj.userData.active) {
                    if (bulletBox.intersectsBox(obj.userData.box)) {
                        // HIT!
                        obj.visible = false;
                        obj.userData.active = false;
                        obj.position.z = -500; // throw far away

                        // Remove bullet
                        b.parent.remove(b);
                        bullets.splice(i, 1);

                        // FX
                        particleSystem.createExplosion(obj.position.clone());
                        hitCount++;
                        break; // Bullet used up
                    }
                }
            }
        }
        return hitCount;
    }

    reset() {
        this.speed = 20;
        this.distance = 0;
        this.objectPool.forEach(obj => {
            obj.visible = false;
            obj.userData.active = false;
        });
        this.spawnTimer = 0;
    }
}
