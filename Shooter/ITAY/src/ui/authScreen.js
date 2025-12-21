// Auth Screen Module

import { signInWithGoogle, signInAsGuest } from '../firebase/auth.js';
import { showToast } from '../utils/helpers.js';

export class AuthScreen {
    constructor() {
        this.screenEl = document.getElementById('auth-screen');
        this.googleBtn = document.getElementById('google-signin-btn');
        this.guestBtn = document.getElementById('guest-signin-btn');
        this.loadingEl = document.getElementById('auth-loading');
        this.errorEl = document.getElementById('auth-error');

        this.setupListeners();
    }

    setupListeners() {
        this.googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        this.guestBtn.addEventListener('click', () => this.handleGuestSignIn());
    }

    async handleGoogleSignIn() {
        try {
            this.showLoading(true);
            this.hideError();

            await signInWithGoogle();

            showToast('Signed in successfully!', 'success');
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showError(error.message || 'Failed to sign in with Google');
        } finally {
            this.showLoading(false);
        }
    }

    async handleGuestSignIn() {
        try {
            this.showLoading(true);
            this.hideError();

            await signInAsGuest();

            showToast('Signed in as guest!', 'success');
        } catch (error) {
            console.error('Guest sign-in error:', error);
            this.showError(error.message || 'Failed to sign in as guest');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        this.loadingEl.classList.toggle('hidden', !show);
        this.googleBtn.disabled = show;
        this.guestBtn.disabled = show;

        if (show) {
            this.googleBtn.innerHTML = '<span>Connecting...</span>';
            this.guestBtn.innerHTML = '<span>Connecting...</span>';
        } else {
            this.googleBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
            `;
            this.guestBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Continue as Guest</span>
            `;
        }
    }

    showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove('hidden');
    }

    hideError() {
        this.errorEl.classList.add('hidden');
    }

    show() {
        this.screenEl.classList.add('active');
    }

    hide() {
        this.screenEl.classList.remove('active');
    }
}
