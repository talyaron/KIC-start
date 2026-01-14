import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, onChildAdded, onChildRemoved, remove, update } from 'firebase/database';

// --- MULTIPLAYER CONFIG ---
const firebaseConfig = { databaseURL: "https://cyber-dungeon-default-rtdb.firebaseio.com" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const userId = "player_" + Math.random().toString(36).substring(7);
const playersRef = ref(db, 'players');
const myPlayerRef = ref(db, 'players/' + userId);

// --- LEVEL CONFIG ---
const LEVELS = {
    1: { name: "CYBER", color: 0x00ffff, ground: 0x050510, fog: 0x020205, heightMult: 1 },
    2: { name: "TOXIC", color: 0x00ff00, ground: 0x011501, fog: 0x001000, heightMult: 1.5 },
    3: { name: "INFERNO", color: 0xff4400, ground: 0x150101, fog: 0x100000, heightMult: 2.5 },
    4: { name: "VOID", color: 0xffffff, ground: 0x010101, fog: 0x000000, heightMult: 4 },
    5: { name: "TITAN", color: 0xffff00, ground: 0x101005, fog: 0x050500, heightMult: 6 }
};

// --- GAME CONFIG ---
const PLAYER_HEIGHT = 1.6;
const ARENA_SIZE = 100;
const MOVEMENT_SPEED = 85;
const GRAVITY = 40;

// --- GLOBALS ---
let scene, camera, renderer, composer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, velocity = new THREE.Vector3(), direction = new THREE.Vector3();
let prevTime = performance.now();
let playerHealth = 100, score = 0, totalKills = 0, levelKills = 0, currentLevel = 1;
let playerSpeedMultiplier = 1.0, isGameOver = false, audioCtx;
let shakeIntensity = 0;

const otherPlayers = {}, enemies = [], particles = [], powerups = [], bullets = [], collidables = [];

function log(msg) { const el = document.getElementById('debug-log'); if (el) el.innerText = "S: " + msg; }

function init() {
    try {
        log("Loading Invasion...");
        const oldCanvases = document.querySelectorAll('canvas');
        oldCanvases.forEach(c => c.remove());

        scene = new THREE.Scene();
        const conf = LEVELS[currentLevel];
        scene.background = new THREE.Color(conf.fog);
        scene.fog = new THREE.Fog(conf.fog, 1, ARENA_SIZE * 1.5);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.threshold = 0.1;
        bloom.strength = 1.5;
        composer.addPass(bloom);

        controls = new PointerLockControls(camera, document.body);
        const inst = document.getElementById('instructions');
        inst.addEventListener('click', () => {
            controls.lock();
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            inst.style.display = 'none';
        });

        scene.add(camera);
        camera.position.set(0, 5, 0);

        setupMultiplayer();
        createWorld();
        createWeapon();
        createAmbientDust();

        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW') moveForward = true;
            if (e.code === 'KeyA') moveLeft = true;
            if (e.code === 'KeyS') moveBackward = true;
            if (e.code === 'KeyD') moveRight = true;
            if (e.code === 'Space' && canJump) { velocity.y += 18; canJump = false; }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW') moveForward = false;
            if (e.code === 'KeyA') moveLeft = false;
            if (e.code === 'KeyS') moveBackward = false;
            if (e.code === 'KeyD') moveRight = false;
        });
        document.addEventListener('mousedown', fireBullet);

        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const hemi = new THREE.HemisphereLight(conf.color, 0x000000, 0.6);
        scene.add(hemi);

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });

        updateHUD();
        spawnEnemyLoop();
        spawnPowerupLoop();
        requestAnimationFrame(animate);
    } catch (err) { log("Err: " + err.message); }
}

