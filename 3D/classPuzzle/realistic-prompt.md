The Prompt for Claude Code
Role: You are an expert Creative Technologist and Three.js Graphics Engineer specializing in WebGL realism and performance optimization.

Task: Refactor the provided "Sky Fighter" game code to achieve "Triple-A" visual fidelity. Shift the visual style from low-poly/stylized to high-end realism.

Core Requirements:

Physically Based Rendering (PBR):

Replace all MeshPhongMaterial and MeshLambertMaterial with MeshStandardMaterial.

Implement an Environment Map (HDRI) using RGBELoader to provide realistic reflections and global illumination.

Set renderer.toneMapping = THREE.ACESFilmicToneMapping and renderer.outputColorSpace = THREE.SRGBColorSpace.

Post-Processing Pipeline:

Implement EffectComposer.

Add the following passes: RenderPass, UnrealBloomPass (for glow on muzzle flashes/sun), and SMAAPass (for high-quality anti-aliasing).

Add a subtle VignettePass and FilmPass to simulate a cinematic camera lens.

Environmental Realism:

Atmosphere: Replace the basic Fog with THREE.FogExp2 for realistic distance fading.

Terrain: Update the ground to use a MeshStandardMaterial with high roughness and implement Anisotropic Filtering on the texture to keep it sharp at grazing angles.

Clouds: Refactor the clouds to use semi-transparent, noise-based sprites or a simple volumetric shader instead of spheres.

Lighting & Shadows:

Implement Contact Hardening Shadows (PCSS) or highly filtered soft shadows.

Add a Secondary Light (HemisphereLight) to simulate "Sky Light" bouncing off the ground.

Refined Assets:

Instead of basic BoxGeometry, add code placeholders/logic to load .glb models for the plane and AA cannons.

Add a "Propeller Blur" effect using a semi-transparent rotating disc with a radial blur texture.

Constraints:

Keep the existing flight physics and game logic intact.

Ensure performance remains stable by using InstancedMesh for trees and repetitive environmental objects.

Maintain the current "PointerLock" controls but smooth out the camera movement with a small "lerp" for a more weighted, "heavy aircraft" feel.