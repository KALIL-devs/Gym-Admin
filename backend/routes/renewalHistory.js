// server/routes/renewalHistory.js

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

/**
 * GET /api/renewal-history
 * Fetches all renewal records, optionally filtered by a date range.
 * Query Parameters: startDate, endDate (both expected in YYYY-MM-DD format)
 */
router.get('/renewal-history', (req, res) => {
    const db = getDb();
    
    // Extract optional filters from query parameters
    const { startDate, endDate } = req.query; 

    // Base SQL Query: Join renewals with client info for a complete log
    let sql = `
        SELECT
            C.rollno AS RollNo,
            C.name AS ClientName,
            C.trainerName AS Trainer,
            R.membershipType AS MembershipType,
            R.pricePaid AS PricePaid,
            R.renewalDate AS RenewalDate,
            R.newEndDate AS NewExpirationDate
        FROM
            membership_renewals R
        JOIN
            clients C ON R.clientId = C.id
    `;
    
    let params = [];
    
    // --- Date Range Filtering ---
    if (startDate && endDate) {
        // Use DATE() function to handle date string comparisons correctly in SQLite
        sql += ` WHERE DATE(R.renewalDate) BETWEEN DATE(?) AND DATE(?)`;
        params.push(startDate, endDate);
    }
    
    // --- Sorting ---
    // Order by most recent renewal date first (Descending)
    sql += ` ORDER BY R.renewalDate DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("❌ Error fetching renewal history:", err.message);
            return res.status(500).json({ error: "Failed to fetch renewal history.", details: err.message });
        }

        // Send the fetched data back to the frontend
        res.json(rows);
    });
});

module.exports = router;