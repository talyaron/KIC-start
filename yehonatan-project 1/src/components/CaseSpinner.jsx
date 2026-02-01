import React, { useState, useEffect, useRef } from 'react';
import SkinIcon from './SkinIcon';
import './CaseSpinner.css';

const CaseSpinner = ({ items, onFinished, spinning }) => {
    const [offset, setOffset] = useState(0);
    const [transitionTime, setTransitionTime] = useState(0);
    const spinnerRef = useRef(null);

    // Item width is 150px + 10px gap = 160px
    const ITEM_WIDTH = 160;

    // We want to land on the item at index X. 
    // For a 100-item array, landing at index 90 gives a long dramatic spin.
    const WINNING_INDEX = 90;

    useEffect(() => {
        if (spinning && items.length > WINNING_INDEX) {
            // Reset position
            setOffset(0);
            setTransitionTime(0);

            setTimeout(() => {
                // The track has padding-left: 50%, meaning Item 0's left edge is at the marker when offset is 0.
                // To land precisely at randomInnerOffset into the winning item:
                const randomInnerOffset = Math.floor(Math.random() * 130) + 10;
                const targetOffset = (WINNING_INDEX * ITEM_WIDTH) + randomInnerOffset;

                setTransitionTime(8);
                setOffset(targetOffset);

                console.log("Spinner landing on:", items[WINNING_INDEX].name, "at index", WINNING_INDEX);

                setTimeout(() => {
                    onFinished(items[WINNING_INDEX]);
                }, 8200); // Slightly earlier than transition to feel smoother
            }, 50);
        }
    }, [spinning, items]);

    return (
        <div className="spinner-container glass-panel" ref={spinnerRef}>
            <div className="spinner-marker"></div>
            <div
                className="spinner-track"
                style={{
                    transform: `translateX(-${offset}px)`,
                    transition: transitionTime ? `transform ${transitionTime}s cubic-bezier(0.1, 0, 0.1, 1)` : 'none'
                }}
            >
                {items.map((item, index) => {
                    const color = item.rarityInfo?.color || '#ffffff';

                    return (
                        <div
                            key={`${item.id}-${index}`}
                            className="spinner-item"
                            style={{ borderBottom: `4px solid ${color}` }}
                        >
                            <div className="item-rarity-bg" style={{ background: `linear-gradient(to top, ${color}33, transparent)` }}></div>
                            <div className="item-image-wrapper">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <div className="fallback-icon" style={{ display: item.image ? 'none' : 'block' }}>
                                    <SkinIcon color={color} size={100} />
                                </div>
                            </div>
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CaseSpinner;