function createWorld() {
    collidables.length = 0;
    while (scene.children.length > 0) { scene.remove(scene.children[0]); }

    const conf = LEVELS[currentLevel];
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    scene.add(new THREE.HemisphereLight(conf.color, 0x000000, 0.6));
    createAmbientDust();

    // Arena Floor
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE), new THREE.MeshStandardMaterial({ color: conf.ground }));
    ground.rotation.x = -Math.PI / 2;
    ground.isGround = true;
    scene.add(ground);
    collidables.push(ground);

    const grid = new THREE.GridHelper(ARENA_SIZE, 20, conf.color, 0x222222);
    grid.position.y = 0.05;
    scene.add(grid);

    // Visible Arena Boundaries
    const wallGeo = new THREE.BoxGeometry(ARENA_SIZE, 100, 1);
    const wallMat = new THREE.MeshStandardMaterial({ color: conf.color, transparent: true, opacity: 0.1, wireframe: true });
    const nWall = new THREE.Mesh(wallGeo, wallMat); nWall.position.set(0, 50, -ARENA_SIZE / 2); scene.add(nWall);
    const sWall = nWall.clone(); sWall.position.set(0, 50, ARENA_SIZE / 2); scene.add(sWall);
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(1, 100, ARENA_SIZE), wallMat); eWall.position.set(ARENA_SIZE / 2, 50, 0); scene.add(eWall);
    const wWall = eWall.clone(); wWall.position.set(-ARENA_SIZE / 2, 50, 0); scene.add(wWall);

    // Platforms and SEAMLESS RAMPS
    for (let i = 0; i < 12; i++) {
        const ph = (2 + Math.random() * 8) * conf.heightMult;
        const pw = 6, pd = 6;
        const platform = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), new THREE.MeshStandardMaterial({ color: conf.color, emissive: conf.color, emissiveIntensity: 0.2 }));
        const px = (Math.random() - 0.5) * 70, pz = (Math.random() - 0.5) * 70;
        platform.position.set(px, ph / 2, pz);
        platform.isGround = true;
        scene.add(platform);
        collidables.push(platform);

        // Seamless Ramp
        const rampLength = ph * 2.5; // Slope depends on height
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.5, rampLength), new THREE.MeshStandardMaterial({ color: conf.color }));

        // Pivot math for seamless connection
        const angle = Math.atan2(ph, rampLength);
        ramp.rotation.x = -angle;

        // Position it so the top edge is at ph
        const oz = rampLength / 2 * Math.cos(angle);
        ramp.position.set(px, ph / 2, pz + pd / 2 + oz);
        ramp.isGround = true;
        scene.add(ramp);
        collidables.push(ramp);
    }
}

function fireBullet() {
    if (!controls.isLocked || isGameOver) return;
    bullets.push(new Bullet());
    triggerShake(0.12);
    weapon.position.z += 0.2;
    if (audioCtx) {
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(400, audioCtx.currentTime);
        g.gain.setValueAtTime(0.04, audioCtx.currentTime);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + 0.1);
    }
}

class Bullet {
    constructor() {
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        this.mesh.position.copy(camera.position);
        this.dir = new THREE.Vector3();
        camera.getWorldDirection(this.dir);
        this.mesh.position.addScaledVector(this.dir, 1.0);
        this.speed = 180;
        this.life = 2.5;
        scene.add(this.mesh);
        this.dead = false;
    }
    update(delta) {
        if (this.dead) return false;
        const step = this.speed * delta;
        const ray = new THREE.Raycaster(this.mesh.position, this.dir, 0, step + 0.5);
        const hits = ray.intersectObjects(scene.children, true);

        for (let h of hits) {
            let o = h.object; while (o.parent && !o.isEnemy) o = o.parent;
            if (o.isEnemy) {
                o.instance.hit(25); createExp(h.point, 0xff00ff);
                showHitmarker(); this.destroy(); return false;
            }
            if (h.object.isGround && h.distance < step) {
                createExp(h.point, 0xffff00); this.destroy(); return false;
            }
        }
        this.mesh.position.addScaledVector(this.dir, step);
        this.life -= delta;
        if (this.life <= 0) { this.destroy(); return false; }
        return true;
    }
    destroy() {
        if (!this.dead) {
            scene.remove(this.mesh);
            this.dead = true;
        }
    }
}

