import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameCanvas from './components/GameCanvas';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } />
                    <Route path="/lobby/:mode/:id?" element={
                        <ProtectedRoute>
                            <Lobby />
                        </ProtectedRoute>
                    } />
                    <Route path="/game/:roomId" element={
                        <ProtectedRoute>
                            <GameCanvas />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
