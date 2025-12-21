// Firestore Operations Module (User Profiles, Stats, Upgrades, etc.)

import { firestore } from './config.js';
import { generateUniqueUserCode } from '../utils/idGenerator.js';
import { CONFIG } from '../config.js';

/**
 * Create a new user profile
 * @param {string} uid - User ID
 * @param {Object} userData - User data
 */
export async function createUserProfile(uid, userData) {
    const userCode = await generateUniqueUserCode(firestore);

    const profile = {
        displayName: userData.displayName || 'Guest',
        authType: userData.authType || 'guest',
        userCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        stats: {
            totalKills: 0,
            totalScore: 0,
            gamesPlayed: 0,
            redKills: 0,
            yellowKills: 0,
            blueKills: 0,
        },
        currency: 0,
        cosmeticsOwned: ['default'],
        selectedCosmetic: 'default',
        upgrades: {
            fireRateLevel: 0,
            damageLevel: 0,
            hpLevel: 0,
            speedLevel: 0,
        },
        friends: [],
        missions: {
            daily: initializeMissions(CONFIG.MISSIONS.DAILY),
            weekly: initializeMissions(CONFIG.MISSIONS.WEEKLY),
        },
    };

    await firestore.collection('users').doc(uid).set(profile);

    return profile;
}

/**
 * Initialize mission progress
 * @param {Array} missions - Mission definitions
 * @returns {Object} Mission progress object
 */
function initializeMissions(missions) {
    const progress = {};
    missions.forEach(mission => {
        progress[mission.id] = {
            progress: 0,
            completed: false,
            claimed: false,
        };
    });
    return progress;
}

/**
 * Get user profile
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User profile
 */
export async function getUserProfile(uid) {
    try {
        const doc = await firestore.collection('users').doc(uid).get();
        return doc.exists ? { uid, ...doc.data() } : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Get user profile by user code
 * @param {string} userCode - 6-digit user code
 * @returns {Promise<Object|null>} User profile
 */
export async function getUserProfileByCode(userCode) {
    try {
        const querySnapshot = await firestore
            .collection('users')
            .where('userCode', '==', userCode)
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        return { uid: doc.id, ...doc.data() };
    } catch (error) {
        console.error('Error getting user by code:', error);
        return null;
    }
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 */
export async function updateUserProfile(uid, updates) {
    try {
        await firestore.collection('users').doc(uid).update(updates);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Update user stats after game
 * @param {string} uid - User ID
 * @param {Object} gameStats - Game statistics
 */
export async function updateGameStats(uid, gameStats) {
    const updates = {
        'stats.totalKills': firebase.firestore.FieldValue.increment(gameStats.totalKills || 0),
        'stats.totalScore': firebase.firestore.FieldValue.increment(gameStats.score || 0),
        'stats.gamesPlayed': firebase.firestore.FieldValue.increment(1),
        'stats.redKills': firebase.firestore.FieldValue.increment(gameStats.redKills || 0),
        'stats.yellowKills': firebase.firestore.FieldValue.increment(gameStats.yellowKills || 0),
        'stats.blueKills': firebase.firestore.FieldValue.increment(gameStats.blueKills || 0),
        currency: firebase.firestore.FieldValue.increment(gameStats.currencyEarned || 0),
    };

    await updateUserProfile(uid, updates);

    // Update mission progress
    await updateMissionProgress(uid, gameStats);
}

/**
 * Update mission progress
 * @param {string} uid - User ID
 * @param {Object} gameStats - Game statistics
 */
async function updateMissionProgress(uid, gameStats) {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    let missionUpdates = {};

    // Daily missions
    CONFIG.MISSIONS.DAILY.forEach(mission => {
        const key = `missions.daily.${mission.id}`;
        const current = profile.missions?.daily?.[mission.id];

        if (current && !current.completed) {
            let increment = 0;

            switch (mission.type) {
                case 'kills':
                    increment = gameStats.totalKills || 0;
                    break;
                case 'red_kills':
                    increment = gameStats.redKills || 0;
                    break;
                case 'blue_kills':
                    increment = gameStats.blueKills || 0;
                    break;
                case 'survival_time':
                    increment = gameStats.survivalTime || 0;
                    break;
            }

            if (increment > 0) {
                missionUpdates[`${key}.progress`] = firebase.firestore.FieldValue.increment(increment);
            }
        }
    });

    // Weekly missions
    CONFIG.MISSIONS.WEEKLY.forEach(mission => {
        const key = `missions.weekly.${mission.id}`;
        const current = profile.missions?.weekly?.[mission.id];

        if (current && !current.completed) {
            let increment = 0;

            switch (mission.type) {
                case 'kills':
                    increment = gameStats.totalKills || 0;
                    break;
                case 'blue_kills':
                    increment = gameStats.blueKills || 0;
                    break;
            }

            if (increment > 0) {
                missionUpdates[`${key}.progress`] = firebase.firestore.FieldValue.increment(increment);
            }
        }
    });

    if (Object.keys(missionUpdates).length > 0) {
        await updateUserProfile(uid, missionUpdates);
    }
}

/**
 * Purchase item from shop
 * @param {string} uid - User ID
 * @param {string} itemId - Item ID
 * @param {number} price - Item price
 */
export async function purchaseItem(uid, itemId, price) {
    const profile = await getUserProfile(uid);

    if (profile.currency < price) {
        throw new Error('Insufficient currency');
    }

    await updateUserProfile(uid, {
        currency: firebase.firestore.FieldValue.increment(-price),
        cosmeticsOwned: firebase.firestore.FieldValue.arrayUnion(itemId),
    });
}

/**
 * Purchase upgrade
 * @param {string} uid - User ID
 * @param {string} upgradeType - Upgrade type
 * @param {number} cost - Upgrade cost
 */
export async function purchaseUpgrade(uid, upgradeType, cost) {
    const profile = await getUserProfile(uid);

    if (profile.currency < cost) {
        throw new Error('Insufficient currency');
    }

    const currentLevel = profile.upgrades[upgradeType] || 0;

    await updateUserProfile(uid, {
        currency: firebase.firestore.FieldValue.increment(-cost),
        [`upgrades.${upgradeType}`]: currentLevel + 1,
    });
}

/**
 * Add friend
 * @param {string} uid - User ID
 * @param {string} friendCode - Friend's 6-digit code
 */
export async function addFriend(uid, friendCode) {
    const profile = await getUserProfile(uid);
    const friendProfile = await getUserProfileByCode(friendCode);

    if (!friendProfile) {
        throw new Error('Friend not found');
    }

    if (friendProfile.uid === uid) {
        throw new Error('Cannot add yourself as a friend');
    }

    if (profile.friends.includes(friendCode)) {
        throw new Error('Already friends');
    }

    await updateUserProfile(uid, {
        friends: firebase.firestore.FieldValue.arrayUnion(friendCode),
    });
}

/**
 * Remove friend
 * @param {string} uid - User ID
 * @param {string} friendCode - Friend's 6-digit code
 */
export async function removeFriend(uid, friendCode) {
    await updateUserProfile(uid, {
        friends: firebase.firestore.FieldValue.arrayRemove(friendCode),
    });
}

/**
 * Claim mission reward
 * @param {string} uid - User ID
 * @param {string} missionType - 'daily' or 'weekly'
 * @param {string} missionId - Mission ID
 * @param {number} reward - Reward amount
 */
export async function claimMissionReward(uid, missionType, missionId, reward) {
    await updateUserProfile(uid, {
        [`missions.${missionType}.${missionId}.claimed`]: true,
        currency: firebase.firestore.FieldValue.increment(reward),
    });
}
