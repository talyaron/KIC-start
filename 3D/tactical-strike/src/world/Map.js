import * as THREE from 'three';
import Props from './Props.js';
import Materials from './Materials.js';

class Map {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.props = new Props(scene, physics);
        this.createGround();
        this.createAlleyway();
    }

    createGround() {
        const size = 100;
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = Materials.getGroundMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics ground
        this.physics.createBox(size, 0.1, size, { x: 0, y: -0.05, z: 0 }, 'fixed');
    }

    createAlleyway() {
        // Main Street
        this.createWall(20, 10, 1, { x: 0, y: 5, z: -10 }); // Back wall
        this.createWall(1, 10, 20, { x: -10, y: 5, z: 0 }); // Left wall
        this.createWall(1, 10, 20, { x: 10, y: 5, z: 0 });  // Right wall

        // Inner Buildings/Alleys
        this.createWall(8, 6, 4, { x: -5, y: 3, z: -2 });  // House 1
        this.createWall(8, 6, 4, { x: 5, y: 3, z: 5 });   // House 2

        // Props & Ladders
        this.props.createLadder({ x: -1.2, y: 0, z: -2 }, 6); // To House 1 roof
        this.props.createCrate({ x: 2, y: 0.5, z: -5 });
        this.props.createCrate({ x: 2.5, y: 0.5, z: -4 });

        // Atmospheric Lights
        this.createPointLight(0xffaa66, 1.5, 10, { x: -3, y: 4, z: -5 });
        this.createPointLight(0x66aaff, 1.0, 10, { x: 5, y: 4, z: 5 });
    }

    createPointLight(color, intensity, distance, pos) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(pos.x, pos.y, pos.z);
        light.castShadow = true;
        this.scene.add(light);

        // Visual bulb
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: color })
        );
        bulb.position.set(pos.x, pos.y, pos.z);
        this.scene.add(bulb);
    }

    createWall(w, h, d, pos) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = Materials.getWallMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.physics.createBox(w, h, d, pos, 'fixed');
    }
}

export default Map;
