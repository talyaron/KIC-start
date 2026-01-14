const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const startScreenEl = document.getElementById('start-screen');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game state
let gameRunning = false;
let score = 0;
let animationId;
let lastTime = 0;

// Resize handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Mouse/Touch control fallback variables
let pointerX = null;
window.addEventListener('mousemove', (e) => {
    pointerX = e.clientX;
});
window.addEventListener('touchstart', (e) => {
    pointerX = e.touches[0].clientX;
});
window.addEventListener('touchmove', (e) => {
    pointerX = e.touches[0].clientX;
});
window.addEventListener('touchend', () => {
    pointerX = null;
});


// Game Objects
class Spaceship {
    constructor() {
        this.width = 60;
        this.height = 80; // slightly taller
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 7;
        this.color = '#00f3ff';
        this.trail = [];
    }

    update() {
        // Keyboard movement
        if ((keys.ArrowLeft || keys.a) && this.x > 0) {
            this.x -= this.speed;
        }
        if ((keys.ArrowRight || keys.d) && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }

        // Mouse/Touch follows
        if (pointerX !== null) {
            // center the ship on the pointer
            const targetX = pointerX - this.width / 2;
            // simple lerp for smoothness
            this.x += (targetX - this.x) * 0.1;

            // Boundary checks
            if (this.x < 0) this.x = 0;
            if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
        }

        // Engine Trail effect
        this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height, alpha: 1 });
        for (let i = 0; i < this.trail.length; i++) {
            this.trail[i].y += 2; // trail moves down
            this.trail[i].alpha -= 0.05;
            if (this.trail[i].alpha <= 0) {
                this.trail.splice(i, 1);
                i--;
            }
        }
    }

    draw() {
        // Draw Trail
        ctx.save();
        for (let particle of this.trail) {
            ctx.fillStyle = `rgba(0, 243, 255, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw Ship (Simple geometric shape for now, can be an image later)
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y); // visual tip
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 15); // engine notch
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Meteor {
    constructor() {
        this.radius = Math.random() * 20 + 15;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = -this.radius;
        this.speed = Math.random() * 3 + 2 + (score * 0.005); // Speed increases with score
        this.color = '#ffaa00'; // fiery color
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.vertices = [];

        // Generate jagged asteroid shape
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = this.radius * (0.8 + Math.random() * 0.4);
            this.vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;

        ctx.beginPath();
        if (this.vertices.length > 0) {
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            for (let i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add some "fire" glow if moving fast
        if (this.speed > 5) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'orange';
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.5 + 0.1;
        this.brightness = Math.random();
    }

    update() {
        this.y += this.speed * (1 + score * 0.001); // Stars move faster as game speeds up
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// Variables
let spaceship;
let meteors = [];
let stars = [];
let meteorSpawnTimer = 0;

function init() {
    spaceship = new Spaceship();
    meteors = [];
    score = 0;
    scoreEl.innerText = `Score: ${score}`;

    // Create background stars
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

function spawnMeteor() {
    // Spawn rate increases (interval decreases) as score goes up
    // Base interval 60 frames (approx 1 sec), minimum 15 frames
    const spawnRate = Math.max(15, 60 - Math.floor(score / 50));

    meteorSpawnTimer++;
    if (meteorSpawnTimer > spawnRate) {
        meteors.push(new Meteor());
        meteorSpawnTimer = 0;
    }
}

function checkCollisions() {
    for (let meteor of meteors) {
        // Simple circle-rectangle collision approximate
        // Or checking distance between centers

        // Let's use a slightly more forgiving circle collision for the ship's center
        // Ship center approx
        const shipcX = spaceship.x + spaceship.width / 2;
        const shipcY = spaceship.y + spaceship.height / 2;

        const dx = shipcX - meteor.x;
        const dy = shipcY - meteor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < meteor.radius + spaceship.width / 3) { // /3 to be forgiving
            gameOver();
        }
    }
}

function update() {
    // Clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });

    // Update and draw spaceship
    spaceship.update();
    spaceship.draw();

    // Spawn and manage meteors
    spawnMeteor();
    for (let i = 0; i < meteors.length; i++) {
        meteors[i].update();
        meteors[i].draw();

        // Remove off-screen meteors
        if (meteors[i].y > canvas.height + 50) {
            meteors.splice(i, 1);
            score += 10;
            scoreEl.innerText = `Score: ${score}`;
            i--;
        }
    }

    checkCollisions();
}

function loop(timestamp) {
    if (!gameRunning) return;

    // Calculate delta if needed, but for simple stuff just running every frame is ok
    update();
    animationId = requestAnimationFrame(loop);
}

function startGame() {
    init();
    gameRunning = true;
    startScreenEl.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    loop();
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreEl.innerText = `Score: ${score}`;
    gameOverEl.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial render for background
resize();
stars = [];
for (let i = 0; i < 100; i++) stars.push(new Star());
stars.forEach(s => s.draw());

