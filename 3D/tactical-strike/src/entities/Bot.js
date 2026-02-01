import * as THREE from 'three';
import Materials from '../world/Materials.js';

class Bot {
    constructor(scene, physics, team, position) {
        this.scene = scene;
        this.physics = physics;
        this.team = team; // 'allies' or 'enemies'

        this.health = 100;
        this.alive = true;

        this.mesh = this.createBotMesh();
        this.mesh.botReference = this;
        this.scene.add(this.mesh);

        this.body = this.physics.createCapsule(0.4, 1.0, position);

        this.target = null;
        this.moveSpeed = 0.1;
        this.state = 'patrol'; // patrol, chase, shoot
        this.lastActionTime = 0;
    }

    createBotMesh() {
        const group = new THREE.Group();
        const baseColor = this.team === 'allies' ? 0x224488 : 0x882222;
        const mat = Materials.getMilitaristicMaterial(baseColor);
        const darkMat = Materials.getMilitaristicMaterial(0x111111);

        // Body
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 1.0),
            mat
        );
        group.add(body);

        // Tactical Vest
        const vest = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.6),
            darkMat
        );
        vest.position.y = 0.1;
        group.add(vest);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.3, 0.4),
            darkMat
        );
        head.position.y = 0.8;
        head.position.z = -0.1;
        group.add(head);

        return group;
    }

    update(player, dt) {
        if (!this.alive) return;

        const translation = this.body.translation();
        this.mesh.position.set(translation.x, translation.y, translation.z);

        // Simple AI Logic: Move towards player if within range
        const dist = player.yaw.position.distanceTo(this.mesh.position);

        if (dist < 15 && dist > 2) {
            this.state = 'chase';
            this.moveTowards(player.yaw.position);
        } else if (dist <= 2) {
            this.state = 'shoot';
            this.body.setLinvel({ x: 0, y: this.body.linvel().y, z: 0 }, true);
            this.lookAt(player.yaw.position);
        } else {
            this.state = 'patrol';
            // Placeholder for patrol behavior
        }
    }

    moveTowards(targetPos) {
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
        dir.y = 0;
        dir.normalize();

        const linvel = this.body.linvel();
        this.body.setLinvel({
            x: (dir.x * this.moveSpeed) / 0.016,
            y: linvel.y,
            z: (dir.z * this.moveSpeed) / 0.016
        }, true);

        this.lookAt(targetPos);
    }

    lookAt(targetPos) {
        const angle = Math.atan2(targetPos.x - this.mesh.position.x, targetPos.z - this.mesh.position.z);
        this.mesh.rotation.y = angle + Math.PI;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.mesh.rotation.x = Math.PI / 2; // Fall over
        this.body.setEnabled(false);
    }
}

export default Bot;
