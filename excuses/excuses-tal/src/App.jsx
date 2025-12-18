import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Main from './pages/Main';
import FastExcuse from './pages/FastExcuse';
import TailoredExcuse from './pages/TailoredExcuse';
import CreateExcuse from './pages/CreateExcuse';
import Championship from './pages/Championship';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <span className="loading-emoji">🎭</span>
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Main />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fast"
        element={
          <ProtectedRoute>
            <FastExcuse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tailored"
        element={
          <ProtectedRoute>
            <TailoredExcuse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateExcuse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/championship"
        element={
          <ProtectedRoute>
            <Championship />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
