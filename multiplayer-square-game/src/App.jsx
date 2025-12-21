import React from 'react';
import AuthManager from './components/AuthManager';
import Lobby from './components/Lobby';
import useGameStore from './game/store';
// import GameCanvas from './game/GameCanvas'; // To be created
import GameCanvas from './components/GameCanvas';

function App() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <AuthManager>
      <div className="desktop-wrapper">
        <div className="desktop-container">
          {gameState === 'LOBBY' && <Lobby />}
          {gameState === 'LOBBY_WAITING' && (
            <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900">
              <h2 className="text-2xl mb-4">Waiting for players...</h2>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <button
                className="px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition"
                onClick={() => useGameStore.getState().setGameState('LOBBY')}
              >
                Cancel
              </button>
            </div>
          )}
          {/* Practice Mode Logic will go here */}
          {(gameState === 'PLAYING' || gameState === 'GAME_OVER') && <GameCanvas />}
        </div>
      </div>
    </AuthManager>
  );
}

export default App;
