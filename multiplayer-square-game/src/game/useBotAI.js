import { useState, useEffect, useRef } from 'react';

const useBotAI = (initialData, enemies, onUpdate) => {
    const posRef = useRef({ x: initialData.x, y: initialData.y });
    const lastShotRef = useRef(0);

    useEffect(() => {
        let frameId;
        const loop = () => {
            const now = Date.now();
            const currentX = posRef.current.x;

            // 1. Find nearest enemy
            let targetX = currentX;
            let nearestDist = 1000;
            let shouldShoot = false;

            const enemyList = Object.values(enemies || {});

            // Simple logic: Target the lowest enemy or just random one? 
            // User requested: "track the nearest cube on the X axis"

            // Let's filter active enemies
            if (enemyList.length > 0) {
                // Sort by Y (lowest first/closest to player) or simple X distance?
                // Let's Find closes in X to minimize movement or Closes in Y to prioritize threat?
                // Bot behavior usually prioritizes threat (Y).
                // User said "track nearest on X Axis".

                let target = null;
                let minXDist = 1000;

                enemyList.forEach(e => {
                    const dist = Math.abs(e.x - currentX);
                    if (dist < minXDist) {
                        minXDist = dist;
                        target = e;
                    }
                });

                if (target) {
                    targetX = target.x;
                    // Shoot if aligned
                    if (Math.abs(target.x - currentX) < 5) {
                        shouldShoot = true;
                    }
                }
            } else {
                // Return to center if no enemies
                targetX = 50;
            }

            // 2. Move towards target
            // Add reaction delay or smooth lerp
            // speed ~ 0.5% per frame
            if (currentX < targetX - 1) posRef.current.x += 0.5;
            else if (currentX > targetX + 1) posRef.current.x -= 0.5;

            // Clamp
            posRef.current.x = Math.max(0, Math.min(95, posRef.current.x));

            // 3. Shoot
            let fired = false;
            if (shouldShoot && now - lastShotRef.current > 700) { // Slower than player
                fired = true;
                lastShotRef.current = now;
            }

            onUpdate(posRef.current, fired);
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [enemies]); // Re-eval if enemies list ref changes? Ideally runs every frame regardless.

    return posRef.current;
};

export default useBotAI;
