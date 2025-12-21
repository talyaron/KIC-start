// Input Validators

/**
 * Validate room code format
 * @param {string} code - Room code to validate
 * @returns {boolean} True if valid
 */
export function validateRoomCode(code) {
    return /^\d{6}$/.test(code);
}

/**
 * Validate user code format
 * @param {string} code - User code to validate
 * @returns {boolean} True if valid
 */
export function validateUserCode(code) {
    return /^\d{6}$/.test(code);
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, 100); // Limit length
}

/**
 * Validate display name
 * @param {string} name - Display name
 * @returns {boolean} True if valid
 */
export function validateDisplayName(name) {
    return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 50;
}
