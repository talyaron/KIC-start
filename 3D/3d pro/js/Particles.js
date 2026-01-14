export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        // Reusable geometry for performance
        this.geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    }

    createExplosion(position, count = 10, color = 0xffaa00) {
        const explosionMat = new THREE.MeshBasicMaterial({ color: color });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.geom, explosionMat);
            mesh.position.copy(position);

            // Random direction
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            this.scene.add(mesh);
            this.particles.push({ mesh, velocity, life: 1.0 });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt * 2; // Fade out speed

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.velocity, dt);
                p.mesh.rotation.x += dt * 5;
                p.mesh.rotation.y += dt * 5;
                p.mesh.scale.setScalar(p.life); // Shrink
            }
        }
    }
}
