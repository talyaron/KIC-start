import * as THREE from 'three';

class Materials {
    static getWallMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1,
            bumpScale: 0.02
        });
    }

    static getGroundMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3, // Slightly wet look
            metalness: 0.2
        });
    }

    static getMilitaristicMaterial(color = 0x4B5320) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.5
        });
    }
}

export default Materials;
