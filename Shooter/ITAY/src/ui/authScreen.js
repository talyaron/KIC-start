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

            // Handle common "user cancelled" error gracefully
            if (error.code === 'auth/popup-closed-by-user') {
                this.showError('Sign-in cancelled');
                return;
            }

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