class Enemy {
    constructor() {
        this.group = new THREE.Group(); this.group.isEnemy = true; this.group.instance = this;
        const conf = LEVELS[currentLevel];

        // Advanced Visuals for 5 Stages
        if (currentLevel === 1) { // STALKER
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x440044 }));
            const visor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 })); visor.position.z = 0.8;
            this.group.add(body, visor);
        } else if (currentLevel === 2) { // GLOB
            const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true }));
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0x004400 }));
            this.group.add(body, core);
        } else if (currentLevel === 3) { // SPIKY
            const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), new THREE.MeshStandardMaterial({ color: 0xff4400 }));
            for (let i = 0; i < 8; i++) {
                const s = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                s.position.set(Math.cos(i) * 1.5, Math.sin(i) * 1.5, 0); s.lookAt(0, 0, 0);
                this.group.add(s);
            }
            this.group.add(body);
        } else if (currentLevel === 4) { // VOID
            const body = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.3, 64, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
            this.group.add(body);
        } else { // TITAN
            const body = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffffff })); eye.position.z = 1.5;
            this.group.add(body, eye);
        }

        let x, z; do { x = (Math.random() - 0.5) * 90; z = (Math.random() - 0.5) * 90; } while (Math.sqrt(x * x + z * z) < 15);
        this.group.position.set(x, 10, z);
        scene.add(this.group);
        this.health = 50 + currentLevel * 20; this.alive = true;
        enemies.push(this);
    }
    hit(amt) {
        this.health -= amt;
        if (this.health <= 0 && this.alive) {
            this.alive = false; scene.remove(this.group);
            score += 150 * currentLevel; totalKills++; levelKills++; updateHUD();
            createExp(this.group.position, 0xff0000, true);
            if (levelKills >= 10 && currentLevel < 5) levelUp();
        }
    }
    update(delta, time) {
        const dir = new THREE.Vector3().subVectors(camera.position, this.group.position).normalize();
        this.group.position.addScaledVector(dir, (6 + currentLevel * 1.5) * delta);
        this.group.lookAt(camera.position);
        this.group.rotation.y += Math.sin(time * 0.01) * 0.1;

        if (this.group.position.distanceTo(camera.position) < 3) {
            playerHealth -= 20; triggerShake(0.6); showDamageFlash(); this.hit(999); updateHUD();
            if (playerHealth <= 0 && !isGameOver) endGame();
        }
    }
}

function levelUp() {
    currentLevel++;
    levelKills = 0;
    const el = document.getElementById('level-up-overlay');
    el.innerText = "LEVEL " + currentLevel + ": " + LEVELS[currentLevel].name;
    el.style.display = 'block'; el.className = 'level-animation';
    setTimeout(() => { el.style.display = 'none'; }, 1500);

    enemies.forEach(e => scene.remove(e.group)); enemies.length = 0;
    bullets.forEach(b => b.destroy()); bullets.length = 0;

    const conf = LEVELS[currentLevel];
    scene.background = new THREE.Color(conf.fog);
    scene.fog.color.set(conf.fog);
    createWorld();
}

