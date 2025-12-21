import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { ref, set, onValue, update, get } from 'firebase/database';

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
                const rid = userData.friendId;
                setRoomId(rid);
                setIsHost(true);

                // Set initial room state
                const roomRef = ref(db, `rooms/${rid}`);
                await set(roomRef, {
                    host: userData.uid,
                    status: 'waiting',
                    players: {
                        [userData.uid]: {
                            displayName: userData.displayName,
                            ready: true,
                            hp: 100,
                            x: 200,
                            y: 500,
                            color: '#0000ff'
                        }
                    }
                });
            } else if (mode === 'join' && id) {
                // Check if room exists
                const roomRef = ref(db, `rooms/${id}`);
                const snap = await get(roomRef);
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

    // Handle Joining Existing Room
    useEffect(() => {
        if (roomId && user) {
            const roomRef = ref(db, `rooms/${roomId}`);

            // Subscribe to room updates
            const unsub = onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setPlayers(data.players || {});
                    if (data.status === 'playing') {
                        navigate(`/game/${roomId}`);
                    }
                }
            });

            // Add self to players if not host
            if (!isHost) {
                const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
                update(playerRef, {
                    displayName: userData.displayName,
                    hp: 100,
                    x: 200,
                    y: 500,
                    ready: true
                }).catch(e => console.error("Error joining:", e));
            }

            return () => {
                unsub();
            };
        }
    }, [roomId]);

    const startGame = () => {
        const roomRef = ref(db, `rooms/${roomId}`);
        update(roomRef, { status: 'playing' });
    };

    if (!roomId) return <div className="full-screen flex-center">Loading or Joining...</div>;

    return (
        <div className="full-screen flex-center" style={{ flexDirection: 'column' }}>
            <h1>Lobby: {roomId}</h1>
            <div style={{ margin: '20px', width: '300px' }}>
                {Object.entries(players)
                    .filter(([_, p]) => p && p.displayName) // Filter out ghosts
                    .map(([uid, p]) => (
                        <div key={uid} style={{ background: '#333', padding: '10px', marginTop: '5px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.displayName}</span>
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
