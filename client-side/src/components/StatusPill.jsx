// src/components/StatusPill.jsx
import React from 'react';

/**
 * Displays the membership status in a colored pill format.
 */
export const StatusPill = React.memo(({ status }) => {
    let bgColor = 'bg-gray-200 text-gray-800'; 
    let displayStatus = status ? status.toUpperCase() : 'N/A';
    
    // Statuses based on your logic: 'active', 'expiring', 'inactive' (from expired/unknown)
    switch (status) {
        case 'active':
            bgColor = 'bg-green-100 text-green-700 font-semibold';
            break;
        case 'expiring':
            bgColor = 'bg-amber-100 text-amber-700 font-semibold'; 
            displayStatus = 'EXPIRING SOON';
            break;
        case 'inactive':
            bgColor = 'bg-red-100 text-red-700 font-semibold';
            displayStatus = 'EXPIRED/INACTIVE';
            break;
        default:
            bgColor = 'bg-gray-200 text-gray-800 font-semibold';
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs tracking-wider ${bgColor}`}>
            {displayStatus}
        </span>
    );
});