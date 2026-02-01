import RAPIER from '@dimforge/rapier3d-compat';

class Physics {
    constructor() {
        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
        this.eventQueue = new RAPIER.EventQueue(true);
    }

    update() {
        this.world.step(this.eventQueue);
    }

    createBox(width, height, depth, pos, type = 'fixed') {
        const rigidBodyDesc = type === 'fixed'
            ? RAPIER.RigidBodyDesc.fixed()
            : RAPIER.RigidBodyDesc.dynamic();
        rigidBodyDesc.setTranslation(pos.x, pos.y, pos.z);
        const body = this.world.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
        this.world.createCollider(colliderDesc, body);

        return body;
    }

    createCapsule(radius, height, pos) {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(pos.x, pos.y, pos.z)
            .setCanSleep(false)
            .enabledRotations(false, false, false);
        const body = this.world.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius);
        this.world.createCollider(colliderDesc, body);

        return body;
    }
}

export default Physics;
