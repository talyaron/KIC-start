import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GameEngine } from '../lib/game';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export default function GameCanvas() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const navigate = useNavigate();
    const [gameOver, setGameOver] = useState(false);

    // Input State
    const keys = useRef({
        left: false, right: false, up: false, down: false, shoot: false
    });

    useEffect(() => {
        if (!user || !roomId) return;

        const roomRef = doc(db, 'rooms', roomId);
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const engine = new GameEngine(
            canvas,
            false,
            (state) => {
                // On State Update (Host Only)
                if (state.type === 'UPDATE_ENEMIES') {
                    // Throttled in loop or assumed reasonably called
                    updateDoc(roomRef, { enemies: state.enemies }).catch(() => { });
                } else if (state.type === 'DAMAGE') {
                    updateDoc(roomRef, {
                        [`players.${state.uid}.hp`]: state.newHp || 50 // Fail safe
                    }).catch(() => { });
                }
            },
            () => {
                setGameOver(true);
            }
        );
        engineRef.current = engine;

        // Subscribe to Room Data
        const unsub = onSnapshot(roomRef, (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            if (data.host === user.uid) {
                engine.isHost = true;
            }

            if (data.players) {
                engine.updatePlayers(data.players);
            }

            if (!engine.isHost && data.enemies) {
                engine.updateEnemies(data.enemies);
            }
        });

        engine.start();

        // Input Listeners
        const handleDown = (e) => {
            if (e.code === 'ArrowLeft') keys.current.left = true;
            if (e.code === 'ArrowRight') keys.current.right = true;
            if (e.code === 'ArrowUp') keys.current.up = true;
            if (e.code === 'ArrowDown') keys.current.down = true;
            if (e.code === 'Space') keys.current.shoot = true;
        };
        const handleUp = (e) => {
            if (e.code === 'ArrowLeft') keys.current.left = false;
            if (e.code === 'ArrowRight') keys.current.right = false;
            if (e.code === 'ArrowUp') keys.current.up = false;
            if (e.code === 'ArrowDown') keys.current.down = false;
            if (e.code === 'Space') keys.current.shoot = false;
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);

        // Sync Loop (10Hz for Firestore)
        const inputInterval = setInterval(() => {
            const pos = engine.handleInput(keys.current, user.uid);

            if (pos) {
                // Write to Firestore - Dot notation
                updateDoc(roomRef, {
                    [`players.${user.uid}.x`]: pos.x,
                    [`players.${user.uid}.y`]: pos.y
                }).catch(() => { }); // catch errors silently to avoid lag spikes on console

                if (keys.current.shoot) {
                    engine.addProjectile(pos.x + 20, pos.y, user.uid);
                }
            }
        }, 100); // 100ms = 10Hz

        return () => {
            engine.stop();
            unsub();
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            clearInterval(inputInterval);
        };
    }, [roomId, user]);

    return (
        <div className="full-screen" style={{ background: '#000' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            {gameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    flexDirection: 'column'
                }}>
                    <h1 className="neon-text" style={{ fontSize: '4rem', color: 'var(--accent-danger)' }}>GAME OVER</h1>
                    <button onClick={() => navigate('/')}>Return Home</button>
                </div>
            )}
        </div>
    );
}
