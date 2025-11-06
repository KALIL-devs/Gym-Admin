// backend/scheduled-tasks.js

// const cron = require('node-cron'); // <--- REMOVED FOR TESTING
const { calculateStatus } = require('./utils/membershipHelpers');
const { getDb } = require('./database');
const { sendMembershipReminder } = require('./utils/mailer'); 

/**
 * Checks and determines all clients' membership status dynamically,
 * and sends reminder emails if membership is ending in 3 days or today.
 * The database is NOT updated with the status, as it is dynamic.
 */
async function checkAndNotifyClients() {
    const db = getDb();
    if (!db) {
        console.error("❌ Database connection not available for scheduled task.");
        return;
    }

    // ⭐ TEMPORARY LOGIC: Set a specific date for testing purposes
    const testDateCheck = new Date();
    testDateCheck.setHours(0, 0, 0, 0); // Today at midnight
    
    try {
        console.log("🏃 Running scheduled membership check and notification (ON-STARTUP TEST MODE)...");

        // Get all clients including their email
        // ⚠️ CHANGE: Removed 'status' from the SELECT query.
        const clients = await new Promise((resolve, reject) => {
            db.all("SELECT id, name, email, role, membershipEnd FROM clients", (err, rows) => { 
                if (err) reject(err);
                resolve(rows);
            });
        });

        const notificationList = [];
        const emailPromises = []; 
        
        // ⚠️ CHANGE: Removed updateStatements array since we are no longer updating the DB.

        clients.forEach((client) => {
            if (client.role === 'admin' || !client.email) {
                return; 
            }

            const endDateValue = new Date(client.membershipEnd);
            if (isNaN(endDateValue.getTime())) {
                console.warn(`- Skipping client ${client.name} due to invalid membership end date.`);
                return;
            }

            // The status is calculated dynamically but NOT saved to the DB
            const newStatus = calculateStatus(endDateValue);
            
            // -------------------------------------------------------------
            // ⭐ CORE LOGIC: Check who needs an email based on membershipEnd
            // -------------------------------------------------------------
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysDifference = Math.floor((endDateValue.getTime() - today.getTime()) / msPerDay);

            // Condition 1: Membership expires in exactly 3 days.
            if (daysDifference === 3) {
                emailPromises.push(
                    console.log(`- Scheduling email for ${client.name} (expires in 3 days).`)
                /*
                    sendMembershipReminder(client.email, client.name, 3)
                */
                );
            } 
            // Condition 2: Membership expires today.
            else if (daysDifference === 0) {
                emailPromises.push(
                    console.log(`- Scheduling email for ${client.name} (expires today).`)
                /*  
                    sendMembershipReminder(client.email, client.name, 0)
                */    
                );
            } 
            // -------------------------------------------------------------
            
            // ⚠️ CHANGE: Removed the block that updates the status in the database.
            // if (client.status !== newStatus) { ... db.run("UPDATE clients SET status = ? ...") ... }

            if (newStatus === 'expiring soon' || newStatus === 'expired') {
                notificationList.push({ name: client.name, status: newStatus });
            }
        });

        // ⚠️ CHANGE: Removed the call to await Promise.all(updateStatements); 
        await Promise.all(emailPromises); 
        console.log(`✅ Completed ${emailPromises.length} email sending tasks.`);

        if (notificationList.length > 0) {
            console.log("🔔 Action Required: The following clients need attention:");
            notificationList.forEach(client => {
                console.log(`- ${client.name}'s membership is ${client.status}.`);
            });
        } else {
            console.log("✅ All clients requiring immediate attention are up-to-date or already notified.");
        }

        return notificationList;

    } catch (error) {
        console.error("❌ Error running scheduled task:", error);
        return [];
    }
}

// ⭐ Export only the function
module.exports = { checkAndNotifyClients };