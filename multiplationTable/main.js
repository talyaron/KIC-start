import './style.css'

// --- Local Database Manager (IndexedDB) ---
class ScoreDB {
    constructor() {
        this.dbName = 'MathOdysseyDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (e) => reject('Database error');
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('scores')) {
                    db.createObjectStore('scores', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async saveScore(scoreData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const store = transaction.objectStore('scores');
            const request = store.add({
                ...scoreData,
                timestamp: new Date().toISOString()
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }

    async getAllScores() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readonly');
            const store = transaction.objectStore('scores');
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result.reverse()); // Newest first
            request.onerror = () => reject();
        });
    }

    async getHighScore() {
        const scores = await this.getAllScores();
        if (scores.length === 0) return 0;
        return Math.max(...scores.map(s => s.score));
    }

    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scores'], 'readwrite');
            const store = transaction.objectStore('scores');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }
}

// --- Mathematical Particle System ---
class MathBackground {
    constructor() {
        this.canvas = document.getElementById('math-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.symbols = ['Σ', 'π', '∫', '√', '∞', '×', '÷', 'Δ', 'θ', 'λ', 'φ', 'Ω'];
        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Click to explode
        window.addEventListener('mousedown', (e) => this.handleClick(e));

        this.resize();
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        for (let i = 0; i < 70; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle(isBurst = false, x, y, symbol) {
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            symbol: symbol || this.symbols[Math.floor(Math.random() * this.symbols.length)],
            size: isBurst ? Math.random() * 20 + 5 : Math.random() * 25 + 15,
            speedX: isBurst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 0.8,
            speedY: isBurst ? (Math.random() - 0.5) * 12 : (Math.random() - 0.5) * 0.8,
            opacity: isBurst ? 1 : Math.random() * 0.5 + 0.1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            isBurst: isBurst,
            life: isBurst ? 80 : Infinity,
            color: isBurst ? '#fbbf24' : '#0ea5e9'
        };
    }

    handleClick(e) {
        const x = e.clientX;
        const y = e.clientY;
        let found = false;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.isBurst) continue;

            const dx = x - p.x;
            const dy = y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < p.size + 10) {
                this.triggerExplosion(p);
                this.particles.splice(i, 1);
                setTimeout(() => this.particles.push(this.createParticle()), 2000);
                found = true;
                break;
            }
        }

        if (!found) {
            this.triggerBurst(x, y, 5);
        }
    }

    triggerExplosion(p) {
        for (let i = 0; i < 15; i++) {
            this.particles.push(this.createParticle(true, p.x, p.y, p.symbol));
        }
    }

    triggerBurst(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(true, x, y));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];

            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;

            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 250 && !p.isBurst) {
                p.x -= dx / 120;
                p.y -= dy / 120;
            }

            if (!p.isBurst) {
                if (p.x < -50) p.x = this.canvas.width + 50;
                if (p.x > this.canvas.width + 50) p.x = -50;
                if (p.y < -50) p.y = this.canvas.height + 50;
                if (p.y > this.canvas.height + 50) p.y = -50;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.font = `${p.size}px serif`;
            this.ctx.fillText(p.symbol, 0, 0);
            this.ctx.restore();

            if (p.isBurst) {
                p.life--;
                p.opacity -= 0.012;
                if (p.life <= 0 || p.opacity <= 0) this.particles.splice(i, 1);
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

// --- Game Logic ---
let gameState = {
    currentQuestion: 0,
    totalQuestions: 20,
    score: 0,
    correctCount: 0,
    num1: 0,
    num2: 0,
    startTime: 0,
    totalTime: 0,
    timerInterval: null,
    maxNum: 10
};

const mathBg = new MathBackground();
const db = new ScoreDB();

// --- DOM Elements ---
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen'),
    history: document.getElementById('history-screen')
};

const elements = {
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    answerInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-btn'),
    qCounter: document.getElementById('q-counter'),
    currentScore: document.getElementById('current-score'),
    progressBar: document.getElementById('progress-bar'),
    timerText: document.getElementById('timer-text'),
    timerPath: document.getElementById('timer-svg-path'),
    feedback: document.getElementById('feedback'),
    finalAccuracy: document.getElementById('final-accuracy'),
    finalScore: document.getElementById('final-score'),
    finalTime: document.getElementById('final-time'),
    highScoreVal: document.getElementById('high-score-val'),
    questionBox: document.getElementById('question-container'),
    historyList: document.getElementById('history-list')
};

// --- Execution ---
async function initApp() {
    await db.init();
    updateHighScoreDisplay();
}

initApp();

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', () => showScreen('start'));
document.getElementById('view-history-btn').addEventListener('click', showHistory);
document.getElementById('back-to-start').addEventListener('click', () => showScreen('start'));
document.getElementById('clear-data-btn').addEventListener('click', clearHistory);

elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});
elements.submitBtn.addEventListener('click', checkAnswer);

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.maxNum = parseInt(btn.dataset.range);
    });
});

