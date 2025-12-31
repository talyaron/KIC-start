// Migrated from Firestore to Realtime Database for better connectivity
import firebase, { database } from './config.js';
import { generateUniqueUserCode } from '../utils/idGenerator.js';
import { CONFIG } from '../config.js';

/**
 * Create a new user profile in Realtime Database
 * @param {string} uid - User ID
 * @param {Object} userData - User data
 */
export async function createUserProfile(uid, userData) {
    const userCode = await generateUniqueUserCode(database);

    const profile = {
        displayName: userData.displayName || 'Guest',
        authType: userData.authType || 'guest',
        userCode,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        stats: {
            totalKills: 0,
            totalScore: 0,
            gamesPlayed: 0,
            redKills: 0,
            yellowKills: 0,
            blueKills: 0,
        },
        currency: 0,
        cosmeticsOwned: { 'default': true },
        selectedCosmetic: 'default',
        upgrades: {
            fireRateLevel: 0,
            damageLevel: 0,
            hpLevel: 0,
            speedLevel: 0,
        },
        friends: {}, // Use object for RTDB sets
        missions: {
            daily: initializeMissions(CONFIG.MISSIONS.DAILY),
            weekly: initializeMissions(CONFIG.MISSIONS.WEEKLY),
        },
    };

    // Save profile and register the code
    await Promise.all([
        database.ref(`users/${uid}`).set(profile),
        database.ref(`codes/${userCode}`).set(uid)
    ]);

    return { uid, ...profile };
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
 * Get user profile from RTDB
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User profile
 */
export async function getUserProfile(uid) {
    try {
        const snapshot = await database.ref(`users/${uid}`).once('value');
        if (!snapshot.exists()) return null;

        const data = snapshot.val();

        // Convert cosmeticsOwned object to array if needed for UI compatibility
        if (data.cosmeticsOwned && !Array.isArray(data.cosmeticsOwned)) {
            data.cosmeticsOwned = Object.keys(data.cosmeticsOwned);
        }

        // Convert friends object to array
        if (data.friends && !Array.isArray(data.friends)) {
            data.friends = Object.keys(data.friends);
        } else if (!data.friends) {
            data.friends = [];
        }

        return { uid, ...data };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Get user profile by user code from RTDB
 * @param {string} userCode - 6-digit user code
 * @returns {Promise<Object|null>} User profile
 */
export async function getUserProfileByCode(userCode) {
    try {
        const snapshot = await database.ref(`codes/${userCode}`).once('value');
        if (!snapshot.exists()) return null;

        const uid = snapshot.val();
        return await getUserProfile(uid);
    } catch (error) {
        console.error('Error getting user by code:', error);
        return null;
    }
}

/**
 * Update user profile in RTDB
 * @param {string} uid - User ID
 * @param {Object} updates - Fields to update
 */
export async function updateUserProfile(uid, updates) {
    try {
        await database.ref(`users/${uid}`).update(updates);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Update user stats after game in RTDB
 * @param {string} uid - User ID
 * @param {Object} gameStats - Game statistics
 */
export async function updateGameStats(uid, gameStats) {
    const updates = {
        'stats/totalKills': firebase.database.ServerValue.increment(gameStats.totalKills || 0),
        'stats/totalScore': firebase.database.ServerValue.increment(gameStats.score || 0),
        'stats/gamesPlayed': firebase.database.ServerValue.increment(1),
        'stats/redKills': firebase.database.ServerValue.increment(gameStats.redKills || 0),
        'stats/yellowKills': firebase.database.ServerValue.increment(gameStats.yellowKills || 0),
        'stats/blueKills': firebase.database.ServerValue.increment(gameStats.blueKills || 0),
        'currency': firebase.database.ServerValue.increment(gameStats.currencyEarned || 0),
    };

    await updateUserProfile(uid, updates);

    // Update mission progress
    await updateMissionProgress(uid, gameStats);
}

/**
 * Update mission progress in RTDB
 * @param {string} uid - User ID
 * @param {Object} gameStats - Game statistics
 */
async function updateMissionProgress(uid, gameStats) {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    let missionUpdates = {};

    // Daily missions
    CONFIG.MISSIONS.DAILY.forEach(mission => {
        const key = `missions/daily/${mission.id}`;
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
                missionUpdates[`${key}/progress`] = firebase.database.ServerValue.increment(increment);
            }
        }
    });

    // Weekly missions
    CONFIG.MISSIONS.WEEKLY.forEach(mission => {
        const key = `missions/weekly/${mission.id}`;
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
                missionUpdates[`${key}/progress`] = firebase.database.ServerValue.increment(increment);
            }
        }
    });

    if (Object.keys(missionUpdates).length > 0) {
        await updateUserProfile(uid, missionUpdates);
    }
}

/**
 * Purchase item from shop in RTDB
 * @param {string} uid - User ID
 * @param {string} itemId - Item ID
 * @param {number} price - Item price
 */
export async function purchaseItem(uid, itemId, price) {
    const profile = await getUserProfile(uid);

    if (profile.currency < price) {
        throw new Error('Insufficient currency');
    }

    const updates = {
        currency: firebase.database.ServerValue.increment(-price),
        [`cosmeticsOwned/${itemId}`]: true
    };

    await updateUserProfile(uid, updates);
}

/**
 * Purchase upgrade in RTDB
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

    const updates = {
        currency: firebase.database.ServerValue.increment(-cost),
        [`upgrades/${upgradeType}`]: currentLevel + 1
    };

    await updateUserProfile(uid, updates);
}

/**
 * Add friend in RTDB
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

    if (profile.friends && profile.friends.includes(friendCode)) {
        throw new Error('Already friends');
    }

    await database.ref(`users/${uid}/friends/${friendCode}`).set(true);
}

/**
 * Remove friend in RTDB
 * @param {string} uid - User ID
 * @param {string} friendCode - Friend's 6-digit code
 */
export async function removeFriend(uid, friendCode) {
    await database.ref(`users/${uid}/friends/${friendCode}`).remove();
}

/**
 * Claim mission reward in RTDB
 * @param {string} uid - User ID
 * @param {string} missionType - 'daily' or 'weekly'
 * @param {string} missionId - Mission ID
 * @param {number} reward - Reward amount
 */
export async function claimMissionReward(uid, missionType, missionId, reward) {
    const updates = {
        [`missions/${missionType}/${missionId}/claimed`]: true,
        currency: firebase.database.ServerValue.increment(reward)
    };
    await updateUserProfile(uid, updates);
}
