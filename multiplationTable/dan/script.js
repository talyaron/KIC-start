// Game Configuration
const TOTAL_QUESTIONS = 20;

// State Variables
let currentQuestion = 0;
let score = 0;
let correctCount = 0;
let startTime = 0;
let timerInterval = null;
let currentProblem = { x: 0, y: 0 };
let answersData = [];

// Local Storage Keys
const LS_HIGH_SCORE = 'multiplication_high_score';
const LS_GAME_HISTORY = 'multiplication_game_history';

// DOM Elements
const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    results: document.getElementById('screen-results')
};

const elements = {
    startBtn: document.getElementById('start-btn'),
    submitBtn: document.getElementById('submit-btn'),
    restartBtn: document.getElementById('restart-btn'),
    answerInput: document.getElementById('answer-input'),
    questionText: document.getElementById('question-text'),
    questionCount: document.getElementById('question-count'),
    scoreDisplay: document.getElementById('score-display'),
    timerProgress: document.getElementById('timer-progress'),
    timerText: document.getElementById('timer-text'),
    resScore: document.getElementById('res-total-score'),
    resAccuracy: document.getElementById('res-accuracy'),
    resAvgTime: document.getElementById('res-avg-time'),
    bestScoreDisplay: document.getElementById('best-score')
};

// --- Initialization ---
elements.startBtn.addEventListener('click', startGame);
elements.restartBtn.addEventListener('click', () => location.reload());
elements.submitBtn.addEventListener('click', checkAnswer);

elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

// Load Initial Data
updateBestScoreDisplay();

// --- Core Game Functions ---

function startGame() {
    currentQuestion = 0;
    score = 0;
    correctCount = 0;
    answersData = [];

    showScreen('game');
    nextQuestion();
}

function generateQuestion() {
    const x = Math.floor(Math.random() * 10) + 1;
    const y = Math.floor(Math.random() * 10) + 1;
    return { x, y };
}

function nextQuestion() {
    currentQuestion++;
    if (currentQuestion > TOTAL_QUESTIONS) {
        showResults();
        return;
    }

    currentProblem = generateQuestion();
    elements.questionText.innerText = `${currentProblem.x} × ${currentProblem.y}`;
    elements.questionCount.innerText = `Question ${currentQuestion} / ${TOTAL_QUESTIONS}`;
    elements.answerInput.value = '';
    elements.answerInput.focus();

    startTimer();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();

    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        elements.timerText.innerText = `${elapsed.toFixed(1)}s`;

        // Visual indicator of speed bonus (6s target)
        const progress = Math.max(0, (6 - elapsed) / 6 * 100);
        elements.timerProgress.style.width = `${progress}%`;

        if (elapsed > 10) {
            elements.timerProgress.style.background = '#ff7675';
        } else {
            elements.timerProgress.style.background = '#00cec9';
        }
    }, 100);
}

function checkAnswer() {
    const userAnswer = parseInt(elements.answerInput.value);
    if (isNaN(userAnswer)) return;

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    clearInterval(timerInterval);

    const isCorrect = userAnswer === (currentProblem.x * currentProblem.y);
    const questionScore = calculateScore(isCorrect, timeTaken);

    score += questionScore;
    if (isCorrect) correctCount++;

    answersData.push({ isCorrect, timeTaken });
    elements.scoreDisplay.innerText = `Score: ${score}`;

    // Provide visual feedback
    elements.questionText.classList.remove('correct', 'wrong');
    void elements.questionText.offsetWidth; // Trigger reflow
    elements.questionText.classList.add(isCorrect ? 'correct' : 'wrong');

    setTimeout(nextQuestion, 500);
}

function calculateScore(isCorrect, seconds) {
    if (!isCorrect) return 0;

    let points = 5; // Base accuracy points

    // Speed bonus
    if (seconds < 2) points += 3;
    else if (seconds < 4) points += 2;
    else if (seconds < 6) points += 1;

    return points;
}

function showResults() {
    showScreen('results');

    const totalTime = answersData.reduce((acc, curr) => acc + curr.timeTaken, 0);
    const avgTime = totalTime / TOTAL_QUESTIONS;

    elements.resScore.innerText = score;
    elements.resAccuracy.innerText = `${correctCount} / ${TOTAL_QUESTIONS}`;
    elements.resAvgTime.innerText = `${avgTime.toFixed(1)}s`;

    saveGameData(score, correctCount, avgTime);
    updateBestScoreDisplay();
}

// --- Persistence Functions ---

function saveGameData(finalScore, accuracy, avgTime) {
    // Save High Score
    const currentHigh = parseInt(localStorage.getItem(LS_HIGH_SCORE)) || 0;
    if (finalScore > currentHigh) {
        localStorage.setItem(LS_HIGH_SCORE, finalScore);
    }

    // Save to History
    const history = JSON.parse(localStorage.getItem(LS_GAME_HISTORY)) || [];
    const gameRecord = {
        date: new Date().toISOString(),
        score: finalScore,
        accuracy: `${accuracy}/${TOTAL_QUESTIONS}`,
        avgTime: avgTime.toFixed(2)
    };
    history.push(gameRecord);

    // Keep only last 50 games
    if (history.length > 50) history.shift();

    localStorage.setItem(LS_GAME_HISTORY, JSON.stringify(history));
}

function updateBestScoreDisplay() {
    const high = localStorage.getItem(LS_HIGH_SCORE) || 0;
    if (elements.bestScoreDisplay) {
        elements.bestScoreDisplay.innerText = `High Score: ${high}`;
    }
}

// --- Helper Functions ---

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}
