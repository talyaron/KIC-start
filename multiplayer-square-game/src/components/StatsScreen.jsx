import React, { useEffect, useState } from 'react';
import useGameStore from '../game/store';
import { database } from '../firebase';
import { ref, get, update } from 'firebase/database';

const StatsScreen = () => {
    const { roomId, isHost, user, setGameState } = useGameStore();
    const [finalPlayers, setFinalPlayers] = useState([]);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        if (!roomId) return;
        const fetchStats = async () => {
            const snapshot = await get(ref(database, `rooms/${roomId}/players`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const playersArr = Object.values(data);
                playersArr.sort((a, b) => b.score - a.score);
                setFinalPlayers(playersArr);
                setWinner(playersArr[0]);
            }
        };
        fetchStats();
    }, [roomId]);

    const handleReplay = () => {
        // Reset scores and set status to waiting/playing
        const updates = {
            [`rooms/${roomId}/status`]: 'waiting'
        };
        // Also reset player HP/Scores? simplified for MVP
        update(ref(database), updates);
        setGameState('LOBBY_WAITING');
    };

    const handleExit = () => {
        setGameState('LOBBY');
    };

    return (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center text-white p-8">
            <h1 className="text-4xl font-bold mb-2 text-yellow-500">GAME OVER</h1>
            <h2 className="text-2xl mb-8">Winner: <span className="text-blue-400">{winner?.displayName || 'Unknown'}</span></h2>

            <div className="w-full max-w-2xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Player</th>
                            <th className="p-4">Score</th>
                            <th className="p-4">Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalPlayers.map((p, idx) => {
                            const acc = p.shots > 0 ? ((p.hits || 0) / p.shots * 100).toFixed(1) : 0;
                            return (
                                <tr key={p.uid} className="border-b border-gray-700 hover:bg-gray-750">
                                    <td className="p-4 font-bold text-lg">#{idx + 1}</td>
                                    <td className="p-4 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded" style={{ background: p.color }}></div>
                                        {p.displayName} {p.uid === user.uid && '(You)'}
                                    </td>
                                    <td className="p-4 font-mono text-yellow-300">{p.score}</td>
                                    <td className="p-4 text-gray-400">{acc}% ({p.hits || 0}/{p.shots || 0})</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-4">
                {isHost && (
                    <button
                        onClick={handleReplay}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition transform hover:scale-105"
                    >
                        PLAY AGAIN
                    </button>
                )}
                <button
                    onClick={handleExit}
                    className="px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded font-bold transition"
                >
                    EXIT TO LOBBY
                </button>
            </div>
        </div>
    );
};

export default StatsScreen;
