// ID Generation Utilities

/**
 * Generate a random 6-digit numeric code
 * @returns {string} 6-digit code
 */
export function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique user code by checking against existing codes in Realtime Database
 * @param {import('../firebase/config').database} database - RTDB instance
 * @returns {Promise<string>} Unique 6-digit user code
 */
export async function generateUniqueUserCode(database) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const code = generateCode();

        // Check if code already exists in codes registry
        const snapshot = await database.ref(`codes/${code}`).once('value');

        if (!snapshot.exists()) {
            return code;
        }

        attempts++;
    }

    // Fallback: append timestamp
    return generateCode() + Date.now().toString().slice(-2);
}

/**
 * Generate a unique room code by checking against active rooms in Realtime Database
 * @param {import('../firebase/config').database} database - Realtime Database instance
 * @returns {Promise<string>} Unique 6-digit room code
 */
export async function generateUniqueRoomCode(database) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const code = generateCode();

        // Check if room code already exists
        const snapshot = await database.ref(`rooms/${code}`).once('value');

        if (!snapshot.exists()) {
            return code;
        }

        attempts++;
    }

    // Fallback: append timestamp
    return generateCode() + Date.now().toString().slice(-2);
}

/**
 * Validate a 6-digit code
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid
 */
export function isValidCode(code) {
    return /^\d{6}$/.test(code);
}
