import React, { useState, useMemo } from 'react';

// --- Helper Functions and Constants ---

const EXPIRING_SOON_DAYS = 3;
const RECENTLY_EXPIRED_DAYS = 3; 

/**
 * Calculates the difference in days between two dates.
 * @param {Date} date1 - The first date (usually endDate).
 * @param {Date} date2 - The second date (usually today).
 * @returns {number} The difference in full days (date1 - date2).
 */
const getDayDifference = (date1, date2) => {
    const ONE_DAY = 1000 * 60 * 60 * 24;
    // Set both to midnight to ensure accurate day comparison
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

    const diffTime = d1.getTime() - d2.getTime();
    return Math.round(diffTime / ONE_DAY);
};

/**
 * Categorizes a client based on their membership end date.
 * @param {object} client - The client object with an 'endDate'.
 * @param {Date} today - The current date.
 * @returns {string} The category key.
 */
const getClientCategory = (client, today) => {
    if (!client.endDate) {
        return 'future';
    }

    const endDate = new Date(client.endDate);
    const daysDifference = getDayDifference(endDate, today);

    if (daysDifference < 0) {
        // Membership has expired (diff is -1, -2, etc.)
        const daysSinceExpired = Math.abs(daysDifference);
        
        // Has it expired in the last 1 to 3 days?
        if (daysSinceExpired <= RECENTLY_EXPIRED_DAYS) {
            return 'recentlyExpired'; 
        }
        
        // Existing expired checks
        if (daysSinceExpired > 31) {
            return 'expiredOverMonth';
        }
        return 'expiredWithinMonth';
    }

    if (daysDifference === 0) {
        return 'expiresToday';
    }

    if (daysDifference > 0 && daysDifference <= EXPIRING_SOON_DAYS) {
        return 'expiringSoon';
    }

    return 'future';
};

/**
 * URL-encodes a string.
 * @param {string} text - The text to encode.
 * @returns {string} The URL-encoded text.
 */
const urlEncode = (text) => {
    return encodeURIComponent(text);
};

// --- Child Component for the Cards ---

function StatusCard({ title, count, categoryKey, selectedCategory, onClick, cardStyle }) {
    const isSelected = selectedCategory === categoryKey;
    
    const baseCardClasses = "p-6 rounded-lg shadow-lg flex-1 min-w-[150px] text-center cursor-pointer transition-colors";
    const statTextClasses = "text-3xl font-bold";
    const labelClasses = "mt-2 text-dark-text/75 text-sm font-medium dark:text-light-text/75";

    // Use specific category style
    const cardBgColor = cardStyle.selectedBg;
    const countTextColor = cardStyle.countText;

    const unselectedBg = "bg-dark-card hover:bg-gray-800 dark:bg-light-card dark:hover:bg-gray-100";
    
    const selectedClass = `shadow-2xl scale-[1.03] ${cardBgColor}`; 
    const unselectedClass = unselectedBg;

    return (
        <div
            className={`${baseCardClasses} ${isSelected ? selectedClass : unselectedClass}`}
            onClick={() => onClick(categoryKey)}
        >
            <div className={`${statTextClasses} ${countTextColor}`}>{count}</div> 
            <div className={labelClasses}>{title}</div> 
        </div>
    );
}

// --- Child Component for the Tables (Used for drill-down) - UPDATED ---

