import React from 'react';
import useGameStore from '../../game/store';

const HUD = ({ players, gameStatus, countdown }) => {
    // Use store or passed props for score
    // For MVP, simplistic
    const { user } = useGameStore();
    const myPlayer = Object.values(players || {}).find(p => p.uid === user?.uid);

    return (
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
                <div className="bg-gray-800/80 p-2 rounded text-white">
                    <div className="text-xl font-bold text-yellow-500">SCORE: {myPlayer?.score || 0}</div>
                </div>

                <div className="bg-gray-800/80 p-2 rounded text-white text-center">
                    <div className="text-sm text-gray-400">STATUS</div>
                    <div className="font-bold uppercase text-blue-400">{gameStatus}</div>
                </div>
            </div>

            {/* Overlay Messages */}
            {gameStatus === 'counting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-9xl font-black text-white animate-ping">
                        {countdown}
                    </div>
                </div>
            )}

            {gameStatus === 'game_over' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50">
                    <div className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
                        <h2 className="text-5xl font-bold text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-xl text-white mb-8">Final Score: {myPlayer?.score || 0}</p>
                        <button className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">
                            BACK TO LOBBY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HUD;
