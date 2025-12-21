import React, { useEffect, useState, useRef } from 'react';
import useGameStore from '../game/store';
import { database } from '../firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { calculateEnemyPos } from '../game/movementUtils';
// import Enemy from './Enemy'; // We will define Enemy inline or separate

const EnemyManager = ({ isActive, onSpawn, localEnemies }) => {
    const { roomId, isHost } = useGameStore();
    const [enemies, setEnemies] = useState({});
    const lastSpawnRef = useRef(0);
    const frameRef = useRef();

    // Difficulty Scaling
    const [difficulty, setDifficulty] = useState(1);

    useEffect(() => {
        if (!isActive) return;
        const difficultyTimer = setInterval(() => {
            setDifficulty(prev => prev + 1);
        }, 20000); // Every 20 seconds
        return () => clearInterval(difficultyTimer);
    }, [isActive]);

    // Enemy Types Config (Updated per Spec)
    const enemyTypes = [
        { type: 'red', speed: 10, damage: 10, score: 5, chance: 0.6, color: '#EF4444' }, // Common
        { type: 'yellow', speed: 15, damage: 15, score: 10, chance: 0.3, color: '#F59E0B' }, // Medium
        { type: 'blue', speed: 20, damage: 30, score: 20, chance: 0.1, color: '#3B82F6' } // Heavy (30HP)
    ];

    // Local vs Remote Mode
    useEffect(() => {
        if (localEnemies) {
            setEnemies(localEnemies);
            return;
        }

        if (!roomId) return;
        const cubesRef = ref(database, `rooms/${roomId}/cubes`);
        const unsubscribe = onValue(cubesRef, (snapshot) => {
            setEnemies(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, [roomId, localEnemies]);

    // Host Logic: Spawning
    useEffect(() => {
        if ((!isHost && !onSpawn) || !isActive) return;

        const spawnLoop = () => {
            const now = Date.now();
            // Scale spawn rate with difficulty (faster as diff increases)
            // Base: 1000ms. Max Speed: 400ms.
            const spawnInterval = Math.max(400, 1000 - (difficulty * 50));

            if (now - lastSpawnRef.current > spawnInterval) {
                const rand = Math.random();
                let typeConfig = enemyTypes[0];
                if (rand > 0.9) typeConfig = enemyTypes[2];
                else if (rand > 0.6) typeConfig = enemyTypes[1];

                const spawnEnemy = (offset = 0) => {
                    const id = `e_${now}_${Math.floor(Math.random() * 1000)}_squares`;
                    // Scale speed with difficulty
                    const speedMultiplier = 1 + (difficulty * 0.1);

                    const newEnemy = {
                        id,
                        type: typeConfig.type,
                        x: Math.min(90, Math.max(0, Math.floor(Math.random() * 90) + offset)),
                        startTime: now,
                        speed: typeConfig.speed * speedMultiplier,
                        damage: typeConfig.damage,
                        score: typeConfig.score,
                        color: typeConfig.color,
                        hp: typeConfig.type === 'blue' ? 30 : (typeConfig.type === 'yellow' ? 15 : 10), // Updated HP
                        maxHp: typeConfig.type === 'blue' ? 30 : (typeConfig.type === 'yellow' ? 15 : 10),
                        initialX: Math.min(90, Math.max(0, Math.floor(Math.random() * 90) + offset))
                    };

                    if (onSpawn) {
                        onSpawn(newEnemy);
                    } else {
                        update(ref(database, `rooms/${roomId}/cubes/${id}`), newEnemy);
                    }
                };

                if (typeConfig.type === 'red') {
                    spawnEnemy(-5);
                    spawnEnemy(0);
                    spawnEnemy(5);
                } else {
                    spawnEnemy(0);
                }

                lastSpawnRef.current = now;
            }
            frameRef.current = requestAnimationFrame(spawnLoop);
        };

        frameRef.current = requestAnimationFrame(spawnLoop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [isHost, isActive, roomId, difficulty, onSpawn]);

    // Render Logic
    return (
        <>
            {Object.values(enemies).map(enemy => (
                <Enemy key={enemy.id} data={enemy} />
            ))}
        </>
    );
};

const Enemy = ({ data }) => {
    const [pos, setPos] = useState({ x: data.x, y: 0 });
    const reqRef = useRef();

    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            const { x, y } = calculateEnemyPos(data, now);
            setPos({ x, y });

            if (y < 110) {
                reqRef.current = requestAnimationFrame(animate);
            }
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [data.startTime, data.speed, data.x, data.type, data.initialX]);

    return (
        <div
            className="absolute w-[5%] aspect-square rounded shadow-lg flex items-center justify-center text-xs font-bold text-black/50 transition-transform"
            style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                backgroundColor: data.color,
                border: data.type === 'blue' ? '2px solid white' : 'none'
            }}
        >
            {data.type === 'blue' && data.hp < data.maxHp && (
                <div className="absolute -top-2 w-full h-1 bg-red-500">
                    <div className="h-full bg-green-400" style={{ width: `${(data.hp / data.maxHp) * 100}%` }}></div>
                </div>
            )}
            <span>{data.type[0].toUpperCase()}</span>
        </div>
    );
};

export default EnemyManager;
