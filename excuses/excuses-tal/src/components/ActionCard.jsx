import { useNavigate } from 'react-router-dom';
import './ActionCard.css';

const ActionCard = ({ icon, title, description, to }) => {
  const navigate = useNavigate();

  return (
    <div className="action-card" onClick={() => navigate(to)}>
      <span className="action-icon">{icon}</span>
      <h3 className="action-title">{title}</h3>
      <p className="action-description">{description}</p>
    </div>
  );
};

export default ActionCard;
