// Collision Detection Module

/**
 * Check AABB collision between two rects
 * @param {Object} a - First rect {x, y, width, height}
 * @param {Object} b - Second rect {x, y, width, height}
 * @returns {boolean} True if colliding
 */
export function checkCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

/**
 * Check if point is in rect
 * @param {number} px - Point x
 * @param {number} py - Point y
 * @param {Object} rect - Rect {x, y, width, height}
 * @returns {boolean} True if point in rect
 */
export function pointInRect(px, py, rect) {
    return px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height;
}
