import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../game/store';
import Player from './Player';
import EnemyManager from './EnemyManager';
import { calculateEnemyPos } from '../game/movementUtils';
import HUD from './UI/HUD';
import StatsScreen from './StatsScreen';
import { database } from '../firebase';
import { ref, onValue, set, update, push, remove } from 'firebase/database';
import useBotAI from '../game/useBotAI';
import { playSound } from '../game/SoundManager';

const GameCanvas = () => {
    const { user, roomId, isHost, setGameState, gameMode } = useGameStore();
    const [players, setPlayers] = useState({});
    const [gameStatus, setGameStatus] = useState('waiting');

    // Game Loop Refs
    const bulletsRef = useRef({}); // { id: {x, y, ownerId} }
    const enemiesRef = useRef({}); // Unified reference for collision (Local or Firebase)
    const frameRef = useRef();
    const [localEnemies, setLocalEnemies] = useState({}); // React state for Local Practice Mode rendering

    useEffect(() => {
        if (gameMode === 'PRACTICE') {
            // Setup local environment
            setGameStatus('playing');
            setPlayers({
                [user.uid]: { ...user, x: 50, y: 90, hp: 100, score: 0, color: '#3B82F6', displayName: 'You' },
                'bot1': { uid: 'bot1', displayName: 'Bot Alpha', x: 20, y: 90, hp: 100, score: 0, color: '#EF4444' },
                'bot2': { uid: 'bot2', displayName: 'Bot Beta', x: 80, y: 90, hp: 100, score: 0, color: '#F59E0B' },
                'bot3': { uid: 'bot3', displayName: 'Bot Omega', x: 50, y: 90, hp: 100, score: 0, color: '#10B981' }
            });
            // Clear enemies on start
            enemiesRef.current = {};
            setLocalEnemies({});
            return;
        }

        if (!roomId) return;

        const roomRef = ref(database, `rooms/${roomId}`);
        const playersRef = ref(database, `rooms/${roomId}/players`);

        update(playersRef, {
            [user.uid]: {
                uid: user.uid,
                displayName: user.displayName,
                x: 50,
                y: 90,
                hp: 100,
                score: 0,
                gameId: user.gameId || 'GUEST',
                color: getRandomColor()
            }
        });

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.players) setPlayers(data.players);
                if (data.status) setGameStatus(data.status);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [roomId, user, gameMode]);

    // Listen to Firebase enemies (Multiplayer Only)
    useEffect(() => {
        if (!roomId || gameMode === 'PRACTICE') return;

        const cubesRef = ref(database, `rooms/${roomId}/cubes`);
        const unsub = onValue(cubesRef, (snapshot) => {
            enemiesRef.current = snapshot.val() || {};
        });
        return () => unsub();
    }, [roomId, gameMode]);

    // Handle Local Spawns (passed to EnemyManager)
    const handleLocalSpawn = (newEnemy) => {
        enemiesRef.current[newEnemy.id] = newEnemy;
        setLocalEnemies({ ...enemiesRef.current });
    };

    const handleShoot = (x, y, ownerId) => {
        const id = `b_${Date.now()}_${Math.random()}`;
        bulletsRef.current[id] = { x: x + 2.5, y: y, ownerId }; // x center

        // Track Shots Fired
        if (gameMode === 'PRACTICE') {
            setPlayers(prev => ({
                ...prev,
                [ownerId]: { ...prev[ownerId], shots: (prev[ownerId].shots || 0) + 1 }
            }));
        } else {
            const p = players[ownerId];
            if (p) {
                update(ref(database, `rooms/${roomId}/players/${ownerId}`), {
                    shots: (p.shots || 0) + 1
                });
            }
        }
    };

    const handleHit = (eid, enemy, shooterId) => {
        if (gameMode === 'PRACTICE') {
            // Update Score
            setPlayers(prev => {
                const p = prev[shooterId];
                return {
                    ...prev,
                    [shooterId]: {
                        ...p,
                        hits: (p.hits || 0) + 1,
                        score: (p.score || 0) + (enemy.score || 10)
                    }
                };
            });

            // Damage Logic
            if (enemy.hp && enemy.hp > 1) {
                enemiesRef.current[eid].hp -= 1;
            } else {
                delete enemiesRef.current[eid];
            }
            // Trigger visual update
            setLocalEnemies({ ...enemiesRef.current });

        } else {
            // Firebase Logic
            const p = players[shooterId];
            if (p) {
                update(ref(database, `rooms/${roomId}/players/${shooterId}`), {
                    hits: (p.hits || 0) + 1,
                    score: (p.score || 0) + (enemy.score || 10)
                });
            }
            if (enemy.hp && enemy.hp > 1) {
                update(ref(database, `rooms/${roomId}/cubes/${eid}`), { hp: enemy.hp - 1 });
            } else {
                remove(ref(database, `rooms/${roomId}/cubes/${eid}`));
            }
        }
    };

    // Main Game Loop (Collision & Bullets)
    useEffect(() => {
        if (gameStatus !== 'playing') return;

        const loop = () => {
            // 1. Move Bullets
            Object.entries(bulletsRef.current).forEach(([id, b]) => {
                b.y -= 1;
                if (b.y < -10) delete bulletsRef.current[id];
            });

            // 2. Move Enemies (Local Mode Only)
            if (gameMode === 'PRACTICE') {
                Object.entries(enemiesRef.current).forEach(([id, e]) => {
                    const now = Date.now();
                    const { x, y } = calculateEnemyPos(e, now);
                    e.y = y;
                    e.x = x;

                    if (e.y > 100) {
                        // Score Penalty for missing enemy
                        if (gameMode === 'PRACTICE') {
                            // Deduct from ALL players or just local user? Spec says "Team Score".
                            // For Practice, we'll just deduct from the human player for simplicity in MVP.
                            setPlayers(prev => {
                                const p = prev[user.uid];
                                return {
                                    ...prev,
                                    [user.uid]: { ...p, score: Math.max(0, (p.score || 0) - 5) }
                                };
                            });
                        } else if (isHost) {
                            // In Multiplayer, reduce score of a random player or host? 
                            // Spec says "Team Score". Current implementation has individual scores.
                            // MVP Compromise: Deduct from Host? Or all? 
                            // Let's deduct from the Host for now as the "Team Captain" or simpler: 
                            // Actually, let's just deduct from the player who "missed" it? 
                            // No, it's a team penalty. Let's deduct from everyone?
                            // MVP Simplification: Deduct 5 points from the Host (since they control the gameloop).
                            // Better: Just update the UI score if it was shared. 
                            // But we have `score` per player. 
                            // Let's deduct from everyone.
                            Object.keys(players).forEach(pid => {
                                const p = players[pid];
                                update(ref(database, `rooms/${roomId}/players/${pid}`), {
                                    score: Math.max(0, (p.score || 0) - 5)
                                });
                            });
                        }

                        delete enemiesRef.current[id];
                    }
                });
            }

            // 3. Collision Detection
            if (isHost || gameMode === 'PRACTICE') {
                const enemies = enemiesRef.current;
                const now = Date.now();

                // A. Bullet -> Enemy
                Object.entries(bulletsRef.current).forEach(([bid, b]) => {
                    Object.entries(enemies).forEach(([eid, e]) => {
                        // Calculate actual position if in Practice (since we don't sync back to ref every frame)
                        let ex = e.x;
                        let ey = e.y;

                        if (gameMode === 'PRACTICE') {
                            const pos = calculateEnemyPos(e, now);
                            ex = pos.x;
                            ey = pos.y;
                            // Sync ref for subsequent checks
                            e.x = ex; e.y = ey;
                        }

                        if (
                            b.x > ex - 2.5 && b.x < ex + 7.5 &&
                            b.y > ey - 2.5 && b.y < ey + 7.5
                        ) {
                            delete bulletsRef.current[bid];
                            handleHit(eid, e, b.ownerId);
                        }
                    });
                });

                // B. Enemy -> Player (Body Collision)
                Object.values(players).forEach(p => {
                    if (p.hp <= 0) return; // Already dead

                    // Check Invincibility
                    if (p.lastHit && now - p.lastHit < 1500) return;

                    Object.entries(enemies).forEach(([eid, e]) => {
                        let ex = e.x;
                        let ey = e.y;

                        if (gameMode === 'PRACTICE') {
                            const pos = calculateEnemyPos(e, now);
                            ex = pos.x;
                            ey = pos.y;
                        }

                        // Player is approx 5x5% at (p.x, p.y) (top-left)
                        // Enemy is approx 5x5% at (ex, ey)
                        if (
                            ex < p.x + 4 && ex + 4 > p.x &&
                            ey < p.y + 4 && ey + 4 > p.y
                        ) {
                            handlePlayerDamage(p.uid, e.damage || 10);

                            if (gameMode === 'PRACTICE') {
                                delete enemiesRef.current[eid];
                                setLocalEnemies({ ...enemiesRef.current });
                            } else {
                                remove(ref(database, `rooms/${roomId}/cubes/${eid}`));
                            }
                        }
                    });
                });
            }

            frameRef.current = requestAnimationFrame(loop);
        };
        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameStatus, isHost, gameMode, players]);

    const handlePlayerDamage = (playerId, damage) => {
        const now = Date.now();
        if (gameMode === 'PRACTICE') {
            setPlayers(prev => {
                const p = prev[playerId];
                const newHp = Math.max(0, (p.hp || 100) - damage);
                return {
                    ...prev,
                    [playerId]: {
                        ...p,
                        hp: newHp,
                        lastHit: now
                    }
                };
            });
            // Check Game Over (Local)
            // if all players hp <= 0 setGameStatus('game_over')
            // Using a timeout or effect to check game over state to avoid render loop issues
        } else {
            const p = players[playerId];
            if (p) {
                update(ref(database, `rooms/${roomId}/players/${playerId}`), {
                    hp: Math.max(0, (p.hp || 100) - damage),
                    lastHit: now
                });
            }
        }
    };

    // Check Game Over Condition
    useEffect(() => {
        if (gameStatus !== 'playing') return;
        const allDead = Object.values(players).length > 0 && Object.values(players).every(p => p.hp <= 0);
        if (allDead) {
            if (gameMode === 'PRACTICE') {
                setGameStatus('game_over');
            } else if (isHost) {
                update(ref(database, `rooms/${roomId}`), { status: 'game_over' });
            }
        }
    }, [players, gameStatus, gameMode, isHost, roomId]);

    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden cursor-crosshair select-none">
            {/* Game World Layer */}
            <div className="absolute inset-x-0 inset-y-0">
                {Object.values(players).map((p) => {
                    const isInvincible = p.lastHit && (Date.now() - p.lastHit < 1500);
                    const opacity = isInvincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.5 : 1;

                    if (p.hp <= 0) return null; // Don't render dead players

                    return gameMode === 'PRACTICE' && p.uid.startsWith('bot') ?
                        (
                            <div key={p.uid} style={{ opacity }}>
                                <BotPlayer data={p} enemies={enemiesRef.current} onShoot={(x, y) => handleShoot(x, y, p.uid)} />
                            </div>
                        ) :
                        (
                            <div key={p.uid} style={{ opacity }}>
                                <Player data={p} isMe={p.uid === user.uid} onShoot={(x, y) => handleShoot(x, y, p.uid)} />
                            </div>
                        );
                })}

                <EnemyManager
                    isActive={gameStatus === 'playing'}
                    onSpawn={gameMode === 'PRACTICE' ? handleLocalSpawn : null}
                    localEnemies={gameMode === 'PRACTICE' ? localEnemies : null}
                />

                {/* Render Bullets */}
                {Object.entries(bulletsRef.current).map(([id, b]) => (
                    <div key={id} className="absolute w-[1%] aspect-square bg-yellow-400 rounded-full" style={{ left: `${b.x}%`, top: `${b.y}%` }}></div>
                ))}
            </div>

            {/* UI Layer */}
            <div className="absolute inset-0 pointer-events-none">
                <HUD players={players} gameStatus={gameStatus} countdown={5} />

                {isHost && gameStatus === 'waiting' && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded shadow-lg text-2xl animate-pulse transition hover:scale-105"
                            onClick={() => update(ref(database, `rooms/${roomId}`), { status: 'playing' })}
                        >
                            START GAME
                        </button>
                    </div>
                )}
            </div>

            {gameStatus === 'game_over' && <StatsScreen localPlayers={players} />}
        </div>
    );
};

const BotPlayer = ({ data, enemies, onShoot }) => {
    // Basic AI Wrapper
    const pos = useBotAI(data, enemies, (newX, fired) => {
        if (fired && onShoot) onShoot(newX, data.y);
    });

    return (
        <div
            className="absolute w-[5%] aspect-square rounded-sm border border-white transition-all duration-75 ease-linear"
            style={{
                left: `${pos.x}%`,
                top: `${data.y}%`,
                backgroundColor: data.color,
                boxShadow: `0 0 10px ${data.color}`
            }}
        >
            <div className="absolute -top-4 left-0 w-full h-1 bg-gray-700 rounded overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${data.hp}%` }}></div>
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-white whitespace-nowrap opacity-70">
                {data.displayName}
            </div>
        </div>
    );
};

const getRandomColor = () => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export default GameCanvas;
