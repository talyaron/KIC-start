import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GameEngine } from '../lib/game';
import { db } from '../lib/firebase';
import { ref, update, onValue } from 'firebase/database';

export default function GameCanvas() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const navigate = useNavigate();
    const [gameOver, setGameOver] = useState(false);
    const [votes, setVotes] = useState({});
    const [playerCount, setPlayerCount] = useState(1);
    const [hasVoted, setHasVoted] = useState(false);
    const [players, setPlayers] = useState({});

    // Input State
    const keys = useRef({
        left: false, right: false, up: false, down: false, shoot: false
    });

    const handleQuit = async () => {
        if (!user || !roomId) return;
        const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
        try {
            // Stop engine and remove self from database
            if (engineRef.current) engineRef.current.stop();
            await update(ref(db, `rooms/${roomId}/players`), { [user.uid]: null });
            navigate('/');
        } catch (err) {
            console.error("Error quitting:", err);
            navigate('/');
        }
    };

    useEffect(() => {
        if (!user || !roomId) return;

        const roomRef = ref(db, `rooms/${roomId}`);
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const engine = new GameEngine(
            canvas,
            false,
            (state) => {
                // On State Update (Host Only)
                if (state.type === 'UPDATE_STATE') {
                    update(roomRef, {
                        enemies: state.enemies,
                        projectiles: state.projectiles
                    }).catch(() => { });
                } else if (state.type === 'DAMAGE') {
                    const safeHp = (state.newHp !== undefined && state.newHp !== null) ? state.newHp : 50;
                    update(roomRef, {
                        [`players/${state.uid}/hp`]: safeHp
                    }).catch(() => { });
                } else if (state.type === 'SCORE_UPDATE') {
                    const currentKills = engine.players[state.uid]?.kills || { 1: 0, 2: 0, 3: 0 };
                    const newKills = { ...currentKills };
                    if (state.alienSize) {
                        newKills[state.alienSize] = (newKills[state.alienSize] || 0) + 1;
                    }

                    update(roomRef, {
                        [`players/${state.uid}/score`]: state.score,
                        [`players/${state.uid}/kills`]: newKills
                    }).catch(() => { });
                }
            },
            () => {
                setGameOver(true);
                engine.pause();
                // We don't stop the loop, just pause updates
            }
        );
        engineRef.current = engine;
        engine.myUid = user.uid;

        // Subscribe to Room Data
        const unsub = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.host === user.uid) {
                engine.isHost = true;
            }

            if (data.players) {
                setPlayers(data.players);
                engine.updatePlayers(data.players);

                // Check for Death (Client Side)
                const myPlayer = data.players[user.uid];
                if (myPlayer && myPlayer.hp <= 0) {
                    setGameOver(true);
                }
            }

            if (!engine.isHost) {
                if (data.enemies) engine.updateEnemies(data.enemies);
                if (data.boosts) engine.updateBoosts(data.boosts);
                if (data.projectiles) engine.updateProjectiles(data.projectiles);
            }

            // Sync votes and player count
            if (data.votes) {
                setVotes(data.votes);
            } else {
                setVotes({});
            }

            if (data.players) {
                const count = Object.keys(data.players).length;
                setPlayerCount(count);

                // Auto-restart logic for Host
                if (engine.isHost && data.votes) {
                    const voteUids = Object.keys(data.votes);
                    if (voteUids.length >= count && count > 0) {
                        // Reset Game
                        console.log("All players voted! Restarting...");
                        const resetPlayers = {};
                        Object.keys(data.players || {}).forEach(pUid => {
                            resetPlayers[pUid] = {
                                ...data.players[pUid],
                                hp: 100,
                                x: 200 + Math.random() * 200,
                                y: window.innerHeight - 100,
                                score: 0,
                                kills: { 1: 0, 2: 0, 3: 0 }
                            };
                        });

                        update(roomRef, {
                            status: 'playing',
                            enemies: null,
                            projectiles: null,
                            votes: null, // Clear votes
                            players: resetPlayers
                        }).then(() => {
                            setGameOver(false);
                            setHasVoted(false);
                            engine.start();
                        });
                    }
                }
            }

            if (data.status === 'playing' && gameOver) {
                setGameOver(false);
                setHasVoted(false);
                engine.start();
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

        // High-frequency local update loop (60Hz+)
        let frameId;
        let lastSmoothTime = performance.now();
        const smoothInput = (timestamp) => {
            const now = performance.now();
            const dt = now - lastSmoothTime;
            lastSmoothTime = now;

            if (engine.running && !engine.paused) {
                // Pass dt to ensure frame-rate independent smooth movement
                engine.handleInput(keys.current, user.uid, dt);
            }
            frameId = requestAnimationFrame(smoothInput);
        };
        frameId = requestAnimationFrame(smoothInput);

        // Lower-frequency sync loop to server (20Hz)
        const inputInterval = setInterval(() => {
            const p = engine.players[user.uid];
            if (p) {
                const updatePayload = {
                    [`players/${user.uid}/x`]: p.x,
                    [`players/${user.uid}/y`]: p.y
                };

                if (keys.current.shoot) {
                    const shootTs = engine.tryShoot(user.uid);
                    if (shootTs) {
                        updatePayload[`players/${user.uid}/lastShoot`] = shootTs;
                        engine.addProjectile(p.x + 25, p.y, user.uid, p.color);
                    }
                }

                update(roomRef, updatePayload).catch(() => { });
            }
        }, 50);

        return () => {
            engine.stop();
            unsub();
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            cancelAnimationFrame(frameId);
            clearInterval(inputInterval);
        };
    }, [roomId, user]);

    return (
        <div className="full-screen" style={{ background: '#000' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />


            {/* Top HUD: Current Player Score */}
            <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
                <h1 className="neon-text" style={{ fontSize: '2.5rem', margin: 0 }}>
                    {engineRef.current?.players[user.uid]?.score || 0}
                </h1>
                <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', letterSpacing: '2px' }}>SCORE</div>
            </div>

            {/* Quit Button */}
            <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
                <button
                    className="secondary"
                    style={{
                        padding: '8px 15px',
                        fontSize: '0.7rem',
                        opacity: 0.6,
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        background: 'rgba(0,0,0,0.5)'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                    onClick={handleQuit}
                >
                    QUIT MISSION
                </button>
            </div>

            {/* Leaderboard HUD */}
            <div style={{
                position: 'absolute', top: 20, right: 20,
                color: 'white', background: 'rgba(0,0,0,0.3)',
                padding: '15px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(5px)',
                minWidth: '150px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '0.8rem', color: '#aaa' }}>PILOTS</h4>
                {Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', gap: '20px',
                        color: p.uid === user.uid ? 'var(--accent-primary)' : 'white',
                        fontSize: '0.9rem', marginBottom: '4px'
                    }}>
                        <span>{p.displayName || 'Guest'}</span>
                        <span style={{ fontWeight: 'bold' }}>{p.score || 0}</span>
                    </div>
                ))}
            </div>

            {gameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    flexDirection: 'column'
                }}>
                    <h1 className="neon-text" style={{ fontSize: '5rem', color: 'var(--accent-danger)', marginBottom: '0' }}>GAME OVER</h1>
                    <div style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px', opacity: 0.8 }}>The alien invasion continues...</div>

                    {/* Mission Stats */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px',
                        border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px', minWidth: '300px'
                    }}>
                        <h3 style={{ color: 'var(--accent-primary)', margin: '0 0 15px 0', textAlign: 'center', letterSpacing: '4px' }}>MISSION DEBRIEF</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#88e188' }}>
                                <span>Scouts Terminated:</span>
                                <b>{players[user.uid]?.kills?.[1] || 0}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffb944' }}>
                                <span>Cruisers Destroyed:</span>
                                <b>{players[user.uid]?.kills?.[2] || 0}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff55ff' }}>
                                <span>Motherships Neutralized:</span>
                                <b>{players[user.uid]?.kills?.[3] || 0}</b>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '1.2rem' }}>
                                <span>TOTAL SCORE:</span>
                                <b className="neon-text">{players[user.uid]?.score || 0}</b>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {!hasVoted ? (
                            <button
                                style={{ padding: '20px 40px', fontSize: '1.2rem', minWidth: '200px' }}
                                onClick={() => {
                                    setHasVoted(true);
                                    update(ref(db, `rooms/${roomId}/votes`), {
                                        [user.uid]: true
                                    });
                                }}
                            >
                                Play Again
                            </button>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--accent-success)', fontSize: '1.5rem', fontWeight: 'bold' }}>Waiting...</div>
                                <div style={{ color: '#888' }}>{Object.keys(votes).length} / {playerCount} Ready</div>
                            </div>
                        )}
                        <button className="secondary" style={{ padding: '20px 40px', fontSize: '1.2rem' }} onClick={handleQuit}>
                            Exit to Base
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