async function updateHighScoreDisplay() {
    const high = await db.getHighScore();
    elements.highScoreVal.innerText = high;
}

function startGame() {
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.correctCount = 0;
    gameState.totalTime = 0;
    showScreen('game');
    nextQuestion();
}

function nextQuestion() {
    if (gameState.currentQuestion >= gameState.totalQuestions) {
        finishGame();
        return;
    }

    gameState.currentQuestion++;
    gameState.num1 = Math.floor(Math.random() * gameState.maxNum) + 1;
    gameState.num2 = Math.floor(Math.random() * gameState.maxNum) + 1;

    elements.num1.innerText = gameState.num1;
    elements.num2.innerText = gameState.num2;
    elements.answerInput.value = '';
    elements.answerInput.focus();
    elements.qCounter.innerText = `${gameState.currentQuestion.toString().padStart(2, '0')}`;
    elements.currentScore.innerText = gameState.score.toString().padStart(3, '0');

    const progress = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    elements.progressBar.style.width = `${progress}%`;

    startTimer();
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.startTime = Date.now();
    const update = () => {
        const elapsed = (Date.now() - gameState.startTime) / 1000;
        elements.timerText.innerText = `${elapsed.toFixed(1)}S`;
        const percent = Math.min(elapsed / 10, 1);
        const offset = 283 - (percent * 283);
        elements.timerPath.style.strokeDashoffset = offset;
    };
    update();
    gameState.timerInterval = setInterval(update, 100);
}

function checkAnswer() {
    if (!screens.game.classList.contains('active')) return;
    const userAnswer = parseInt(elements.answerInput.value);
    const correctAnswer = gameState.num1 * gameState.num2;
    const timeTaken = (Date.now() - gameState.startTime) / 1000;

    clearInterval(gameState.timerInterval);
    gameState.totalTime += timeTaken;

    if (userAnswer === correctAnswer) {
        const rect = elements.answerInput.getBoundingClientRect();
        mathBg.triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        handleSuccess(timeTaken);
    } else {
        handleFailure();
    }
    setTimeout(nextQuestion, 600);
}

function handleSuccess(time) {
    let bonus = 0;
    if (time < 2) bonus = 3;
    else if (time < 4) bonus = 2;
    else if (time < 6) bonus = 1;
    gameState.score += (5 + bonus);
    gameState.correctCount++;
    showFeedback('RESOLVED', 'var(--success)');
}

function handleFailure() {
    showFeedback('ERROR', 'var(--error)');
    elements.questionBox.classList.add('wrong-shake');
    setTimeout(() => elements.questionBox.classList.remove('wrong-shake'), 400);
}

function showFeedback(text, color) {
    elements.feedback.innerText = text;
    elements.feedback.style.color = color;
    elements.feedback.style.animation = 'none';
    elements.feedback.offsetHeight;
    elements.feedback.style.animation = 'feedbackPop 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards';
}

async function finishGame() {
    const finalData = {
        score: gameState.score,
        accuracy: `${gameState.correctCount}/${gameState.totalQuestions}`,
        time: gameState.totalTime.toFixed(1),
        mode: gameState.maxNum === 10 ? 'BASE-10' : 'BASE-12'
    };

    await db.saveScore(finalData);
    showResults(finalData);
    updateHighScoreDisplay();
}

function showResults(data) {
    showScreen('results');
    elements.finalAccuracy.innerText = data.accuracy;
    elements.finalScore.innerText = data.score;
    elements.finalTime.innerText = `${data.time}S`;
}

async function showHistory() {
    showScreen('history');
    const scores = await db.getAllScores();
    elements.historyList.innerHTML = scores.map(s => `
        <div class="history-entry">
            <div class="entry-date">${new Date(s.timestamp).toLocaleDateString()} ${new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="entry-stats">${s.accuracy} | ${s.time}S</div>
            <div class="entry-score">${s.score} PTS</div>
        </div>
    `).join('') || '<div style="padding: 20px; opacity: 0.5;">NO_ENTRIES_FOUND</div>';
}

async function clearHistory() {
    if (confirm('REALLY WIPE ALL SECTOR DATA?')) {
        await db.clearAll();
        showHistory();
        updateHighScoreDisplay();
    }
}

function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenId]) screens[screenId].classList.add('active');
}
