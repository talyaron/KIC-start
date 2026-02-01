import React from 'react';
import SkinIcon from './SkinIcon';
import './CaseCard.css';

const CaseCard = ({ caseData, onSelect }) => {
    return (
        <div className="case-card glass-panel" onClick={() => onSelect(caseData)}>
            <div className="case-image-container">
                <SkinIcon type="case" color="#ffffff" size={120} />
            </div>
            <div className="case-details">
                <h3>{caseData.name}</h3>
                <p className="case-price">${caseData.price.toFixed(2)}</p>
            </div>
            <button className="btn btn-primary open-btn">Open Case</button>
        </div>
    );
};

export default CaseCard;
