# Asset-Driven Development for Three.js

In professional Three.js development, **Asset-Driven Development (ADD)** is the transition from defining geometry via code (imperative) to defining it via external files (declarative). This approach allows you to separate the technical logic (physics, scoring, networking) from the visual fidelity (textures, shaders, high-poly meshes).

Here is a systematic guide to building an asset-driven pipeline for your game.

---

## 1. The Standardized File Format: GLTF/GLB

In the web ecosystem, **GLTF** (Graphics Language Transmission Format) is the *"JPEG of 3D."* You should never use `.obj` or `.fbx` in production Three.js because GLTF is optimized for the GPU.

| Format | Description | Best For |
|--------|-------------|----------|
| **GLB** (Binary) | A single file containing geometry, textures, and animations | Production |
| **GLTF** (JSON) | Multiple files (human-readable JSON + `.bin` + images) | Debugging or external textures |

---

## 2. Setting Up the Asset Loader

You need a centralized **Asset Manager** to handle loading states. This prevents the game from starting before the high-res textures are ready.

### The Systematic Loader Pattern

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 1. Initialize Draco (Compression)
// This allows you to use files 5-10x smaller than standard GLB
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

// 2. Initialize GLTF Loader
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// 3. The Asset Manager Logic
const assets = {
    playerModel: null,
    enemyModel: null
};

async function loadAssets() {
    const [player, enemy] = await Promise.all([
        loader.loadAsync('assets/fighter_plane.glb'),
        loader.loadAsync('assets/aa_turret.glb')
    ]);

    assets.playerModel = player.scene;
    assets.enemyModel = enemy.scene;

    initGame(); // Only start the loop once assets exist
}
```

---

## 3. The PBR Texture Pipeline

In ADD, you don't "draw" colors. You apply a **Texture Stack**. For high realism, every asset should come with these specific maps:

| Map Type | Purpose |
|----------|---------|
| **Diffuse/Albedo** | The raw color |
| **Normal Map** | Adds physical depth and surface detail (rivets, scratches) |
| **Roughness/Metallic** | Controls how light reflects off different parts of the surface |
| **Ambient Occlusion (AO)** | Adds depth to crevices |

---

## 4. Performance Optimization: InstancedMesh

If you import a high-poly tree model and place 100 of them using `scene.add(tree.clone())`, your frame rate will drop to zero because each tree is a separate **Draw Call** to the GPU.

**Asset-Driven approach:** Load the asset once, then use `THREE.InstancedMesh`. This sends the geometry to the GPU once and tells it to draw that geometry at 100 different positions in a **single call**.

```javascript
// Example: Creating a forest from one high-res tree asset
const count = 100;
const treeMesh = assets.treeModel.children[0].geometry;
const treeMat = assets.treeModel.children[0].material;

const forest = new THREE.InstancedMesh(treeMesh, treeMat, count);
const dummy = new THREE.Object3D();

for (let i = 0; i < count; i++) {
    dummy.position.set(Math.random() * 100, 0, Math.random() * 100);
    dummy.updateMatrix();
    forest.setMatrixAt(i, dummy.matrix);
}
scene.add(forest);
```

---

## 5. The "Level of Detail" (LOD) Strategy

For realistic environments, you cannot render high-poly models in the distance.

| LOD Level | Description |
|-----------|-------------|
| **LOD 0** | The high-res model (used when the player is close) |
| **LOD 1** | A decimated, lower-poly version |
| **LOD 2** | A "Billboard" (a flat 2D image of the object) |

Three.js provides the `THREE.LOD` object to automate this switching based on camera distance.

---

## Resources to Start Building

To move from code-based shapes to asset-driven reality, I recommend these sources for **CC0 (Free)** assets:

| Resource | Best For |
|----------|----------|
| [Poly Haven](https://polyhaven.com) | High-res HDRIs and PBR textures |
| [Sketchfab](https://sketchfab.com) | The industry standard for GLB models (filter by "Downloadable") |
| [Khronos Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models) | Official repository for testing GLTF features like clearcoat and sheen |

---

## Next Steps

> Would you like me to write a script that converts your current `createBalloon()` function to one that imports a high-quality GLB model instead?
