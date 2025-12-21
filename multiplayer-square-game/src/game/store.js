import { create } from 'zustand';

const useGameStore = create((set) => ({
    user: null, // { uid, displayName, gameId, photoURL, isAnonymous }
    roomId: null,
    isHost: false,
    gameMode: 'MULTIPLAYER', // 'MULTIPLAYER' | 'PRACTICE'
    gameState: 'LOBBY', // LOBBY, COUNTDOWN, PLAYING, GAME_OVER

    setUser: (user) => set({ user }),
    setRoom: (roomId) => set({ roomId }),
    setIsHost: (isHost) => set({ isHost }),
    setGameMode: (mode) => set({ gameMode: mode }),
    setGameState: (state) => set({ gameState: state }),

    logout: () => set({ user: null, roomId: null, isHost: false, gameState: 'LOBBY', gameMode: 'MULTIPLAYER' }),
}));

export default useGameStore;
