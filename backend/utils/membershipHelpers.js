// utils/membershipHelpers.js

/**
 * Calculates the end date of a membership based on the start date and membership type.
 * @param {Date} startDate - The start date of the membership.
 * @param {string} membershipType - The type of membership (e.g., "1 Month", "1 Year").
 * @returns {Date} The calculated end date.
 */
function calculateEndDate(startDate, membershipType) {
    const start = new Date(startDate);
    let end = new Date(start);

    switch (membershipType) {
        case "1 Month":
            end.setMonth(start.getMonth() + 1);
            break;
        case "3 Months":
            end.setMonth(start.getMonth() + 3);
            break;
        case "6 Months":
            end.setMonth(start.getMonth() + 6);
            break;
        case "1 Year":
            end.setFullYear(start.getFullYear() + 1);
            break;
        default:
            throw new Error("Invalid membership type");
    }
    return end;
}

/**
 * Calculates the membership status based on the end date.
 * @param {Date|string|null} membershipEnd - The membership end date.
 * @returns {string} The status ("active", "expiring soon", "expired", or "unknown").
 */
function calculateStatus(membershipEnd) {
    if (!membershipEnd) {
        return "unknown";
    }

    const today = new Date();
    const endDate = new Date(membershipEnd);

    // Set times to midnight for accurate day comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    // Use Math.ceil() to round up, ensuring partial days are counted as a full remaining day.
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // ⭐ THE FIX: Changed diffDays <= 0 to diffDays < 0.
    // This ensures that if diffDays is 0 (i.e., today is the end date), the user is still 'active'.
    if (diffDays < 0) {
        return "expired"; // Membership has expired (i.e., tomorrow/yesterday)
    } else if (diffDays <= 3) {
        return "expiring soon"; // Membership expires in 3 days or less (including today)
    } else {
        return "active"; // Membership is valid for more than 3 days
    }
}

module.exports = {
    calculateEndDate,
    calculateStatus,
};