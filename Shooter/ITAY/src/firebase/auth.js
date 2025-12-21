// Firebase Authentication Module

import firebase, { auth } from './config.js';
import { createUserProfile, getUserProfile } from './firestore.js';
import { showToast } from '../utils/helpers.js';

let currentUser = null;

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object
 */
export async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);

        // Create/load user profile
        await ensureUserProfile(result.user);

        return result.user;
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in cancelled. Please keep the window open to log in.');
        }
        console.error('Google sign-in error:', error);
        throw error;
    }
}

/**
 * Sign in as guest (anonymous)
 * @returns {Promise<Object>} User object
 */
export async function signInAsGuest() {
    try {
        const result = await auth.signInAnonymously();

        // Create/load user profile
        await ensureUserProfile(result.user);

        return result.user;
    } catch (error) {
        console.error('Guest sign-in error:', error);
        throw error;
    }
}

/**
 * Sign out current user
 */
export async function signOut() {
    try {
        await auth.signOut();
        currentUser = null;
        showToast('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Setup auth state change listener
 * @param {Function} callback - Callback function(user)
 */
export function onAuthStateChange(callback) {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;

            // Ensure user profile exists
            await ensureUserProfile(user);
        } else {
            currentUser = null;
        }

        callback(user);
    });
}

/**
 * Ensure user profile exists in Firestore, create if not
 * @param {Object} user - Firebase user object
 */
async function ensureUserProfile(user) {
    try {
        // Try to get existing profile
        let profile = await getUserProfile(user.uid);

        if (!profile) {
            // Create new profile
            const authType = user.isAnonymous ? 'guest' : 'google';
            const displayName = user.displayName || `Guest${Math.floor(Math.random() * 1000)}`;

            await createUserProfile(user.uid, {
                displayName,
                authType,
            });

            console.log('Created new user profile:', user.uid);
        } else {
            console.log('User profile loaded:', profile.userCode);
        }
    } catch (error) {
        console.error('Error ensuring user profile:', error);
        throw error;
    }
}
