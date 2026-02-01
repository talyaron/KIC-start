import React from 'react';

const SkinIcon = ({ rarity, type = 'weapon', color, size = 100 }) => {
    const primaryColor = color || '#ffffff';

    if (type === 'case') {
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="30" width="70" height="50" rx="4" fill={primaryColor} fillOpacity="0.2" stroke={primaryColor} strokeWidth="2" />
                <path d="M15 45H85" stroke={primaryColor} strokeWidth="2" />
                <path d="M30 30V80" stroke={primaryColor} strokeWidth="1" strokeOpacity="0.5" />
                <path d="M70 30V80" stroke={primaryColor} strokeWidth="1" strokeOpacity="0.5" />
                <rect x="42" y="40" width="16" height="10" rx="1" fill={primaryColor} />
                <path d="M20 30L35 20H65L80 30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    // Default weapon icon (stylized rifle shape)
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 50L30 50L35 40L85 40L90 45L90 55L85 60L40 60L35 75L25 75L20 55L10 50Z"
                fill={primaryColor} fillOpacity="0.3" stroke={primaryColor} strokeWidth="2" strokeLinejoin="round" />
            <rect x="45" y="45" width="25" height="10" rx="2" fill={primaryColor} fillOpacity="0.5" />
            <path d="M15 50L25 52" stroke={primaryColor} strokeWidth="1" />
            <circle cx="80" cy="45" r="2" fill={primaryColor} />
        </svg>
    );
};

export default SkinIcon;
