import './LeaderboardItem.css';

const LeaderboardItem = ({ rank, user, isCurrentUser }) => {
  const getMedal = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <div className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="rank">
        {getMedal(rank) || `#${rank}`}
      </div>
      <img
        src={user.photoURL || '/default-avatar.png'}
        alt={user.displayName}
        className="leaderboard-avatar"
      />
      <span className="leaderboard-name">{user.displayName}</span>
      <span className="leaderboard-score">{user.score} נקודות</span>
    </div>
  );
};

export default LeaderboardItem;
