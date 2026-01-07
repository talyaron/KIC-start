// Game Configuration
const TOTAL_QUESTIONS = 20;
const POINTS_CORRECT = 5;
const BONUS_TIME_3 = 2; // under 2 seconds
const BONUS_TIME_2 = 4; // under 4 seconds
const BONUS_TIME_1 = 6; // under 6 seconds

// Translations
const translations = {
    en: {
        titleMain: "Multiplication",
        titleSub: "Challenge",
        subtitle: "Test your math skills! 20 Questions. Speed Bonuses.",
        accuracy: "Accuracy<br><strong>5 pts</strong>",
        speedBonus: "Speed Bonus<br><strong>Up to +3 pts</strong>",
        startBtn: "Start Game",
        questionLabel: "Question",
        timeLabel: "Time",
        submitBtn: "Submit Answer",
        gameOver: "Game Over!",
        finalScore: "Final Score",
        statCorrect: "Correct",
        statAccuracy: "Accuracy",
        statTime: "Total Time",
        playAgain: "Play Again",
        correctMsg: "Correct! +{pts} pts",
        wrongMsg: "Wrong! The answer was {ans}"
    },
    he: {
        titleMain: "אתגר",
        titleSub: "הכפל",
        subtitle: "!בחן את כישוריך! 20 שאלות. בונוס מהירות",
        accuracy: "דיוק<br><strong>5 נק׳</strong>",
        speedBonus: "בונוס מהירות<br><strong>עד +3 נק׳</strong>",
        startBtn: "התחל משחק",
        questionLabel: "שאלה",
        timeLabel: "זמן",
        submitBtn: "שלח תשובה",
        gameOver: "!המשחק נגמר",
        finalScore: "ניקוד סופי",
        statCorrect: "נכון",
        statAccuracy: "דיוק",
        statTime: "זמן כולל",
        playAgain: "שחק שוב",
        correctMsg: "נכון! +{pts} נקודות",
        wrongMsg: "טעות! התשובה הייתה {ans}"
    },
    es: {
        titleMain: "Desafío de",
        titleSub: "Multiplicación",
        subtitle: "¡Prueba tus habilidades! 20 Preguntas. Bonos de velocidad.",
        accuracy: "Precisión<br><strong>5 pts</strong>",
        speedBonus: "Bono Velocidad<br><strong>Hasta +3 pts</strong>",
        startBtn: "Empezar",
        questionLabel: "Pregunta",
        timeLabel: "Tiempo",
        submitBtn: "Enviar Respuesta",
        gameOver: "¡Juego Terminado!",
        finalScore: "Puntaje Final",
        statCorrect: "Correcto",
        statAccuracy: "Precisión",
        statTime: "Tiempo Total",
        playAgain: "Jugar de Nuevo",
        correctMsg: "¡Correcto! +{pts} pts",
        wrongMsg: "¡Incorrecto! Era {ans}"
    }
};

let currentLang = 'en';

// Game State
let gameState = {
    currentQuestionIndex: 0,
    score: 0,
    startTime: 0,
    timerInterval: null,
    correctAnswers: 0,
    answers: [],
    currentProblem: { n1: 0, n2: 0, ans: 0 },
    gameStartTime: 0,
    gameEndTime: 0
};


// DOM Elements
const screens = {
    mode: document.getElementById('mode-screen'),
    start: document.getElementById('start-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    questionProgress: document.getElementById('question-progress'),
    timerDisplay: document.getElementById('timer-display'),
    currentScore: document.getElementById('current-score-display'),
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    input: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-btn'),
    feedback: document.getElementById('feedback-msg'),
    finalScore: document.getElementById('final-score'),
    correctCount: document.getElementById('correct-count'),
    accuracyDisplay: document.getElementById('accuracy-display'),
    totalTime: document.getElementById('total-time'),
    langBtns: document.querySelectorAll('.lang-btn')
};

// Event Listeners
elements.startBtn.addEventListener('click', startGame);
elements.restartBtn.addEventListener('click', () => {
    // If multiplayer, maybe just reset to lobby? For now, standard reset.
    if (typeof window.isMultiplayerMode === 'function' && window.isMultiplayerMode()) {
        showScreen('lobby');
        return;
    }
    startGame();
});
elements.submitBtn.addEventListener('click', handleSubmit);
elements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});

// Language Switcher Listener
elements.langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
    });
});

