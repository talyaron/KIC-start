// Firebase Realtime Database Operations (Game State & Rooms)

import firebase, { database } from './config.js';
import { CONFIG } from '../config.js';

/**
 * Global connection state
 */
let isRtdbConnected = false;
database.ref('.info/connected').on('value', (snap) => {
    isRtdbConnected = snap.val() === true;
    if (isRtdbConnected) {
        console.log("🟢 [RTDB] Connection established and verified");
    } else {
        console.log("🔴 [RTDB] Connection lost/pending...");
    }
});

/**
 * Ping check for network reachability
 */
async function checkConnectivity() {
    try {
        const baseUrl = database.app.options.databaseURL.replace(/\/$/, "");
        const url = `${baseUrl}/.json?limitToFirst=1`;
        const res = await fetch(url);
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Create a new game room
 * @param {Object} host - Host user data
 * @returns {Promise<string>} Room code
 */
export async function createRoom(host) {
    if (!host || !host.uid) {
        throw new Error('Invalid host data. Please log in again.');
    }

    const roomCode = host.userCode || Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🏗️ [RTDB] Creating room: ${roomCode}`);

    // Initial connection grace period if not connected
    if (!isRtdbConnected) {
        const reachable = await checkConnectivity();
        if (!reachable) {
            throw new Error('Firebase Server Unreachable. Please check your internet or VPN.');
        }
        // Wait a bit for the socket to actually upgrade
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Set up a 15-second timeout for the write operation
    const timeout = 15000;
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. The server is taking too long to respond.')), timeout)
    );

    try {
        const roomData = {
            hostUid: host.uid,
            status: 'lobby',
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            countdown: CONFIG.COUNTDOWN.START || 5,
            lobbyCountdown: 30,
            matchSeed: Math.floor(Math.random() * 1000000),
            teamScore: 0,
            players: {
                [host.uid]: {
                    userCode: host.userCode || '000000',
                    displayName: host.displayName || 'Host',
                    ready: true,
                    hp: CONFIG.PLAYER.BASE_HP || 100,
                    score: 0,
                    x: CONFIG.WORLD_WIDTH / 2,
                    y: CONFIG.WORLD_HEIGHT / 2,
                    angle: 0,
                    kills: { small: 0, medium: 0, large: 0 },
                    damageTaken: 0,
                    survivalTime: 0,
                },
            },
        };

        // Attempt to write the room data
        await Promise.race([
            database.ref(`rooms/${roomCode}`).set(roomData),
            timeoutPromise
        ]);

        // Clean up room if host disconnects
        database.ref(`rooms/${roomCode}`).onDisconnect().remove();

        return roomCode;
    } catch (error) {
        console.error('❌ [RTDB] Create room failed:', error);
        if (error.message.includes('permission_denied')) {
            throw new Error('Firebase Permission Denied. Are you logged in?');
        }
        throw error;
    }
}

/**
 * Join an existing room
 */
export async function joinRoom(roomCode, user) {
    if (!roomCode || !user) throw new Error('Invalid room code or user data');

    const roomRef = database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');

    if (!snapshot.exists()) throw new Error('Room not found');
    const room = snapshot.val();

    const players = room.players || {};
    if (Object.keys(players).length >= CONFIG.NETWORK.MAX_PLAYERS) {
        throw new Error('Room is full');
    }

    const playerData = {
        userCode: user.userCode,
        displayName: user.displayName,
        ready: false,
        hp: CONFIG.PLAYER.BASE_HP,
        score: 0,
        x: CONFIG.WORLD_WIDTH / 2,
        y: CONFIG.WORLD_HEIGHT / 2,
        angle: 0,
        kills: { small: 0, medium: 0, large: 0 },
        damageTaken: 0,
        survivalTime: 0,
    };

    const playerRef = roomRef.child(`players/${user.uid}`);
    await playerRef.set(playerData);
    playerRef.onDisconnect().remove();
}

export async function leaveRoom(roomCode, uid) {
    const roomRef = database.ref(`rooms/${roomCode}`);
    await roomRef.child(`players/${uid}`).remove();

    // Check if room should be closed
    const snapshot = await roomRef.once('value');
    if (snapshot.exists()) {
        const room = snapshot.val();
        if (!room.players || Object.keys(room.players).length === 0) {
            await roomRef.remove();
        } else if (room.hostUid === uid) {
            // Assign next player as host
            const nextHost = Object.keys(room.players)[0];
            await roomRef.update({ hostUid: nextHost });
        }
    }
}

export async function setPlayerReady(roomCode, uid, ready) {
    await database.ref(`rooms/${roomCode}/players/${uid}`).update({ ready });
}

export async function startGameCountdown(roomCode) {
    await database.ref(`rooms/${roomCode}`).update({
        status: 'countdown',
        countdown: CONFIG.COUNTDOWN.START
    });
}

export async function updateCountdown(roomCode, value) {
    const updates = { countdown: value };
    if (value === 0) updates.status = 'playing';
    await database.ref(`rooms/${roomCode}`).update(updates);
}

export async function updateLobbyCountdown(roomCode, value) {
    await database.ref(`rooms/${roomCode}`).update({ lobbyCountdown: value });
}

export async function updatePlayerPosition(roomCode, uid, x, y, angle) {
    if (!roomCode || !uid) return;
    database.ref(`rooms/${roomCode}/players/${uid}`).update({ x, y, angle });
}

export async function updateTeamScore(roomCode, scoreChange) {
    await database.ref(`rooms/${roomCode}`).update({
        teamScore: firebase.database.ServerValue.increment(scoreChange)
    });
}

export function onRoomChange(roomCode, callback) {
    if (!roomCode) return () => { };
    const roomRef = database.ref(`rooms/${roomCode}`);
    const listener = roomRef.on('value', snap => callback(snap.val()));
    return () => roomRef.off('value', listener);
}

export async function isHost(roomCode, uid) {
    const snap = await database.ref(`rooms/${roomCode}/hostUid`).once('value');
    return snap.val() === uid;
}
