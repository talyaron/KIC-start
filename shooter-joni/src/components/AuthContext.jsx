import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInAnonymously,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        console.log("AuthContext: Setting up auth listener...");
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("AuthContext: Auth changed:", currentUser ? "User found" : "No user");
            setUser(currentUser);
            if (currentUser) {
                // Fetch or create user data (especially the friend ID)
                console.log("AuthContext: Ensuring user data for", currentUser.uid);
                await ensureUserData(currentUser);
            } else {
                setUserData(null);
            }
            console.log("AuthContext: Loading finished.");
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function ensureUserData(currentUser) {
        // RTDB Path: users/uid
        const userRef = ref(db, `users/${currentUser.uid}`);
        try {
            console.log("AuthContext: Fetching user data...");
            const snapshot = await get(userRef);
            console.log("AuthContext: User data exists?", snapshot.exists());
            if (snapshot.exists()) {
                setUserData(snapshot.val());
            } else {
                console.log("AuthContext: Creating new user data...");
                // Create new user entry
                const friendId = Math.floor(100000 + Math.random() * 900000).toString();
                const data = {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || `Guest-${friendId.slice(0, 3)}`,
                    email: currentUser.email || 'guest',
                    friendId: friendId,
                    createdAt: Date.now()
                };
                await set(userRef, data);
                console.log("AuthContext: User data created.");
                setUserData(data);
            }
        } catch (error) {
            console.error("Error creating user data:", error);
            setUserData({ displayName: "Offline Guest", friendId: "000000" });
        }
    }

    function loginGuest() {
        return signInAnonymously(auth);
    }

    function loginGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    const value = {
        user,
        userData,
        loginGuest,
        loginGoogle,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
