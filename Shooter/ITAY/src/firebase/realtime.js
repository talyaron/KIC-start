// Firebase Realtime Database Operations (Game State & Rooms)

import firebase, { database } from './config.js';
import { generateUniqueRoomCode } from '../utils/idGenerator.js';
import { CONFIG } from '../config.js';

/**
 * Create a new game room
 * @param {Object} host - Host user data
 * @returns {Promise<string>} Room code
 */
// Force database to go online
console.log(`🔌 [RTDB] Initializing connection to: ${database.app.options.databaseURL}`);
database.goOnline();

database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log("🟢 [RTDB] Connection established and verified");
    } else {
        console.log("🔴 [RTDB] Connection lost/pending...");
    }
});

// Optional pre-flight check to see if Belgium is reachable
async function checkConnectivity() {
    try {
        // Ensure no double slash
        const baseUrl = database.app.options.databaseURL.replace(/\/$/, "");
        const url = `${baseUrl}/.json?limitToFirst=1`;
        console.log(`📡 [RTDB] Pre-flight pinging: ${url}`);
        const res = await fetch(url);
        console.log(`✅ [RTDB] Server reachable via HTTPS (Status: ${res.status})`);
        return true;
    } catch (e) {
        console.warn(`❌ [RTDB] Server unreachable via HTTPS: ${e.message}`);
        return false;
    }
}

let isRtdbConnected = false;
database.ref('.info/connected').on('value', (snap) => {
    isRtdbConnected = snap.val() === true;
    if (isRtdbConnected) {
        console.log("🟢 [RTDB] Connection established and verified");
    } else {
        console.log("🔴 [RTDB] Connection lost/pending...");
    }
});

export async function createRoom(host) {
    const roomCode = host.userCode; // Use host's 6-digit User ID as Room Code
    console.log(`🏗️ [RTDB] Attempting to create room: ${roomCode} (Connected: ${isRtdbConnected})`);

    // Pre-flight check
    await checkConnectivity();

    if (!isRtdbConnected) {
        console.warn("⚠️ [RTDB] Handshake still pending. Waiting 5s for protocol upgrade...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Add a longer timeout for initial connection
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
            const advice = isRtdbConnected ?
                "Server is slow to respond. Try again in a moment." :
                "Your network is blocking WebSockets. Try a different network or disable VPN.";
            reject(new Error(`Firebase connection timeout. ${advice}`));
        }, 30000)
    );

    try {
        const roomData = {
            hostUid: host.uid,
            status: 'lobby',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            countdown: CONFIG.COUNTDOWN.START,
            lobbyCountdown: 30, // 30 second grace period for joining
            matchSeed: Math.floor(Math.random() * 1000000),
            teamScore: 0,
            players: {
                [host.uid]: {
                    userCode: host.userCode,
                    displayName: host.displayName,
                    ready: true, // Host is ready by default
                    hp: CONFIG.PLAYER.BASE_HP,
                    score: 0,
                    x: 0,
                    y: 0,
                    kills: { red: 0, yellow: 0, blue: 0 },
                    damageTaken: 0,
                    survivalTime: 0,
                },
            },
        };

        // set() will overwrite any existing stale data, so remove() is unnecessary
        await Promise.race([
            database.ref(`rooms/${roomCode}`).set(roomData),
            timeoutPromise
        ]);

        console.log(`✅ [RTDB] Room ${roomCode} created successfully`);

        // Cleanup on host disconnect
        database.ref(`rooms/${roomCode}`).onDisconnect().remove();

        return roomCode;
    } catch (error) {
        console.error('❌ [RTDB] Create room error:', error);
        throw error;
    }
}

/**
 * Join an existing room
 * @param {string} roomCode - Room code to join
 * @param {Object} user - User data
 */
export async function joinRoom(roomCode, user) {
    const roomRef = database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');

    if (!snapshot.exists()) {
        throw new Error('Room not found');
    }

    const room = snapshot.val();

    // Check if room is full
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount >= CONFIG.NETWORK.MAX_PLAYERS) {
        throw new Error('Room is full');
    }

    // Check if game already started
    if (room.status !== 'lobby') {
        throw new Error('Game already in progress');
    }

    // Check if player is already in the room (avoid duplicates)
    if (room.players && room.players[user.uid]) {
        console.log('👤 Player already in room, effectively joined');
        return;
    }

    // Add player to room
    const playerData = {
        userCode: user.userCode,
        displayName: user.displayName,
        ready: false,
        hp: CONFIG.PLAYER.BASE_HP,
        score: 0,
        x: 0,
        y: 0,
        kills: { red: 0, yellow: 0, blue: 0 },
        damageTaken: 0,
        survivalTime: 0,
    };

    const playerRef = roomRef.child(`players/${user.uid}`);
    await playerRef.set(playerData);

    // Automatic cleanup if player disconnects
    playerRef.onDisconnect().remove();
}

