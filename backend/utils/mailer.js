// backend/utils/mailer.js

const nodemailer = require('nodemailer');
// Load .env file variables
require('dotenv').config(); 

// --- Configuration ---
const transporter = nodemailer.createTransport({
    // Using port 587 with secure=false and encryption via STARTTLS
    host: process.env.MAIL_HOST || 'smtp.gmail.com', 
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true', // Should be 'false' for port 587
    auth: {
        user: process.env.MAIL_USER, // The Gmail address
        pass: process.env.MAIL_PASS, // The 16-character App Password
    },
});

/**
 * Sends a reminder email to a client about their expiring membership.
 * @param {string} toEmail - The client's email address.
 * @param {string} name - The client's name.
 * @param {number} daysLeft - The number of days until expiration (3 or 0).
 */
async function sendMembershipReminder(toEmail, name, daysLeft) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn('⚠️ Mailer skipped: MAIL_USER or MAIL_PASS is not set in .env file. Check configuration.');
        return;
    }

    let subject, htmlBody;

    if (daysLeft === 3) {
        subject = '🔔 Your Gym Membership is Expiring in 3 Days!';
        htmlBody = `
            <p>Hello ${name},</p>
            <p>This is a friendly reminder that your gym membership is set to expire in **3 days**.</p>
            <p>Please log in to your account or visit the front desk to renew your membership and continue enjoying all our facilities!</p>
            <p>Thank you for being a valued member of ${process.env.MAIL_SENDER_NAME || 'AAYSMAA Fitness Center'}.</p>
        `;
    } else if (daysLeft === 0) {
        subject = '🛑 Action Required: Your Gym Membership Has Expired Today!';
        htmlBody = `
            <p>Hello ${name},</p>
            <p>Your gym membership has **expired today**.</p>
            <p>Please renew your membership immediately to regain access to the gym.</p>
            <p>We look forward to seeing you back soon!</p>
        `;
    } else {
        return; // Do nothing for irrelevant dates
    }

    try {
        await transporter.sendMail({
            from: `"${process.env.MAIL_SENDER_NAME || 'Gym Management'}" <${process.env.MAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: htmlBody,
        });
        console.log(`✉️ Email sent successfully to ${toEmail} for ${daysLeft}-day reminder.`);
    } catch (error) {
        // Log the error but don't halt the scheduled task
        console.error(`❌ Error sending email to ${toEmail}:`, error.message);
    }
}

module.exports = { sendMembershipReminder };