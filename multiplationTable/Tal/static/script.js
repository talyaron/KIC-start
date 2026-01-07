/**
 * Multiplication Challenge - Frontend Game Logic
 */

// Game State
let sessionId = null;
let timerInterval = null;
let currentTime = 0;

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    startBtn: document.getElementById('start-btn'),
    submitBtn: document.getElementById('submit-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    answerInput: document.getElementById('answer-input'),
    currentQ: document.getElementById('current-q'),
    totalQ: document.getElementById('total-q'),
    num1: document.getElementById('num1'),
    num2: document.getElementById('num2'),
    timerDisplay: document.getElementById('timer-display'),
    progressFill: document.getElementById('progress-fill'),
    feedback: document.getElementById('feedback'),
    currentScore: document.getElementById('current-score'),
    correctCount: document.getElementById('correct-count'),
    accuracy: document.getElementById('accuracy'),
    totalTime: document.getElementById('total-time'),
    finalScore: document.getElementById('final-score'),
    rating: document.getElementById('rating')
};

// API Functions
async function apiCall(endpoint, data = {}) {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Screen Management
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Timer Functions
function startTimer() {
    currentTime = 0;
    elements.timerDisplay.textContent = '0.0';

    timerInterval = setInterval(() => {
        currentTime += 0.1;
        elements.timerDisplay.textContent = currentTime.toFixed(1);
    }, 100);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Game Functions
async function startGame() {
    const result = await apiCall('start-game');
    sessionId = result.session_id;

    elements.currentScore.textContent = '0';
    elements.progressFill.style.width = '0%';

    showScreen('game');
    await loadQuestion();
}

async function loadQuestion() {
    const result = await apiCall('get-question', { session_id: sessionId });

    if (result.error) {
        console.error(result.error);
        return;
    }

    elements.currentQ.textContent = result.question_number;
    elements.totalQ.textContent = result.total_questions;
    elements.num1.textContent = result.num1;
    elements.num2.textContent = result.num2;

    // Update progress bar
    const progress = ((result.question_number - 1) / result.total_questions) * 100;
    elements.progressFill.style.width = `${progress}%`;

    // Reset input and feedback
    elements.answerInput.value = '';
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback';
    elements.answerInput.disabled = false;
    elements.submitBtn.disabled = false;

    // Focus input and start timer
    elements.answerInput.focus();
    startTimer();
}

async function submitAnswer() {
    const answer = elements.answerInput.value.trim();

    if (!answer) {
        elements.answerInput.focus();
        return;
    }

    stopTimer();
    elements.answerInput.disabled = true;
    elements.submitBtn.disabled = true;

    const result = await apiCall('submit-answer', {
        session_id: sessionId,
        answer: parseInt(answer)
    });

    if (result.error) {
        console.error(result.error);
        return;
    }

    // Show feedback
    showFeedback(result);

    // Update score
    elements.currentScore.textContent = result.total_score;

    // Continue or show results
    setTimeout(async () => {
        if (result.game_complete) {
            await showResults();
        } else {
            await loadQuestion();
        }
    }, 1500);
}

function showFeedback(result) {
    const questionArea = document.querySelector('.question-area');

    if (result.is_correct) {
        let bonusText = '';
        if (result.speed_bonus > 0) {
            bonusText = ` (+${result.speed_bonus} speed bonus!)`;
        }
        elements.feedback.textContent = `Correct! +${result.question_score} points${bonusText}`;
        elements.feedback.className = 'feedback correct';
        questionArea.classList.add('correct-animation');
    } else {
        elements.feedback.textContent = `Wrong! The answer was ${result.correct_answer}`;
        elements.feedback.className = 'feedback wrong';
        questionArea.classList.add('wrong-animation');
    }

    // Remove animation class after it completes
    setTimeout(() => {
        questionArea.classList.remove('correct-animation', 'wrong-animation');
    }, 300);
}

async function showResults() {
    const result = await apiCall('get-results', { session_id: sessionId });

    if (result.error) {
        console.error(result.error);
        return;
    }

    elements.correctCount.textContent = result.correct_count;
    elements.accuracy.textContent = result.accuracy_percentage;
    elements.totalTime.textContent = result.total_time;
    elements.finalScore.textContent = result.final_score;

    // Calculate rating
    const scorePercentage = (result.final_score / 160) * 100;
    let ratingText, ratingClass;

    if (scorePercentage >= 90) {
        ratingText = 'Excellent! Math Master!';
        ratingClass = 'excellent';
    } else if (scorePercentage >= 70) {
        ratingText = 'Great Job!';
        ratingClass = 'great';
    } else if (scorePercentage >= 50) {
        ratingText = 'Good Effort!';
        ratingClass = 'good';
    } else {
        ratingText = 'Keep Practicing!';
        ratingClass = 'keep-practicing';
    }

    elements.rating.textContent = ratingText;
    elements.rating.className = `rating ${ratingClass}`;

    // Save high score to localStorage
    saveHighScore(result.final_score);

    showScreen('results');
}

function saveHighScore(score) {
    const highScore = localStorage.getItem('multiplicationHighScore') || 0;
    if (score > highScore) {
        localStorage.setItem('multiplicationHighScore', score);
    }
}

// Event Listeners
elements.startBtn.addEventListener('click', startGame);
elements.submitBtn.addEventListener('click', submitAnswer);
elements.playAgainBtn.addEventListener('click', () => {
    showScreen('start');
});

// Enter key support
elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !elements.submitBtn.disabled) {
        submitAnswer();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showScreen('start');
});
