// Newton's Laws Educational Portal - Simulation Engine

// --- Physics Utilities ---
class Vector {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vector(this.x + v.x, this.y + v.y); }
    mult(n) { return new Vector(this.x * n, this.y * n); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
}

class Entity {
    constructor(x, y, mass, color) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.mass = mass;
        this.color = color;
        this.radius = Math.sqrt(mass) * 10;
        this.trail = [];
    }

    applyForce(force) {
        const f = force.mult(1 / this.mass);
        this.acc = this.acc.add(f);
    }

    update(dt) {
        this.vel = this.vel.add(this.acc.mult(dt));
        this.pos = this.pos.add(this.vel.mult(dt));
        this.acc = new Vector(0, 0);

        // Trail
        if (frameCount % 5 === 0) {
            this.trail.push({ x: this.pos.x, y: this.pos.y, alpha: 1.0 });
            if (this.trail.length > 20) this.trail.shift();
        }
    }

    draw(ctx) {
        // Trail
        this.trail.forEach(p => {
            p.alpha -= 0.02;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, this.radius * 0.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2); ctx.fill();

        // Glow
        ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.stroke(); ctx.shadowBlur = 0;
    }
}

// --- Base Simulation Class ---
class Simulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        // Handle Resize
        const resizeObserver = new ResizeObserver(() => {
            this.width = this.canvas.width = this.canvas.clientWidth;
            this.height = this.canvas.height = this.canvas.clientHeight;
            this.reset();
        });
        resizeObserver.observe(this.canvas);
    }

    start() {
        this.reset();
        this.loop();
    }

    reset() {
        // Override in subclass
    }

    update(dt) {
        this.entities.forEach(e => e.update(dt));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.entities.forEach(e => e.draw(this.ctx));
    }

    drawBackground() {
        // Simple grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < this.width; x += step) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += step) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
        }
    }

    loop() {
        const now = performance.now();
        const dt = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// --- Law 1: Inertia Simulation ---
class InertiaSim extends Simulation {
    constructor() {
        super('canvas-inertia');

        // Controls
        document.getElementById('btn-inertia-push').onclick = () => this.pushShip();
        document.getElementById('btn-inertia-reset').onclick = () => this.reset();
    }

    reset() {
        this.entities = [new Entity(100, this.height / 2, 2, '#00f3ff')];
        this.pushed = false;
        document.getElementById('btn-inertia-push').disabled = false;
        document.getElementById('btn-inertia-push').innerText = "Apply Thrust";
    }

    pushShip() {
        if (!this.pushed) {
            this.entities[0].applyForce(new Vector(800, 0));
            this.pushed = true;
            document.getElementById('btn-inertia-push').disabled = true;
            document.getElementById('btn-inertia-push').innerText = "Drifting...";
        }
    }

    update(dt) {
        super.update(dt);

        // Wrap around screen
        const ship = this.entities[0];
        if (ship.pos.x > this.width + 50) ship.pos.x = -50;

        // Update UI
        document.getElementById('val-inertia-vel').innerText = ship.vel.mag().toFixed(1);
    }
}

// --- Law 2: Force Simulation ---
class ForceSim extends Simulation {
    constructor() {
        super('canvas-force');

        // Controls
        this.slider = document.getElementById('slider-force');
        this.slider.oninput = (e) => {
            document.getElementById('val-force-display').innerText = e.target.value;
        };
        document.getElementById('btn-force-reset').onclick = () => {
            this.slider.value = 0;
            document.getElementById('val-force-display').innerText = "0";
            this.reset();
        };
    }

    reset() {
        this.entities = [
            new Entity(100, this.height / 3, 1, '#00ff9d'), // Light
            new Entity(100, this.height / 3 * 2, 5, '#ff9e00') // Heavy
        ];
    }

    update(dt) {
        const force = parseInt(this.slider.value);
        if (force > 0) {
            this.entities.forEach(e => e.applyForce(new Vector(force * 20, 0)));
        }

        super.update(dt);

        // Wrap
        this.entities.forEach(e => {
            if (e.pos.x > this.width + 50) e.pos.x = -50;
        });
    }
}

// --- Law 3: Action-Reaction Simulation ---
class ActionSim extends Simulation {
    constructor() {
        super('canvas-action');

        // Controls
        document.getElementById('btn-action-eject').onclick = () => this.eject();
        document.getElementById('btn-action-reset').onclick = () => this.reset();
    }

    reset() {
        this.entities = [new Entity(this.width / 2, this.height / 2, 3, '#ff0055')];
    }

    eject() {
        const ship = this.entities[0];
        // Action: Particle Left
        const particle = new Entity(ship.pos.x, ship.pos.y, 0.5, '#ffffff');
        particle.vel = new Vector(-400, 0);
        this.entities.push(particle);

        // Reaction: Ship Right
        ship.applyForce(new Vector(3000, 0));
    }

    update(dt) {
        super.update(dt);
        // Wrap
        this.entities.forEach(e => {
            if (e.pos.x > this.width + 50) e.pos.x = -50;
            if (e.pos.x < -50) e.pos.x = this.width + 50;
        });
    }
}

// --- Global Init ---
let frameCount = 0;
const sims = [
    new InertiaSim(),
    new ForceSim(),
    new ActionSim()
];

sims.forEach(sim => sim.start());

// Global Frame Counter for trails
function globalLoop() {
    frameCount++;
    requestAnimationFrame(globalLoop);
}
globalLoop();
