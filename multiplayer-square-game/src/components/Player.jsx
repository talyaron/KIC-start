import React, { useEffect, useRef } from 'react';
import useGameStore from '../game/store';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';
import { playSound } from '../game/SoundManager';

const Player = ({ data, isMe, onShoot }) => {
    const { roomId, user } = useGameStore();
    const posRef = useRef({ x: data.x, y: data.y });
    const lastUpdateRef = useRef(0);

    // Controls (Smooth Movement)
    useEffect(() => {
        if (!isMe) return;

        const keys = new Set();
        let frameId;

        const handleKeyDown = (e) => {
            keys.add(e.key);
            if (e.key === ' ') {
                if (onShoot) onShoot(posRef.current.x, posRef.current.y);
                playSound('shoot');
            }
        };
        const handleKeyUp = (e) => keys.delete(e.key);

        const loop = () => {
            const speed = 0.5; // smoother, per frame speed
            const current = posRef.current;
            let moved = false;

            if (keys.has('ArrowLeft')) { current.x = Math.max(0, current.x - speed); moved = true; }
            if (keys.has('ArrowRight')) { current.x = Math.min(95, current.x + speed); moved = true; }

            if (moved) {
                posRef.current = { ...current };
                // Sync to Firebase (Throttled)
                const now = Date.now();
                if (now - lastUpdateRef.current > 50) {
                    update(ref(database, `rooms/${roomId}/players/${user.uid}`), {
                        x: current.x,
                        y: current.y
                    });
                    lastUpdateRef.current = now;
                }
            }
            frameId = requestAnimationFrame(loop);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        frameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(frameId);
        };
    }, [isMe, roomId, user.uid, onShoot]);

    // Interpolation for other players (Basic CSS transition)
    const style = {
        left: `${isMe ? posRef.current.x : data.x}%`,
        top: `${isMe ? posRef.current.y : data.y}%`,
        backgroundColor: data.color || '#fff',
        boxShadow: `0 0 10px ${data.color}, 0 0 20px ${data.color}`
    };

    return (
        <div
            className="absolute w-[5%] aspect-square rounded-sm border border-white transition-all duration-75 ease-linear"
            style={style}
        >
            {/* Health bar floating above */}
            <div className="absolute -top-4 left-0 w-full h-1 bg-gray-700 rounded overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${data.hp}%` }}></div>
            </div>

            {/* ID */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white whitespace-nowrap opacity-70">
                {data.displayName}
            </div>
        </div>
    );
};

export default Player;
