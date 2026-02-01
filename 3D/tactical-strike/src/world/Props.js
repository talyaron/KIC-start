import * as THREE from 'three';

class Props {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
    }

    createLadder(pos, height) {
        const group = new THREE.Group();
        const rungs = Math.floor(height / 0.3);

        for (let i = 0; i < rungs; i++) {
            const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6);
            const rungMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
            const rung = new THREE.Mesh(rungGeo, rungMat);
            rung.rotation.z = Math.PI / 2;
            rung.position.y = i * 0.3;
            group.add(rung);
        }

        const railGeo = new THREE.CylinderGeometry(0.03, 0.03, height);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const railL = new THREE.Mesh(railGeo, railMat);
        railL.position.set(-0.3, height / 2 - 0.15, 0);
        group.add(railL);

        const railR = new THREE.Mesh(railGeo, railMat);
        railR.position.set(0.3, height / 2 - 0.15, 0);
        group.add(railR);

        group.position.set(pos.x, pos.y, pos.z);
        this.scene.add(group);

        // Ladder "hitbox" for climbing detection (sensor)
        // We'll use a simple proximity check in the player update, 
        // but let's add a visual for now.
    }

    createCrate(pos, size = 1) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4B5320, // Olive Drab
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.physics.createBox(size, size, size, pos, 'fixed');
    }
}

export default Props;