// Functions
function setLanguage(lang) {
    currentLang = lang;

    // Update active button state
    elements.langBtns.forEach(b => {
        b.classList.remove('active');
        if (b.getAttribute('data-lang') === lang) {
            b.classList.add('active');
        }
    });

    // Handle RTL
    if (lang === 'he') {
        document.body.setAttribute('dir', 'rtl');
        document.documentElement.lang = 'he';
    } else {
        document.body.removeAttribute('dir');
        document.documentElement.lang = lang;
    }

    // Translate all elements with data-i18n
    const translatableElements = document.querySelectorAll('[data-i18n]');
    translatableElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

function showScreen(screenName) {
    // Hide all
    Object.values(screens).forEach(s => {
        if (s) { // check if exists
            s.classList.remove('active');
            s.classList.add('hidden');
        }
    });
    // Show target
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        screens[screenName].classList.add('active');
    }
}

function startGame() {
    // Reset state
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.answers = [];
    gameState.gameStartTime = Date.now();
    gameState.finished = false;

    // UI Reset
    elements.input.value = '';
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback hidden';
    if (elements.currentScore) elements.currentScore.textContent = '0';

    showScreen('game');
    nextQuestion();

    // Initial sync
    if (window.onGameStateUpdate) window.onGameStateUpdate(gameState);
}

// Global Alias for Multiplayer Script
window.startActualGame = startGame;

function generateQuestion() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    gameState.currentProblem = {
        n1,
        n2,
        ans: n1 * n2
    };

    elements.num1.textContent = n1;
    elements.num2.textContent = n2;
}

function startTimer() {
    gameState.startTime = Date.now();
    updateTimerDisplay(0);

    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
        const elapsed = (Date.now() - gameState.startTime) / 1000;
        updateTimerDisplay(elapsed);
    }, 100);
}

function updateTimerDisplay(seconds) {
    elements.timerDisplay.textContent = seconds.toFixed(1) + 's';
}

function stopTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    return elapsed;
}

function nextQuestion() {
    if (gameState.currentQuestionIndex >= TOTAL_QUESTIONS) {
        endGame();
        return;
    }

    gameState.currentQuestionIndex++;
    elements.questionProgress.textContent = `${gameState.currentQuestionIndex} / ${TOTAL_QUESTIONS}`;
    elements.input.value = '';
    elements.input.focus();
    elements.feedback.classList.add('hidden');

    generateQuestion();
    startTimer();
}

function handleSubmit() {
    if (elements.input.value === '') return;

    const timeTaken = stopTimer();
    const userVal = parseInt(elements.input.value);
    const correct = userVal === gameState.currentProblem.ans;

    processAnswer(correct, timeTaken);
}

function processAnswer(isCorrect, timeTaken) {
    let points = 0;
    let bonus = 0;

    if (isCorrect) {
        points = POINTS_CORRECT;
        gameState.correctAnswers++;

        if (timeTaken < BONUS_TIME_3) bonus = 3;
        else if (timeTaken < BONUS_TIME_2) bonus = 2;
        else if (timeTaken < BONUS_TIME_1) bonus = 1;

        showFeedback(true, points + bonus);
    } else {
        showFeedback(false, 0);
    }

    gameState.score += (points + bonus);
    if (elements.currentScore) elements.currentScore.textContent = gameState.score;

    gameState.answers.push({
        q: gameState.currentQuestionIndex,
        correct: isCorrect,
        time: timeTaken,
        pts: points + bonus
    });

    // Multiplayer Sync Hook
    if (window.onGameStateUpdate) window.onGameStateUpdate(gameState);

    setTimeout(() => {
        nextQuestion();
    }, 1000);
}

function showFeedback(isCorrect, points) {
    elements.feedback.classList.remove('hidden', 'correct', 'wrong');
    const t = translations[currentLang];

    if (isCorrect) {
        elements.feedback.classList.add('correct');
        elements.feedback.textContent = t.correctMsg.replace('{pts}', points);
    } else {
        elements.feedback.classList.add('wrong');
        elements.feedback.textContent = t.wrongMsg.replace('{ans}', gameState.currentProblem.ans);
    }
}

function endGame() {
    gameState.gameEndTime = Date.now();
    gameState.finished = true;
    const totalTimeSeconds = (gameState.gameEndTime - gameState.gameStartTime) / 1000;

    elements.finalScore.textContent = gameState.score;
    elements.correctCount.textContent = `${gameState.correctAnswers}/${TOTAL_QUESTIONS}`;

    const accuracy = Math.round((gameState.correctAnswers / TOTAL_QUESTIONS) * 100);
    elements.accuracyDisplay.textContent = `${accuracy}%`;

    elements.totalTime.textContent = `${totalTimeSeconds.toFixed(1)}s`;

    // Multiplayer Sync Hook (Final)
    if (window.onGameStateUpdate) window.onGameStateUpdate(gameState);

    showScreen('results');
}

// Initial Lang Set
setLanguage('en');

