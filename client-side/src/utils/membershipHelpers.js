// utils/membershipHelpers.js

// =========================================================================
// 🧩 MEMBERSHIP UTILITY FUNCTIONS
// =========================================================================

/**
 * Gets the duration in months for a given membership type.
 * @param {string} type - The membership type (e.g., "1 Month", "1 Year").
 * @returns {number} The duration in months.
 */
export const getMonthsDuration = (type) => {
    // Normalize to handle variations like "1 month" or "1 Month"
    const normalizedType = type ? type.toLowerCase() : ''; 
    switch (normalizedType) {
        case '1 month': return 1;
        case '3 months': return 3;
        case '6 months': return 6;
        case '1 year': return 12;
        default: return 0;
    }
};

/**
 * Calculates the new end date based on a start date and membership duration type.
 * This is the preferred method for calculating the **projected end date** of a renewal.
 * * Example: Start Date 2024-01-01 + 1 month = End Date 2024-01-31 (not 2024-02-01)
 * * @param {string} startDateString - The starting date (YYYY-MM-DD format).
 * @param {string} type - The membership duration type (e.g., "1 month").
 * @returns {string} The calculated end date (YYYY-MM-DD) or 'N/A'.
 */
export const calculateNewEndDate = (startDateString, type) => {
    if (!startDateString) return 'N/A';
    const monthsToAdd = getMonthsDuration(type);
    if (monthsToAdd === 0) return 'N/A';
    
    // Parse date safely (using T00:00:00 to avoid local timezone issues)
    const startDate = new Date(startDateString + 'T00:00:00'); 
    if (isNaN(startDate.getTime())) return 'N/A';
    
    // 1. Calculate the start date of the NEXT period
    const nextPeriodStart = new Date(startDate);
    nextPeriodStart.setMonth(nextPeriodStart.getMonth() + monthsToAdd);

    // 2. Subtract one day to get the end date of the membership period
    // 86400000 is milliseconds in a day.
    const newEndDate = new Date(nextPeriodStart.getTime() - 86400000); 

    const year = newEndDate.getFullYear();
    const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(newEndDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Calculates the membership status based on the end date.
 * @param {Date|string|null} membershipEnd - The membership end date.
 * @returns {string} The status ("active", "expiring", "expired", or "unknown").
 */
export function calculateStatus(membershipEnd) {
    if (!membershipEnd) {
        return "unknown";
    }

    const today = new Date();
    // Safely parse the membership end date string
    const endDate = new Date(membershipEnd + 'T00:00:00'); 

    // Set today's date to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    
    // Check for invalid date
    if (isNaN(endDate.getTime())) {
        return "unknown";
    }
    
    // Calculate difference in milliseconds
    const diffTime = endDate.getTime() - today.getTime();
    // Calculate difference in days (ceiling ensures partial days count as a full day left)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // Using 'expiring' instead of 'expires soon' for consistency
    const EXPIRING_THRESHOLD_DAYS = 7; 

    if (diffDays < 0) {
        return "inactive"; // Changed from 'expired' to 'inactive' for broader meaning
    } else if (diffDays <= EXPIRING_THRESHOLD_DAYS) {
        return "expiring";
    } else {
        return "active";
    }
}

// =========================================================================
// 🌐 GENERAL UTILITY (API FETCHING)
// This is moved here for simplicity, but ideally should be in its own file
// e.g., utils/apiHelpers.js or utils/fetch.js
// =========================================================================

/**
 * Function for exponential backoff and retry for API calls.
 * @param {string} url - The API endpoint URL.
 * @param {object} options - The fetch options (method, headers, body, etc.).
 * @param {number} retries - The maximum number of retries.
 * @returns {Promise<Response>} The successful fetch response.
 */
export const retryFetchWithBackoff = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // Return on success (2xx) or specific non-retryable statuses (e.g., 404, 401)
            if (response.ok || response.status === 404 || response.status === 401 || response.status === 403) {
                return response; 
            }
            // Throw error for retryable status codes (e.g., 5xx, or network errors)
            throw new Error(`Server returned status ${response.status}`);
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Fetch failed after all retries.");
};