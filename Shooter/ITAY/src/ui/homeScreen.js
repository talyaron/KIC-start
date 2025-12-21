// Enhanced Home Screen Module

import { getUserProfile } from '../firebase/firestore.js';
import { signOut } from '../firebase/auth.js';
import { copyToClipboard, showToast } from '../utils/helpers.js';

export class HomeScreen {
    constructor(onNavigate) {
        this.onNavigate = onNavigate;
        this.screenEl = document.getElementById('home-screen');
        this.currentUser = null;

        this.render();
    }

    render() {
        this.screenEl.innerHTML = `
            <div class="home-container">
                <!-- User Profile Header -->
                <div class="user-header">
                    <div class="user-main">
                        <div class="user-avatar-large" id="user-avatar">?</div>
                        <div class="user-details">
                            <h2 id="welcome-message">Hello, Player!</h2>
                            <div class="user-id-badge">
                                <span>ID:</span>
                                <span id="user-code-display">------</span>
                                <button id="copy-user-code-btn" class="icon-btn-tiny">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button id="sign-out-btn" class="logout-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>

                <!-- Stats Summary -->
                <div class="stats-grid">
                    <div class="stat-card gold">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-label">Currency</div>
                            <div class="stat-value" id="user-currency">0</div>
                        </div>
                    </div>
                    <div class="stat-card purple">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <div class="stat-label">Best Score</div>
                            <div class="stat-value" id="user-best-score">0</div>
                        </div>
                    </div>
                    <div class="stat-card blue">
                        <div class="stat-icon">💀</div>
                        <div class="stat-info">
                            <div class="stat-label">Total Kills</div>
                            <div class="stat-value" id="user-total-kills">0</div>
                        </div>
                    </div>
                </div>

                <!-- Action Banner -->
                <div class="action-banner ripple" id="play-online-btn">
                    <div class="banner-content">
                        <h3>READY FOR BATTLE?</h3>
                        <p>Join thousands of players online</p>
                        <div class="play-btn-large">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="10 8 16 12 10 16 10 8"></polygon>
                            </svg>
                            PLAY NOW
                        </div>
                    </div>
                    <div class="banner-visual">
                        <div class="floating-sq red"></div>
                        <div class="floating-sq yellow"></div>
                        <div class="floating-sq blue"></div>
                    </div>
                </div>

                <!-- Secondary Actions -->
                <div class="secondary-menu">
                    <button id="create-join-btn" class="menu-tile">
                        <span class="tile-icon">👥</span>
                        <span class="tile-text">Play with Friends</span>
                    </button>
                    <button id="missions-btn" class="menu-tile">
                        <span class="tile-icon">🎯</span>
                        <span class="tile-text">Missions</span>
                    </button>
                </div>
            </div>

            <!-- Bottom Navigation -->
            <nav class="bottom-nav">
                <button class="nav-btn" data-screen="shop">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Shop</span>
                </button>
                <button class="nav-btn" data-screen="customize">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span>Skins</span>
                </button>
                <button class="nav-btn active" data-screen="home">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Home</span>
                </button>
                <button class="nav-btn" data-screen="upgrades">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                    <span>Skills</span>
                </button>
                <button class="nav-btn" data-screen="friends">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Social</span>
                </button>
            </nav>
        `;

        this.setupListeners();
    }

    setupListeners() {
        const copyBtn = document.getElementById('copy-user-code-btn');
        const codeDisplay = document.getElementById('user-code-display');
        const signOutBtn = document.getElementById('sign-out-btn');
        const playBtn = document.getElementById('play-online-btn');
        const friendsBtn = document.getElementById('create-join-btn');
        const missionsBtn = document.getElementById('missions-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyToClipboard(codeDisplay.textContent);
            });
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to sign out?')) {
                    await signOut();
                    this.onNavigate('auth');
                }
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', () => this.onNavigate('create-room'));
        }

        if (friendsBtn) {
            friendsBtn.addEventListener('click', () => this.onNavigate('lobby'));
        }

        if (missionsBtn) {
            missionsBtn.addEventListener('click', () => this.onNavigate('missions'));
        }

        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.onNavigate(screen);
            });
        });
    }

    async loadUserData(user) {
        if (!user) return;
        this.currentUser = await getUserProfile(user.uid);
        if (this.currentUser) {
            this.updateUI();
        }
    }

    async setUser(user) {
        await this.loadUserData(user);
    }

    updateUI() {
        const welcome = document.getElementById('welcome-message');
        const avatar = document.getElementById('user-avatar');
        const codeDisp = document.getElementById('user-code-display');
        const currency = document.getElementById('user-currency');
        const bestScore = document.getElementById('user-best-score');
        const totalKills = document.getElementById('user-total-kills');

        if (welcome) welcome.textContent = `Hello, ${this.currentUser.displayName || 'Player'}!`;
        if (avatar) avatar.textContent = (this.currentUser.displayName || 'P').charAt(0).toUpperCase();
        if (codeDisp) codeDisp.textContent = this.currentUser.userCode;
        if (currency) currency.textContent = this.currentUser.currency || 0;
        if (bestScore) bestScore.textContent = this.currentUser.stats?.totalScore || 0;
        if (totalKills) totalKills.textContent = this.currentUser.stats?.totalKills || 0;
    }

    show() {
        this.screenEl.classList.add('active');
        if (this.currentUser) this.updateUI();
    }

    hide() {
        this.screenEl.classList.remove('active');
    }
}
