import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ showBack = false }) => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        {showBack && (
          <button className="back-button" onClick={() => navigate('/')}>
            →
          </button>
        )}
        <div className="user-info">
          {user?.photoURL && (
            <img src={user.photoURL} alt={user.displayName} className="avatar" />
          )}
          <span className="user-name">{user?.displayName}</span>
        </div>
        <div className="score-badge">
          <span className="trophy">🏆</span>
          <span className="score">{userData?.score || 0}</span>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          יציאה
        </button>
      </div>
    </header>
  );
};

export default Header;