function DrillDownTable({ clients, expandedClientUid, handleClientClick, emptyMessage }) {
    if (clients.length === 0) {
        return (
            <div className="p-4 bg-dark-bg/50 rounded-md text-center text-dark-text/75 dark:bg-light-bg/50 dark:text-light-text/75 mt-4">
                {emptyMessage}
            </div>
        );
    }
    
    /**
     * Generates the WhatsApp deep link and opens it in a new tab.
     * @param {object} client - The client data object.
     */
    const handleSendReminder = (client) => {
        // 1. Determine the appropriate reminder message
        const isClientExpired = ['recentlyExpired', 'expiredWithinMonth', 'expiredOverMonth'].includes(client.category);
        
        const reminderText = isClientExpired
            ? `Hi ${client.name}, your membership expired on ${client.endDate}. Please contact us to renew your access!`
            : `Hi ${client.name}, your membership is expiring soon on ${client.endDate}. Renew now to avoid interruption!`;

        // 2. Format the phone number (remove non-digits, keep country code)
        const cleanNumber = client.phone.replace(/[^0-9]/g, '');

        // 3. Create the WhatsApp Deep Link
        const whatsappLink = `https://wa.me/${cleanNumber}?text=${urlEncode(reminderText)}`;

        // 4. Open the link (This will prompt the user to open WhatsApp)
        window.open(whatsappLink, '_blank');
    };
    
    // Determine if the client is in an Expired status
    const shouldShowExpiredTag = (client) => {
        return ['recentlyExpired', 'expiredWithinMonth', 'expiredOverMonth'].includes(client.category);
    }

    return (
        <div className="mt-4">
            <ul className="space-y-2">
                {clients.map((client) => (
                    <li
                        key={client.uid}
                        className="p-3 rounded-md bg-dark-bg text-dark-text dark:bg-light-bg dark:text-light-text cursor-pointer transition-colors duration-200 hover:bg-dark-accent/20 dark:hover:bg-light-accent/20"
                        onClick={() => handleClientClick(client.uid)}
                    >
                        <div className="flex justify-between items-center">
                            <span>
                                <b className="text-dark-accent dark:text-light-accent">{client.name}</b> (Roll No: {client.rollno}) - Ends: <b className="font-mono">{client.endDate || 'N/A'}</b>
                            </span>
                            <span className="text-sm">
                                {shouldShowExpiredTag(client) ? '⚠️ EXPIRED' : '⏳ EXPIRING / ACTIVE'}
                            </span>
                        </div>
                        {expandedClientUid === client.uid && (
                            <div className="mt-2 text-sm text-dark-text-highlight dark:text-light-text-highlight flex justify-between items-center">
                                <span>
                                    📞 Phone: {client.phone}
                                </span>
                                
                                {/* Show Send Reminder button only if membership is tracked */}
                                {client.endDate && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent the parent <li> click event
                                            handleSendReminder(client);
                                        }}
                                        className="ml-4 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                        Send Reminder
                                    </button>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// --- Main Component Constants ---

/**
 * Maps category keys to display titles, styles, and empty messages.
 */
const CATEGORY_MAP = {
    recentlyExpired: { 
        // ⭐ Red for highest urgency
        title: `Recently Expired (Past ${RECENTLY_EXPIRED_DAYS} Days)`,
        emptyMessage: "✅ No clients in this category.",
        style: {
            countText: "text-red-700 font-bold dark:text-red-500",
            selectedBg: "bg-red-700/10 dark:bg-red-300/10",
        },
        isExpired: true,
    },
    expiresToday: {
        // ⭐ Orange for high urgency
        title: "Expires TODAY",
        emptyMessage: "🥳 No memberships expire today. All good!",
        style: {
            countText: "text-orange-600 font-bold dark:text-orange-500", 
            selectedBg: "bg-orange-600/10 dark:bg-orange-300/10",
        },
        isExpired: false, 
    },
    expiringSoon: {
        // ⭐ Red for highest urgency
        title: `Expiring SOON (Next ${EXPIRING_SOON_DAYS} Days)`,
        emptyMessage: `✨ No clients are set to expire in the next ${EXPIRING_SOON_DAYS} days.`,
        style: {
            countText: "text-red-700 font-bold dark:text-red-500",
            selectedBg: "bg-red-700/10 dark:bg-red-300/10",
        },
        isExpired: false,
    },
    expiredWithinMonth: {
        // 🟠 Orange for text color and background highlight
        title: "Expired Within One Month (Older than 3 days)",
        emptyMessage: "✅ No clients in this category.",
        style: {
            countText: "text-orange-700 font-bold dark:text-orange-500",
            selectedBg: "bg-orange-700/10 dark:bg-orange-300/10",
        },
        isExpired: true,
    },
    expiredOverMonth: {
        // ⚫ Gray for text color and background highlight
        title: "Expired Over One Month Ago",
        emptyMessage: "🙌 No clients in this category.",
        style: {
            countText: "text-gray-700 font-bold dark:text-gray-500",
            selectedBg: "bg-gray-700/10 dark:bg-gray-300/10",
        },
        isExpired: true,
    },
    future: { // This is needed to handle cases where a client is 'active' but not 'expiring soon'
        title: "Active (Future Expiry)",
        emptyMessage: "All active clients are in the 'Expiring Soon' list.",
        style: {
            countText: "text-gray-700 font-bold dark:text-gray-500",
            selectedBg: "bg-gray-700/10 dark:bg-gray-300/10",
        },
        isExpired: false,
    },
};


const CARD_CATEGORIES = [
    'recentlyExpired',
    'expiresToday',   
    'expiringSoon',   
    'expiredWithinMonth',
    'expiredOverMonth'
];

// --- Main Component ---

function MembershipDashboard({ clients }) {
    // Initial state set to 'recentlyExpired' 
    const [selectedCategory, setSelectedCategory] = useState('recentlyExpired'); 
    const [expandedClientUid, setExpandedClientUid] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    
    const today = useMemo(() => new Date(), []); 

    const handleClientClick = (uid) => {
        setExpandedClientUid(prevUid => (prevUid === uid ? null : uid));
    };

    const handleCardClick = (categoryKey) => {
        // Toggle: Clicking the same card deselects it. If search is active, it still filters the list, but shows a 'default' (future) status if deselected.
        // We'll default to the most urgent status ('recentlyExpired') on deselect if no search is active, or just toggle.
        setSelectedCategory(prevCat => (prevCat === categoryKey ? null : categoryKey));
        setExpandedClientUid(null); 
    };
    
    // MODIFIED useMemo: Filter clients by search term first, then categorize.
    const filteredAndCategorizedClients = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        // 1. Filter clients based on search term (only filter the *input* list)
        const filteredInputClients = clients.filter(client => {
            if (!searchTerm) return true; 

            // Search name or roll number
            return client.name.toLowerCase().includes(lowerCaseSearch) ||
                   client.rollno?.toString().includes(lowerCaseSearch);
        });

        // 2. Categorize the filtered clients
        const categories = {
            expiresToday: [],
            expiringSoon: [],
            recentlyExpired: [],
            expiredWithinMonth: [],
            expiredOverMonth: [],
            future: [], 
        };

        filteredInputClients.forEach(client => {
            if (client && client.endDate) {
                const category = getClientCategory(client, today);
                client.category = category;
                // Safely push to the specific category list
                categories[category]?.push(client);
            }
        });
        return categories;
    }, [clients, today, searchTerm]);


    // Determine the clients and table props for the drill-down view
    const currentCategoryKey = selectedCategory && filteredAndCategorizedClients[selectedCategory] ? selectedCategory : 'recentlyExpired'; // Default to a key if none selected
    
    const drillDownClients = filteredAndCategorizedClients[currentCategoryKey] || [];
        
    const drillDownProps = CATEGORY_MAP[currentCategoryKey] || CATEGORY_MAP['recentlyExpired']; // Default to a key's props
    
    // Adjust empty message if a search is active and the list is empty
    const emptyMessage = (searchTerm && drillDownClients.length === 0) 
        ? `No clients match "${searchTerm}" in the "${drillDownProps.title}" status.`
        : drillDownProps.emptyMessage;
    
    if (clients.length === 0) {
        return (
            <div className="p-8 h-screen bg-dark-bg text-dark-text dark:bg-light-bg dark:text-light-text">
                <div className="p-4 bg-dark-card rounded-lg text-center shadow-lg dark:bg-light-card">
                    🎉 No client records found.
                </div>
            </div>
        );
    }

    // Determine which categories to show (only the ones in CARD_CATEGORIES)
    const cardCategoriesToShow = CARD_CATEGORIES.filter(key => CATEGORY_MAP[key]);

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-dark-bg text-dark-text dark:bg-light-bg dark:text-light-text">
            <h2 className="text-3xl font-bold mb-6 text-dark-accent dark:text-light-accent">
                Membership Status Dashboard 📊
            </h2>
            
            {/* Search Input Field */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by client name or roll number..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Do not change selectedCategory here, let the selection filter the search results.
                        // Or, keep the original selected category to filter the results.
                        setExpandedClientUid(null);
                    }}
                    className="w-full p-3 rounded-lg bg-dark-card text-dark-text border border-dark-accent/30 dark:bg-light-card dark:text-light-text dark:border-light-accent/30 focus:outline-none focus:ring-2 focus:ring-dark-accent dark:focus:ring-light-accent"
                />
            </div>

            {/* --- 1. Status Cards Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {cardCategoriesToShow.map(categoryKey => {
                    const categoryProps = CATEGORY_MAP[categoryKey];
                    // Get count from the filtered/categorized list
                    const count = filteredAndCategorizedClients[categoryKey]?.length || 0;
                    
                    return (
                        <StatusCard
                            key={categoryKey}
                            title={categoryProps.title}
                            count={count}
                            categoryKey={categoryKey}
                            selectedCategory={currentCategoryKey}
                            onClick={handleCardClick}
                            cardStyle={categoryProps.style}
                        />
                    );
                })}
            </div>
            
            {/* --- 2. Drill-Down List/Table --- */}
            <div className="bg-dark-card p-4 rounded-lg shadow-lg dark:bg-light-card">
                <h3 className="text-xl font-semibold mb-3 text-dark-text-highlight dark:text-light-text-highlight">
                    {drillDownProps.title} List ({drillDownClients.length})
                </h3>
                
                <DrillDownTable
                    clients={drillDownClients}
                    expandedClientUid={expandedClientUid}
                    handleClientClick={handleClientClick}
                    emptyMessage={emptyMessage}
                />
            </div>
        </div>
    );
}

export default MembershipDashboard;