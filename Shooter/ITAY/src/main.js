// Main Application Entry Point

import './firebase/config.js';
import { onAuthStateChange, getCurrentUser } from './firebase/auth.js';
import { AuthScreen } from './ui/authScreen.js';
import { HomeScreen } from './ui/homeScreen.js';
import { LobbyScreen } from './ui/lobbyScreen.js';
import { GameScreen } from './ui/gameScreen.js';
import { EndScreen } from './ui/endScreen.js';
import { ShopScreen } from './ui/shopScreen.js';
import { CustomizeScreen } from './ui/customizeScreen.js';
import { UpgradesScreen } from './ui/upgradesScreen.js';
import { FriendsScreen } from './ui/friendsScreen.js';
import { MissionsScreen } from './ui/missionsScreen.js';

class App {
    constructor() {
        this.currentScreen = null;
        this.currentUser = null;

        // Initialize screens
        this.screens = {
            auth: new AuthScreen(),
            home: new HomeScreen((screen) => this.navigate(screen)),
            lobby: new LobbyScreen(
                (screen) => this.navigate(screen),
                (roomCode, roomData, isHost) => this.handleStartGame(roomCode, roomData, isHost)
            ),
            game: new GameScreen((stats) => this.handleGameEnd(stats)),
            end: new EndScreen((screen) => this.navigate(screen)),
            shop: new ShopScreen(),
            customize: new CustomizeScreen(),
            upgrades: new UpgradesScreen(),
            friends: new FriendsScreen(),
            missions: new MissionsScreen(),
        };

        this.init();
    }

    init() {
        console.log('🎮 Initializing Shooter game...');

        // Setup auth state listener
        onAuthStateChange((user) => {
            this.handleAuthStateChange(user);
        });
    }

    async handleAuthStateChange(user) {
        if (user) {
            console.log('✅ User authenticated:', user.uid);
            this.currentUser = user;

            // Load user data for home screen
            await this.screens.home.loadUserData(user);

            // Set user for all other screens
            const userScreens = ['lobby', 'shop', 'friends', 'upgrades', 'missions', 'customize'];
            for (const screen of userScreens) {
                if (this.screens[screen].setUser) {
                    await this.screens[screen].setUser(user);
                }
            }

            // Navigate to home
            this.navigate('home');
        } else {
            console.log('👤 User not authenticated');
            this.currentUser = null;
            this.navigate('auth');
        }
    }

    navigate(screenName) {
        console.log('📍 Navigate to:', screenName);

        // Special handling for create-room
        if (screenName === 'create-room') {
            this.screens.lobby.setMode('multiplayer');
            this.navigate('lobby');
            // Auto-trigger create room
            setTimeout(() => {
                const createBtn = document.getElementById('create-room-btn');
                if (createBtn) createBtn.click();
            }, 200);
            return;
        }

        if (screenName === 'lobby') {
            this.screens.lobby.setMode('multiplayer');
        }

        // Hide current screen
        if (this.currentScreen) {
            this.screens[this.currentScreen].hide();
        }

        // Show new screen
        if (this.screens[screenName]) {
            this.screens[screenName].show();
            this.currentScreen = screenName;
        } else {
            console.error('Unknown screen:', screenName);
        }
    }

    async handleStartGame(roomCode, roomData, isHost) {
        console.log('🎮 Starting game...', { roomCode, isHost });

        // Hide lobby
        this.screens.lobby.hide();

        // Show game screen
        this.screens.game.show();

        // Start game
        await this.screens.game.startGame(roomCode, roomData, this.currentUser, isHost);

        this.currentScreen = 'game';
    }

    handleGameEnd(stats) {
        console.log('🏁 Game ended', stats);

        // Hide game
        this.screens.game.hide();

        // Show end screen with stats
        this.screens.end.show();
        this.screens.end.showResults(stats);

        this.currentScreen = 'end';
    }
}

// Initialize app when DOM is ready
console.log('🚀 Shooter - Multiplayer Combat Arena');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}
