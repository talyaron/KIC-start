import React, { useState } from 'react';
import useGameStore from '../game/store';
import { v4 as uuidv4 } from 'uuid';

const Lobby = () => {
    const { user, setRoom, setIsHost, setGameState } = useGameStore();
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const createServer = () => {
        // Generate a 6-digit number or distinct ID
        const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
        setRoom(newRoomId);
        setIsHost(true);
        setGameState('LOBBY_WAITING'); // Or directly to a waiting room screen
    };

    const joinServer = () => {
        if (joinCode.length !== 6) {
            setError('Code must be 6 digits.');
            return;
        }
        setRoom(joinCode);
        setIsHost(false);
        setGameState('LOBBY_WAITING');
    };

    const quickStart = () => {
        // MVP: Just join a "Global" room or create one
        // Ideally look for rooms in Firebase
        setRoom('PUBLIC');
        setGameState('LOBBY_WAITING');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white relative">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                {/* Main Actions */}
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Welcome, {user?.displayName}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={quickStart}
                            className="p-6 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl shadow-lg hover:scale-105 transition transform flex flex-col items-center justify-center gap-2 group border border-green-400/30"
                        >
                            <span className="text-2xl font-bold">⚡ Quick Play</span>
                            <span className="text-sm text-green-100 opacity-80 group-hover:opacity-100">Join Public</span>
                        </button>

                        <button
                            onClick={createServer}
                            className="p-6 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl shadow-lg hover:scale-105 transition transform flex flex-col items-center justify-center gap-2 group border border-blue-400/30"
                        >
                            <span className="text-2xl font-bold">🏠 Create</span>
                            <span className="text-sm text-blue-100 opacity-80 group-hover:opacity-100">Private Host</span>
                        </button>

                        <button
                            onClick={() => {
                                useGameStore.getState().setGameMode('PRACTICE');
                                useGameStore.getState().setRoom('PRACTICE_RM');
                                useGameStore.getState().setIsHost(true);
                                useGameStore.getState().setGameState('PLAYING');
                            }}
                            className="p-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-lg hover:scale-105 transition transform flex flex-col items-center justify-center gap-2 group border border-gray-500/30"
                        >
                            <span className="text-2xl font-bold">🤖 Bots</span>
                            <span className="text-sm text-gray-300 opacity-80 group-hover:opacity-100">Practice Mode</span>
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-300">Join Private Server</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter 6-digit Code"
                            maxLength={6}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg tracking-widest text-center"
                        />
                        <button
                            onClick={joinServer}
                            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold transition border border-gray-600"
                        >
                            JOIN
                        </button>
                    </div>
                    {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
                </div>
            </div>

            {/* Sidebar */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700 p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4 text-gray-200 border-b border-gray-700 pb-2">Squad</h3>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 bg-gray-800 p-2 rounded border border-gray-600">
                        <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                            {user?.displayName?.[0]}
                        </div>
                        <span className="font-medium text-sm">{user?.displayName} (You)</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded border border-dashed border-gray-700 text-gray-500">
                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs">+</div>
                        <span className="text-sm">Invite Friend</span>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">My Stats</div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Wins</span>
                        <span className="font-bold text-yellow-400">0</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">Kills</span>
                        <span className="font-bold text-red-400">0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
