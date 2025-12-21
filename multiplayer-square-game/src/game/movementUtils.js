export const calculateEnemyPos = (enemy, now) => {
    const elapsedSeconds = (now - enemy.startTime) / 1000;
    const y = elapsedSeconds * enemy.speed;
    let x = enemy.x;

    if (enemy.type === 'yellow') {
        // Use initialX if available, otherwise fallback to x (but x might be mutating in some refs, so ideally use initialX)
        // We rely on initialX for the sine wave base to prevent drifting if x was overwritten.
        const baseX = enemy.initialX !== undefined ? enemy.initialX : enemy.x;
        x = baseX + Math.sin(elapsedSeconds * 5) * 10;
    }

    return { x, y };
};
