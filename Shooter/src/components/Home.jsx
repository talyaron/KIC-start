import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();
    const [joinId, setJoinId] = useState('');

    if (!userData) return <div>Loading...</div>;

    return (
        <div className="full-screen" style={{
            background: 'linear-gradient(to bottom, #0a0a0f, #1a1a2e)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
        }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%', background: '#333',
                        border: '2px solid var(--accent-primary)', overflow: 'hidden'
                    }}>
                        {/* Avatar Placeholder */}
                        <div style={{ width: '100%', height: '100%', background: 'var(--accent-primary)', opacity: 0.2 }}></div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem' }}>{userData.displayName}</h2>
                        <div style={{ color: 'var(--accent-success)', fontSize: '0.9rem' }}>
                            ID: <span style={{ fontFamily: 'monospace' }}>{userData.friendId}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Lvl 5 • XP 450/1000</div>
                    </div>
                </div>
                <button className="secondary" onClick={() => logout()} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                    Logout
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>

                {/* Character Stage (Placeholder) */}
                <div style={{
                    height: '250px', width: '250px',
                    background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '4px solid rgba(255,255,255,0.1)',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '5rem', opacity: 0.8 }}>⚡</div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '500px' }}>
                    <button style={{ flex: 1, padding: '20px', fontSize: '1.2rem' }} onClick={() => navigate('/lobby/create')}>
                        Create Server
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                    <input
                        placeholder="Enter Friend ID"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        style={{ width: '150px', marginBottom: 0 }}
                    />
                    <button className="secondary" onClick={() => joinId && navigate(`/lobby/join/${joinId}`)}>
                        Join Friend
                    </button>
                </div>
            </div>

            {/* Bottom Menu */}
            <div style={{
                marginTop: 'auto',
                display: 'flex',
                gap: '15px',
                overflowX: 'auto',
                padding: '10px 0',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                {['Shop', 'Customize', 'Skills', 'Quests', 'Team'].map(item => (
                    <div key={item} style={{
                        minWidth: '100px',
                        height: '80px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #333',
                        cursor: 'pointer',
                        flexShrink: 0
                    }} onClick={() => alert(`${item} coming soon!`)}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
