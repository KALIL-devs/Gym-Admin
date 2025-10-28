// server/routes/adminRoutes.js

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { calculateEndDate, calculateStatus } = require("../utils/membershipHelpers");
const crypto = require("crypto");
const { runQuery, getQuery, allQuery, runTransactionQuery } = require('../dbUtils'); 

function generatePassword(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = () => { 
    const router = express.Router();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    /**
     * Helper function to fix the "off-by-one" error for status checks.
     * Membership is valid *through* the due date, so we check against the day after.
     * @param {string} endDateString The membership end date string (YYYY-MM-DD).
     * @returns {Date|null} The Date object adjusted to the next day, or null.
     */
    const getAdjustedEndDateForStatusCheck = (endDateString) => {
        if (!endDateString) return null;
        // Create a new Date object from the provided end date (e.g., '2025-10-21')
        const end = new Date(endDateString);
        
        // Check for "Invalid Date"
        if (isNaN(end.getTime())) return null;

        // ⭐ THE FIX: Advance the date by one day.
        // This ensures membership is valid ON the endDate and expires AFTER it.
        end.setDate(end.getDate() + 1); 
        
        return end;
    };


    // Admin Login Route
    router.post("/login", async (req, res) => {
        // ... (Login logic is unchanged)
        const { email, password } = req.body;
        try {
            const user = await getQuery("SELECT * FROM admins WHERE email = ?", [email]);

            if (!user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const adminData = { ...user };
            delete adminData.password_hash;

            res.status(200).json({
                message: "Login successful",
                user: adminData,
                token: token
            });
        } catch (error) {
            console.error("❌ Admin login error:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    });

    // Get All Clients Route
    router.get("/clients", async (req, res) => {
        // ... (Get All Clients logic is unchanged)
        try {
            const clients = await allQuery(`SELECT * FROM clients ORDER BY name`, []);

            const clientsWithStatus = clients.map(client => {
                const clientData = { ...client };
                clientData.endDate = clientData.membershipEnd; 
                
                if (clientData.membershipEnd) {
                    // ⭐ FIX APPLIED: Use the adjusted date for status calculation
                    const adjustedEndDate = getAdjustedEndDateForStatusCheck(clientData.membershipEnd);
                    clientData.status = calculateStatus(adjustedEndDate);
                }
                delete clientData.password_hash;
                return clientData;
            });

            res.status(200).json(clientsWithStatus);
        } catch (error) {
            console.error("❌ Error fetching clients:", error);
            res.status(500).json({ error: "Error fetching clients" });
        }
    });

    // Route to get a single client's details by ID
    router.get("/clients/:id", async (req, res) => {
        // ... (Get Single Client logic is unchanged)
        try {
            const { id } = req.params;
            const client = await getQuery("SELECT * FROM clients WHERE id = ?", [id]);

            if (!client) {
                return res.status(404).json({ error: "Client not found." });
            }

            const clientData = { ...client };
            clientData.endDate = clientData.membershipEnd; 
            
            if (clientData.membershipEnd) {
                // ⭐ FIX APPLIED: Use the adjusted date for status calculation
                const adjustedEndDate = getAdjustedEndDateForStatusCheck(clientData.membershipEnd);
                clientData.status = calculateStatus(adjustedEndDate);
            }
            delete clientData.password_hash;

            res.status(200).json(clientData);
        } catch (error) {
            console.error("❌ Error fetching client details:", error);
            res.status(500).json({ error: "Error fetching client details." });
        }
    });

    // Create User Route
    router.post("/create-user", async (req, res) => {
        try {
            const {
                rollno, 
                name, 
                dob, 
                gender, 
                phone, 
                email, 
                membershipType, 
                startDate, 
                membershipEnd, 
                address, 
                hasTrainer, 
                trainerName, 
            } = req.body;

            if (!name || !dob || !membershipType || !startDate || !membershipEnd) {
                return res.status(400).json({ error: "Name, Date of Birth, Membership Type, Start Date, and End Date are required" });
            }

            const existingUser = await getQuery("SELECT * FROM clients WHERE rollno = ? OR email = ?", [rollno, email]);

            if (existingUser) {
                if (existingUser.rollno === rollno) {
                    return res.status(409).json({ error: "A user with this Roll No already exists." });
                }
                if (existingUser.email === email) {
                    return res.status(409).json({ error: "A user with this Email already exists." });
                }
            }

            // Use the received date strings.
            const start = new Date(startDate); 
            // const end = new Date(membershipEnd); // Not strictly needed, we use the string

            // ⭐ FIX APPLIED: Adjust the end date for the status check
            const adjustedEndDate = getAdjustedEndDateForStatusCheck(membershipEnd);
            const status = calculateStatus(adjustedEndDate); 
            
            const uid = crypto.randomUUID();
            const role = 'client';
            const password = generatePassword(8);
            const passwordHash = await bcrypt.hash(password, 10);
            
            // The dates are formatted as YYYY-MM-DD strings for the SQL query
            const sqlStart = start.toISOString().split('T')[0];
            const sqlEnd = new Date(membershipEnd).toISOString().split('T')[0]; // Ensure it's formatted for SQL

            await runQuery(
                `INSERT INTO clients (uid, rollno, name, dob, gender, phone, email, password_hash, membershipType, membershipStart, membershipEnd, role, status, address, hasTrainer, trainerName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uid,
                    rollno !== "" ? Number(rollno) : null,
                    name,
                    dob,
                    gender || null,
                    phone || null,
                    email,
                    passwordHash,
                    membershipType,
                    sqlStart, 
                    sqlEnd, 
                    role,
                    status,
                    address || null,
                    hasTrainer,
                    hasTrainer ? trainerName : null
                ]
            );

            res.status(201).json({
                message: `✅ User created successfully.`,
                membershipStart: sqlStart,
                membershipEnd: sqlEnd,
                status: status
            });
        } catch (error) {
            console.error("❌ Error creating user:", error);
            res.status(500).json({ error: error.message || "Internal Server Error during user creation." });
        }
    });

    // Update Client Route
router.put("/update-client/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const client = await getQuery("SELECT * FROM clients WHERE id = ?", [id]);

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        const fieldsToUpdate = {};
        const keys = Object.keys(updateData);
        for (const key of keys) {
            switch (key) {
                // Frontend keys that map to different DB keys
                case 'startDate': fieldsToUpdate.membershipStart = updateData[key]; break;
                case 'endDate': 
                    fieldsToUpdate.membershipEnd = updateData[key];
                    const adjustedUpdateEndDate = getAdjustedEndDateForStatusCheck(updateData[key]);
                    fieldsToUpdate.status = calculateStatus(adjustedUpdateEndDate);
                    break;
                    
                // Keys from the Frontend payload that SHOULD BE IGNORED
                case 'category': // <-- THIS IS THE FIX. Explicitly ignore the problematic key.
                case 'rollno':
                case 'name':
                case 'gender':
                    // These fields should not be editable, or don't exist in the DB, so we skip them.
                    break;
                    
                // Valid DB keys that map directly (or are necessary)
                case 'membershipType': 
                case 'email': 
                case 'phone': // Added phone and address as they seem editable on frontend
                case 'address':
                case 'dob': // Added DOB as it is editable on the frontend
                case 'hasTrainer': 
                case 'trainerName': 
                    fieldsToUpdate[key] = updateData[key];
                    break;

                default: 
                    // Log any unhandled key for debugging, but IGNORE it for SQL.
                    console.log(`Ignoring unhandled client field in update: ${key}`);
                    break; // DO NOT add to fieldsToUpdate
            }
        }

        // ... rest of the logic for recalculating endDate (which looks fine)

        const queryFields = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(", ");
        const values = Object.values(fieldsToUpdate);
        values.push(id);

        await runQuery(`UPDATE clients SET ${queryFields} WHERE id = ?`, values);

        res.status(200).json({ message: "Client updated successfully" });
    } catch (error) {
        console.error("❌ Error updating client:", error);
        res.status(500).json({ error: error.message });
    }
});

    // RENEWAL MEMBERSHIP ROUTE
    router.put("/renew-membership/:id", async (req, res) => {
        // ... (Renewal Membership logic is unchanged)
        const { id } = req.params;
        const { renewalStartDate, newEndDate, membershipType, pricePaid } = req.body;
        let finalPrice = 0;

        try {
            if (!membershipType || !newEndDate || !renewalStartDate || pricePaid === undefined || pricePaid === null || isNaN(Number(pricePaid)) || Number(pricePaid) < 0) {
                return res.status(400).json({ error: "Membership type, start date, new end date, and a valid price are required." });
            }
            finalPrice = Number(pricePaid);

            const start = new Date(renewalStartDate);
            const end = new Date(newEndDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: "Invalid date format for renewal start or end date." });
            }
            
            const formattedStartDate = start.toISOString().split('T')[0];
            const formattedEndDate = end.toISOString().split('T')[0];

            const client = await getQuery("SELECT id, name FROM clients WHERE id = ?", [id]);

            if (!client) {
                return res.status(404).json({ error: "Client not found." });
            }

            const clientNameForLog = client.name || 'Unknown Client';
            
            // ⭐ FIX APPLIED: Adjust the end date for the status check
            const adjustedEndDate = getAdjustedEndDateForStatusCheck(newEndDate); 
            const newStatus = calculateStatus(adjustedEndDate); 
            
            await runTransactionQuery("BEGIN TRANSACTION;");

            try {
                await runQuery(
                    "UPDATE clients SET membershipStart = ?, membershipEnd = ?, membershipType = ?, status = ? WHERE id = ?",
                    [formattedStartDate, formattedEndDate, membershipType, newStatus, id]
                );

                await runQuery(
                    `INSERT INTO membership_renewals (clientId, clientName, membershipType, newEndDate, renewalDate, pricePaid) VALUES (?, ?, ?, ?, ?, ?)`,
                    [client.id, clientNameForLog, membershipType, formattedEndDate, new Date().toISOString().split('T')[0], finalPrice]
                );

                await runTransactionQuery("COMMIT;");

                res.status(200).json({
                    message: "Membership renewed successfully!",
                    membershipStart: formattedStartDate,
                    membershipEnd: formattedEndDate,
                    status: newStatus
                });
            } catch (innerError) {
                await runTransactionQuery("ROLLBACK;").catch(rollbackErr => 
                    console.error("❌ Failed to rollback transaction:", rollbackErr.message)
                );
                throw innerError;
            }

        } catch (error) {
            console.error("❌ Error renewing membership:", error);
            console.error(error.stack); 
            res.status(500).json({ error: error.message || "Internal Server Error during renewal." });
        }
    });

    // DELETE CLIENT ROUTE
    router.delete("/delete-client/:id", async (req, res) => {
        // ... (Delete Client logic is unchanged)
        const { id } = req.params;

        try {
            await runTransactionQuery("BEGIN TRANSACTION;");

            try {
                await runQuery("DELETE FROM membership_renewals WHERE clientId = ?", [id]);

                await runQuery("DELETE FROM clients WHERE id = ?", [id]);
                
                await runTransactionQuery("COMMIT;");

                res.status(200).json({ message: "Client and all related data deleted successfully" });
            } catch (innerError) {
                await runTransactionQuery("ROLLBACK;").catch(rollbackErr => 
                    console.error("❌ Failed to rollback deletion transaction:", rollbackErr.message)
                );
                throw innerError;
            }
        } catch (error) {
            console.error("❌ Error deleting client:", error);
            res.status(500).json({ error: error.message || "Internal Server Error during deletion." });
        }
    });

    // Client History Route (for single client ID)
    router.get("/history/:id", async (req, res) => {
        // ... (Client History logic is unchanged)
        try {
            const { id } = req.params;

            const renewals = await allQuery(
                "SELECT * FROM membership_renewals WHERE clientId = ? ORDER BY renewalDate DESC LIMIT 5",
                [id]
            );

            res.status(200).json(renewals);
        } catch (error) {
            console.error("❌ Error fetching renewal history:", error);
            res.status(500).json({ error: "Error fetching renewal history" });
        }
    });

    // Global Renewal History Log Route
    router.get("/renewal-history", async (req, res) => {
        try {
            const { startDate, endDate } = req.query; 

            let sql = "SELECT * FROM membership_renewals";
            const params = [];

            if (startDate && endDate) {
                sql += " WHERE renewalDate BETWEEN ? AND ?";
                params.push(startDate, endDate);
            } else if (startDate) {
                sql += " WHERE renewalDate >= ?";
                params.push(startDate);
            } else if (endDate) {
                sql += " WHERE renewalDate <= ?";
                params.push(endDate);
            }

            sql += " ORDER BY renewalDate DESC, id DESC"; 

            const history = await allQuery(sql, params);

            res.status(200).json(history);
        } catch (error) {
            console.error("❌ Error fetching global renewal history:", error);
            res.status(500).json({ error: "Error fetching renewal log." });
        }
    });

    return router;
};