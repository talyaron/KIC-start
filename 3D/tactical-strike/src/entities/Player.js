import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import Weapon from '../mechanics/Weapon.js';

class Player {
    constructor(scene, physics, camera) {
        this.scene = scene;
        this.physics = physics;
        this.camera = camera;

        this.radius = 0.4;
        this.height = 1.0;
        this.pos = new THREE.Vector3(0, 5, 0);

        this.body = this.physics.createCapsule(this.radius, this.height, this.pos);

        // Pitch/Yaw setup
        this.pitch = new THREE.Object3D();
        this.yaw = new THREE.Object3D();
        this.yaw.add(this.pitch);
        this.scene.add(this.yaw);
        this.pitch.add(this.camera);

        this.camera.position.set(0, 0.6, 0);

        this.weapon = new Weapon(this.scene, this.camera);
        this.raycaster = new THREE.Raycaster();

        this.moveSpeed = 0.15;
        this.lookSensitivity = 0.002;

        this.setupPointerLock();
    }

    setupPointerLock() {
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.yaw.rotation.y -= e.movementX * this.lookSensitivity;
                this.pitch.rotation.x -= e.movementY * this.lookSensitivity;
                this.pitch.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch.rotation.x));
            }
        });
    }

    update(input) {
        const translation = this.body.translation();
        this.yaw.position.set(translation.x, translation.y + 0.5, translation.z);

        const moveVector = new THREE.Vector3(0, 0, 0);
        if (input.isPressed('KeyW')) moveVector.z -= 1;
        if (input.isPressed('KeyS')) moveVector.z += 1;
        if (input.isPressed('KeyA')) moveVector.x -= 1;
        if (input.isPressed('KeyD')) moveVector.x += 1;

        moveVector.normalize().multiplyScalar(this.moveSpeed).applyQuaternion(this.yaw.quaternion);

        const linvel = this.body.linvel();

        // Jump logic
        let vy = linvel.y;
        if (input.isPressed('Space') && Math.abs(vy) < 0.1) {
            vy = 5;
        }

        // Ladder logic (simplified proximity check)
        // In a real game we'd use physics sensors, but for now:
        const isNearLadder = translation.y < 6 && translation.x > -1.5 && translation.x < -0.9 && translation.z > -2.5 && translation.z < -1.5;
        if (isNearLadder && input.isPressed('KeyW')) {
            vy = 2;
        }

        this.body.setLinvel({ x: moveVector.x / 0.016, y: vy, z: moveVector.z / 0.016 }, true);

        if (input.isMouseDown(0)) {
            this.weapon.shoot(this.raycaster, this.scene);
        }
    }
}

export default Player;
