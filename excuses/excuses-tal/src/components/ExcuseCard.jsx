import './ExcuseCard.css';

const categoryLabels = {
  late: 'איחור',
  homework: 'שיעורי בית',
  forgot_equipment: 'שכחתי ציוד',
  absence: 'היעדרות'
};

const ExcuseCard = ({ excuse, onUse, showStats = false }) => {
  return (
    <div className="excuse-card">
      <div className="excuse-header">
        <span className={`category-badge ${excuse.category}`}>
          {categoryLabels[excuse.category] || excuse.category}
        </span>
        {showStats && (
          <span className="stats">
            שימושים: {excuse.usageCount} | האמינו: {excuse.believedCount}
          </span>
        )}
      </div>
      <p className="excuse-text">{excuse.text}</p>
      <div className="excuse-footer">
        <span className="creator">יוצר: {excuse.creatorName}</span>
        {onUse && (
          <button className="use-button" onClick={() => onUse(excuse)}>
            השתמשתי!
          </button>
        )}
      </div>
    </div>
  );
};

export default ExcuseCard;