function setupMultiplayer() {
    set(myPlayerRef, { id: userId, x: 0, y: 5, z: 0, ry: 0, health: 100 });
    onChildAdded(playersRef, (sn) => {
        const d = sn.val(); if (d.id === userId) return;
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00 })));
        scene.add(g); otherPlayers[d.id] = { group: g };
    });
    onValue(playersRef, (sn) => {
        const ps = sn.val(); if (!ps) return;
        Object.keys(ps).forEach(id => {
            if (id !== userId && otherPlayers[id]) {
                otherPlayers[id].group.position.set(ps[id].x, ps[id].y - PLAYER_HEIGHT, ps[id].z);
                otherPlayers[id].group.rotation.y = ps[id].ry;
            }
        });
    });
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(), delta = Math.min((time - prevTime) / 1000, 0.1);
    if (controls.isLocked && !isGameOver) {
        velocity.x -= velocity.x * 10 * delta; velocity.z -= velocity.z * 10 * delta; velocity.y -= GRAVITY * delta;
        direction.z = Number(moveForward) - Number(moveBackward); direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        const s = MOVEMENT_SPEED * playerSpeedMultiplier;
        if (moveForward || moveBackward) velocity.z -= direction.z * s * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * s * delta;
        controls.moveRight(-velocity.x * delta); controls.moveForward(-velocity.z * delta);
        camera.position.y += (velocity.y * delta);

        const r = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0, 10);
        const hits = r.intersectObjects(collidables);
        const gh = (hits.length > 0) ? hits[0].point.y : 0;
        if (camera.position.y < gh + PLAYER_HEIGHT) { velocity.y = 0; camera.position.y = gh + PLAYER_HEIGHT; canJump = true; }

        if (shakeIntensity > 0) { camera.position.x += (Math.random() - 0.5) * shakeIntensity; camera.position.y += (Math.random() - 0.5) * shakeIntensity; shakeIntensity -= delta * 1.5; }
        weapon.position.z += (-0.5 - weapon.position.z) * 0.1;
        update(myPlayerRef, { x: camera.position.x, y: camera.position.y, z: camera.position.z, ry: camera.rotation.y });
    }
    for (let i = bullets.length - 1; i >= 0; i--) { if (!bullets[i].update(delta)) bullets.splice(i, 1); }
    for (let i = enemies.length - 1; i >= 0; i--) { if (enemies[i].alive) enemies[i].update(delta, time); else enemies.splice(i, 1); }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.life -= delta * 2; p.mesh.position.add(p.vel);
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); } else p.mesh.material.opacity = p.life;
    }
    if (composer) composer.render();
    prevTime = time;
}

function createExp(pos, color, big) {
    const c = big ? 12 : 5; const geo = new THREE.SphereGeometry(0.12, 4, 4);
    for (let i = 0; i < c; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true })); m.position.copy(pos);
        const v = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
        scene.add(m); particles.push({ mesh: m, life: 1.0, vel: v });
    }
}
function triggerShake(i) { shakeIntensity = i; }
function showHitmarker() { const el = document.getElementById('hitmarker'); if (el) { el.style.opacity = '1'; setTimeout(() => el.style.opacity = '0', 80); } }
function showDamageFlash() { const el = document.getElementById('damage-flash'); if (el) { el.style.opacity = '1'; setTimeout(() => el.style.opacity = '0', 100); } }
function updateHUD() {
    document.getElementById('health').innerText = Math.max(0, Math.floor(playerHealth));
    document.getElementById('score').innerText = score;
    document.getElementById('kills').innerText = totalKills;
    document.getElementById('level-val').innerText = currentLevel;
}
function spawnEnemyLoop() { if (!isGameOver) { new Enemy(); setTimeout(spawnEnemyLoop, Math.max(1200, 4500 - totalKills * 60)); } }
function spawnPowerupLoop() { if (!isGameOver) { setTimeout(spawnPowerupLoop, 18000); } }
let weapon;
function createWeapon() {
    weapon = new THREE.Group();
    weapon.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: 0x222222 })));
    camera.add(weapon); weapon.position.set(0.3, -0.25, -0.5);
}
function createAmbientDust() {
    const geo = new THREE.BufferGeometry(); const count = 1000; const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 200;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.1, transparent: true, opacity: 0.3 });
    scene.add(new THREE.Points(geo, mat));
}
function endGame() { isGameOver = true; controls.unlock(); document.getElementById('game-over').style.display = 'flex'; document.getElementById('final-score').innerText = score; }

init();
