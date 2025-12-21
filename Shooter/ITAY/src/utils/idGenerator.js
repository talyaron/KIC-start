// ID Generation Utilities

/**
 * Generate a random 6-digit numeric code
 * @returns {string} 6-digit code
 */
export function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique user code by checking against existing codes in Firestore
 * @param {import('../firebase/config').firestore} firestore - Firestore instance
 * @returns {Promise<string>} Unique 6-digit user code
 */
export async function generateUniqueUserCode(firestore) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const code = generateCode();

        // Check if code already exists
        const querySnapshot = await firestore
            .collection('users')
            .where('userCode', '==', code)
            .get();

        if (querySnapshot.empty) {
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
