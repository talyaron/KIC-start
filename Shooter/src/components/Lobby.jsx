import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function Lobby() {
    const { mode, id } = useParams();
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState(null);
    const [players, setPlayers] = useState({});
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        if (!userData) return;

        const initLobby = async () => {
            if (mode === 'create') {
                // Use Friend ID as Room ID for simplicity in Firestore too
                const rid = userData.friendId;
                setRoomId(rid);
                setIsHost(true);

                // Set initial room state
                await setDoc(doc(db, 'rooms', rid), {
                    host: userData.uid,
                    status: 'waiting',
                    players: {
                        [userData.uid]: {
                            displayName: userData.displayName,
                            ready: true,
                            hp: 100,
                            x: 200,
                            y: 500,
                            color: '#00f0ff'
                        }
                    }
                });
            } else if (mode === 'join' && id) {
                // For Firestore, reading all rooms is expensive.
                // We assume ID passed IS the Room ID (friend ID of host).
                // Check if room exists
                const roomRef = doc(db, 'rooms', id);
                const snap = await getDoc(roomRef);
                if (snap.exists()) {
                    setRoomId(id);
                } else {
                    alert("Room not found!");
                    navigate('/');
                }
            }
        };
        initLobby();

    }, [mode, id, userData]);

    // Handle Joining Existing Room (once resolved)
    useEffect(() => {
        if (roomId && user) {
            const roomRef = doc(db, 'rooms', roomId);

            // Subscribe to room updates
            const unsub = onSnapshot(roomRef, (snapshot) => {
                const data = snapshot.data();
                if (data) {
                    setPlayers(data.players || {});
                    if (data.status === 'playing') {
                        navigate(`/game/${roomId}`);
                    }
                }
            });

            // Add self to players if not host
            if (!isHost) {
                // Firestore requires reading, modifying map, and writing back OR using dot notation for updates
                // We use dot notation 'players.UID'
                updateDoc(roomRef, {
                    [`players.${user.uid}`]: {
                        displayName: userData.displayName,
                        hp: 100,
                        x: 200,
                        y: 500,
                        ready: true
                    }
                }).catch(e => console.error("Error joining:", e));
            }

            return () => {
                unsub();
            };
        }
    }, [roomId]);

    const startGame = () => {
        updateDoc(doc(db, 'rooms', roomId), { status: 'playing' });
    };

    if (!roomId) return <div className="full-screen flex-center">Loading or Joining...</div>;

    return (
        <div className="full-screen flex-center" style={{ flexDirection: 'column' }}>
            <h1>Lobby: {roomId}</h1>
            <div style={{ margin: '20px', width: '300px' }}>
                {Object.entries(players).map(([uid, p]) => (
                    <div key={uid} style={{ background: '#333', padding: '10px', marginTop: '5px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{p?.displayName}</span>
                        <span style={{ color: 'green' }}>Ready</span>
                    </div>
                ))}
            </div>

            {isHost ? (
                <button onClick={startGame}>Start Game</button>
            ) : (
                <div>Waiting for host...</div>
            )}
        </div>
    );
}
