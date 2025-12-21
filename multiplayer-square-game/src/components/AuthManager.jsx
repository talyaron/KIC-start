import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
    signInAnonymously,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import useGameStore from '../game/store';

const AuthManager = ({ children }) => {
    const { user, setUser, logout } = useGameStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (authUser) {
                // Derive 6-digit Game ID from UID
                const gameId = authUser.uid.substring(0, 6).toUpperCase();

                setUser({
                    uid: authUser.uid,
                    displayName: authUser.displayName || 'Guest',
                    isAnonymous: authUser.isAnonymous,
                    photoURL: authUser.photoURL,
                    gameId: gameId
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser]);

    const handleGuestLogin = async () => {
        try {
            setLoading(true);
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in anonymously:", error);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            logout();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white font-sans">
                <div className="p-8 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full text-center">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        SQUARE SHOOTER
                    </h1>
                    <p className="text-gray-400 mb-8">Multiplayer Geometry Warfare</p>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-3 px-4 bg-white text-gray-900 font-bold rounded hover:bg-gray-100 transition duration-200 flex items-center justify-center gap-2"
                        >
                            <span>Play with Google</span>
                        </button>
                        <button
                            onClick={handleGuestLogin}
                            className="w-full py-3 px-4 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition duration-200 border border-gray-600"
                        >
                            Play as Guest
                        </button>
                        <button
                            onClick={() => setUser({ uid: 'debug_user', displayName: 'Debug User', gameId: 'DEBUG1', isAnonymous: true })}
                            className="w-full py-2 px-4 bg-red-900/50 text-red-200 text-xs font-mono rounded hover:bg-red-900 transition duration-200 border border-red-800"
                        >
                            [DEV] Offline Mode
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If logged in, you can choose to render children or a user bar here.
    // We'll render children (the app) and a top bar.
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex items-center gap-4 z-50">
                <div className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 flex items-center gap-3">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                            {user.displayName?.[0] || 'G'}
                        </div>
                    )}
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-400">ID: {user.gameId}</span>
                        <span className="font-bold text-sm leading-none">{user.displayName}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white transition text-xs underline"
                >
                    Logout
                </button>
            </div>
            {children}
        </div>
    );
};

export default AuthManager;