/**
 * Leave a room
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 */
export async function leaveRoom(roomCode, uid) {
    const roomRef = database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');

    if (!snapshot.exists()) return;

    const room = snapshot.val();

    // Remove player
    await roomRef.child(`players/${uid}`).remove();

    // If host left, delete the room or assign new host
    if (room.hostUid === uid) {
        const remainingPlayers = Object.keys(room.players || {}).filter(id => id !== uid);

        if (remainingPlayers.length === 0) {
            // Delete room if empty
            await roomRef.remove();
        } else {
            // Assign new host
            await roomRef.update({ hostUid: remainingPlayers[0] });
        }
    }
}

/**
 * Set player ready status
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {boolean} ready - Ready status
 */
export async function setPlayerReady(roomCode, uid, ready) {
    await database.ref(`rooms/${roomCode}/players/${uid}`).update({ ready });
}

/**
 * Start game countdown
 * @param {string} roomCode - Room code
 */
export async function startGameCountdown(roomCode) {
    await database.ref(`rooms/${roomCode}`).update({
        status: 'countdown',
        countdown: CONFIG.COUNTDOWN.START,
    });
}

/**
 * Update countdown
 * @param {string} roomCode - Room code
 * @param {number} value - Countdown value
 */
export async function updateCountdown(roomCode, value) {
    const updates = { countdown: value };

    if (value === 0) {
        updates.status = 'playing';
    }

    await database.ref(`rooms/${roomCode}`).update(updates);
}

/**
 * Update lobby countdown (before game starts)
 * @param {string} roomCode - Room code
 * @param {number} value - Countdown value
 */
export async function updateLobbyCountdown(roomCode, value) {
    await database.ref(`rooms/${roomCode}`).update({ lobbyCountdown: value });
}

/**
 * Update player position
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {Object} position - {x, y}
 */
export async function updatePlayerPosition(roomCode, uid, position) {
    await database.ref(`rooms/${roomCode}/players/${uid}`).update(position);
}

/**
 * Update player HP
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {number} hp - New HP value
 */
export async function updatePlayerHP(roomCode, uid, hp) {
    await database.ref(`rooms/${roomCode}/players/${uid}`).update({ hp: Math.max(0, hp) });
}

/**
 * Update player score
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {number} score - Score increment
 * @param {string} enemyType - Enemy type killed
 */
export async function updatePlayerScore(roomCode, uid, score, enemyType = null) {
    const updates = {
        score: firebase.database.ServerValue.increment(score),
    };

    if (enemyType) {
        const killKey = `${enemyType.toLowerCase()}`;
        updates[`kills/${killKey}`] = firebase.database.ServerValue.increment(1);
    }

    await database.ref(`rooms/${roomCode}/players/${uid}`).update(updates);
}

/**
 * Update team score
 * @param {string} roomCode - Room code
 * @param {number} scoreChange - Score change (can be negative)
 */
export async function updateTeamScore(roomCode, scoreChange) {
    await database.ref(`rooms/${roomCode}`).update({
        teamScore: firebase.database.ServerValue.increment(scoreChange),
    });
}

/**
 * Update player damage taken
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {number} damage - Damage amount
 */
export async function updatePlayerDamage(roomCode, uid, damage) {
    await database.ref(`rooms/${roomCode}/players/${uid}`).update({
        damageTaken: firebase.database.ServerValue.increment(damage),
    });
}

/**
 * End game
 * @param {string} roomCode - Room code
 */
export async function endGame(roomCode) {
    await database.ref(`rooms/${roomCode}`).update({
        status: 'ended',
    });
}

/**
 * Listen to room changes
 * @param {string} roomCode - Room code
 * @param {Function} callback - Callback function(roomData)
 * @returns {Function} Unsubscribe function
 */
export function onRoomChange(roomCode, callback) {
    const roomRef = database.ref(`rooms/${roomCode}`);

    const listener = roomRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });

    // Return unsubscribe function
    return () => roomRef.off('value', listener);
}

/**
 * Listen to player changes
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @param {Function} callback - Callback function(playerData)
 * @returns {Function} Unsubscribe function
 */
export function onPlayerChange(roomCode, uid, callback) {
    const playerRef = database.ref(`rooms/${roomCode}/players/${uid}`);

    const listener = playerRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });

    return () => playerRef.off('value', listener);
}

/**
 * Get room data once
 * @param {string} roomCode - Room code
 * @returns {Promise<Object|null>} Room data
 */
export async function getRoomData(roomCode) {
    const snapshot = await database.ref(`rooms/${roomCode}`).once('value');
    return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Check if user is host
 * @param {string} roomCode - Room code
 * @param {string} uid - User ID
 * @returns {Promise<boolean>} True if host
 */
export async function isHost(roomCode, uid) {
    const room = await getRoomData(roomCode);
    return room && room.hostUid === uid;
}
