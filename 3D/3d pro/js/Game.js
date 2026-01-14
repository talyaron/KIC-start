import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { ParticleSystem } from './Particles.js';
import { AudioController } from './Audio.js';

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export class Game {
    constructor() {
        this.container = document.getElementById('game-canvas');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.state = 'START'; // START, PLAYING, GAMEOVER
        this.score = 0;
        this.multiplier = 1.0;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020205);
        this.scene.fog = new THREE.FogExp2(0x020205, 0.02);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 3, 6);
        this.camera.lookAt(0, 1, -5);

        // Audio
        this.audio = new AudioController(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;

        // Post Processing (Bloom)
        this.renderScene = new RenderPass(this.scene, this.camera);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height),
            1.5,
            0.4,
            0.85
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(this.renderScene);
        this.composer.addPass(this.bloomPass);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffccff, 1);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Game Objects
        this.player = new Player(this.scene);
        this.world = new World(this.scene);
        this.particles = new ParticleSystem(this.scene);

        // Inputs
        this.inputX = 0;
        this.setupInputs();

        // UI
        this.distDisplay = document.getElementById('dist-display');
        this.multDisplay = document.getElementById('mult-display');
        this.finalDist = document.getElementById('final-dist');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.restartBtn = document.getElementById('restart-btn');

        this.restartBtn.addEventListener('click', () => this.restart());
        this.startScreen.addEventListener('click', () => {
            if (this.state === 'START') this.start();
        });

        // Loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        // Resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupInputs() {
        window.addEventListener('mousemove', (e) => {
            this.inputX = (e.clientX / this.width) * 2 - 1;
        });

        window.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            this.inputX = (touch.clientX / this.width) * 2 - 1;
        });

        // Shoot
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'PLAYING') {
                this.player.shoot();
                this.audio.playSound('shoot');
            }
        });

        window.addEventListener('click', () => {
            if (this.state === 'PLAYING') {
                this.player.shoot();
                this.audio.playSound('shoot');
            }
        });
    }

    start() {
        this.state = 'PLAYING';
        this.startScreen.classList.add('hidden');
        this.world.reset();
        this.player.reset();
        this.score = 0;
        this.multiplier = 1.0;
        this.clock.start();

        // Intro Camera Animation
        this.camera.position.set(0, 10, 20);
        let camTime = 0;
        const introInterval = setInterval(() => {
            camTime += 0.05;
            this.camera.position.y = lerp(this.camera.position.y, 3, 0.1);
            this.camera.position.z = lerp(this.camera.position.z, 6, 0.1);
            if (Math.abs(this.camera.position.z - 6) < 0.1) {
                clearInterval(introInterval);
                this.camera.lookAt(0, 1, -5);
            }
        }, 16);
    }

    restart() {
        this.state = 'PLAYING';
        this.gameOverScreen.classList.add('hidden');
        this.world.reset();
        this.player.reset();
        this.score = 0;
        this.multiplier = 1.0;
        this.scene.position.x = 0;
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const dt = Math.min(this.clock.getDelta(), 0.1);

        if (this.state === 'PLAYING') {
            this.player.update(dt, this.inputX);
            this.world.update(dt);
            this.particles.update(dt);

            // Obstacle Collision (Game Over)
            if (this.world.checkCollisions(this.player.box)) {
                this.audio.playSound('explode');
                this.gameOver();
            }

            // Bullet Collision (Score)
            const hits = this.world.checkBulletCollisions(this.player.bullets, this.particles);
            if (hits > 0) {
                this.audio.playSound('explode');
                this.messageShake();
                this.score += hits * 100 * this.multiplier;
                this.multiplier += 0.1;
                this.multDisplay.textContent = this.multiplier.toFixed(1);
            }

            // UI
            this.distDisplay.textContent = Math.floor(this.world.distance + this.score);
        }

        this.composer.render();
    }

    messageShake() {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.finalDist.textContent = Math.floor(this.world.distance + this.score);
        this.gameOverScreen.classList.remove('hidden');

        this.camera.position.x += Math.random() * 0.5 - 0.25;
        setTimeout(() => {
            this.camera.position.x = 0;
        }, 300);
    }
}
