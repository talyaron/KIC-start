export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function checkCollision(box1, box2) {
    return box1.intersectsBox(box2);
}
