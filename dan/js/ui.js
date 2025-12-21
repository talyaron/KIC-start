const GameUI = {
    screens: ['screen-home', 'screen-store', 'screen-custom', 'screen-skills', 'screen-team'],

    init: function () {
        console.log("UI Initializing...");

        // Navigation Buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                this.showScreen(targetId);

                // Update active button state
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Missions Button (Toggle overlay - placeholder for now)
        document.getElementById('btn-missions').addEventListener('click', () => {
            alert("Daily Missions:\n1. Destroy 50 Squares\n2. Win 3 Matches\n3. Play with a Friend");
        });
    },

    showScreen: function (screenId) {
        // Hide all screens
        this.screens.forEach(id => {
            document.getElementById(id).classList.remove('active');
        });
        // Show target
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    },

    showAuth: function () {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-hud').classList.add('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    },

    showMainHud: function () {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-hud').classList.remove('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    },

    showGameHud: function () {
        document.getElementById('main-hud').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
    },

    updateUserInfo: function (userData) {
        const idDisplay = document.getElementById('display-id');
        if (userData && userData.shortId) {
            idDisplay.textContent = userData.shortId;
            idDisplay.style.color = '#00f3ff';
            idDisplay.style.textShadow = '0 0 10px #00f3ff';
        } else {
            idDisplay.textContent = "ERR";
        }
    }
};

window.GameUI = GameUI;

// Initialize UI when DOM is ready
window.addEventListener('DOMContentLoaded', () => GameUI.init());
