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
                if (state.type === 'UPDATE_STATE') {
                    updateDoc(roomRef, {
                        enemies: state.enemies,
                        projectiles: state.projectiles
                    }).catch(() => { });
                } else if (state.type === 'DAMAGE') {
                    const safeHp = (state.newHp !== undefined && state.newHp !== null) ? state.newHp : 50;
                    updateDoc(roomRef, {
                        [`players.${state.uid}.hp`]: safeHp
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

            if (!engine.isHost) {
                if (data.enemies) engine.updateEnemies(data.enemies);
                if (data.projectiles) engine.updateProjectiles(data.projectiles);
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
                // Update Payload
                const updatePayload = {
                    [`players.${user.uid}.x`]: pos.x,
                    [`players.${user.uid}.y`]: pos.y
                };

                // Check Shoot
                if (keys.current.shoot) {
                    const shootTs = engine.tryShoot(user.uid);
                    if (shootTs) {
                        updatePayload[`players.${user.uid}.lastShoot`] = shootTs;
                        // Also Add Local Projectile for immediate feedback (prediction)
                        // But Host will also add it. We need to avoid dups?
                        // GameEngine logic handles "updateProjectiles" which overrides local.
                        // So local might flicker but it feels responsive.
                        // Ideally we show local until server overrides.
                        // For now, let's just send signal and let server auth handle it for consistency.
                        // Or we can add it safely if we don't clear list instanty.
                        // Let's just Add it:
                        engine.addProjectile(pos.x + 20, pos.y, user.uid, '#00f0ff');
                    }
                }

                // Write to Firestore
                updateDoc(roomRef, updatePayload).catch(() => { });
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
