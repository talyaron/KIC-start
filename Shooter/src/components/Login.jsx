import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { loginGuest, loginGoogle } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleGuest = async () => {
        try {
            await loginGuest();
            navigate('/');
        } catch (err) {
            setError('Failed to login as guest: ' + err.message);
            console.error(err);
        }
    };

    const handleGoogle = async () => {
        try {
            await loginGoogle();
            navigate('/');
        } catch (err) {
            setError('Failed to login with Google: ' + err.message);
            console.error(err);
        }
    };

    return (
        <div className="full-screen flex-center" style={{
            background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)'
        }}>
            <div style={{
                padding: '40px',
                background: 'rgba(19, 19, 31, 0.8)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)'
            }}>
                <h1 className="neon-text" style={{ marginBottom: '30px', fontSize: '3rem' }}>
                    NEON SHOOTER
                </h1>

                {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '20px' }}>{error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={handleGoogle} style={{ fontSize: '1.1rem' }}>
                        Sign in with Google
                    </button>
                    <button className="secondary" onClick={handleGuest}>
                        Play as Guest
                    </button>
                </div>
            </div>
        </div>
    );
}
