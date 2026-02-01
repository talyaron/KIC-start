import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import Physics from './systems/Physics.js';
import Input from './systems/Input.js';
import Player from './entities/Player.js';
import Map from './world/Map.js';
import Bot from './entities/Bot.js';
import HUD from './ui/HUD.js';

class Game {
    constructor() {
        this.init();
    }

    async init() {
        // Initialize Rapier Physics
        await RAPIER.init({});

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Post Processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
        this.composer.addPass(bloomPass);

        const gammaPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(gammaPass);

        // Core Systems
        this.physics = new Physics();
        this.input = new Input();

        // World
        this.worldMap = new Map(this.scene, this.physics);

        // Entities
        this.player = new Player(this.scene, this.physics, this.camera);

        this.bots = [];
        this.spawnBots();

        this.createAtmosphere();

        // UI
        this.hud = new HUD();

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
        console.log("Tactics initialized.");
    }

    spawnBots() {
        // Enemies
        for (let i = 0; i < 4; i++) {
            this.bots.push(new Bot(this.scene, this.physics, 'enemies', { x: -8 + i * 2, y: 2, z: -8 }));
        }
        // Allies
        for (let i = 0; i < 3; i++) { // Player is the 4th
            this.bots.push(new Bot(this.scene, this.physics, 'allies', { x: 8, y: 2, z: -8 + i * 2 }));
        }
    }

    createAtmosphere() {
        const geo = new THREE.BufferGeometry();
        const posArr = [];
        for (let i = 0; i < 500; i++) {
            posArr.push((Math.random() - 0.5) * 50, Math.random() * 10, (Math.random() - 0.5) * 50);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
        const mat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.05, transparent: true, opacity: 0.5 });
        const points = new THREE.Points(geo, mat);
        this.scene.add(points);
        this.atmosphere = points;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.physics.update();
        this.player.update(this.input);

        this.bots.forEach(bot => bot.update(this.player, 0.016));

        this.hud.update(100, this.player.weapon.ammo);

        this.composer.render();
    }
}

new Game();
