// server/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');


let DB_PATH;

// 🚀 CRITICAL FIX: Implement Dual Path Resolution
if (process.pkg) {
    // 1. Bundled (AayshmaaFitness.exe): Database file next to the executable
    const executableDir = path.dirname(process.execPath);
    DB_PATH = path.resolve(executableDir, 'gym_management.sqlite');
} else {
    // 2. Unbundled (node index.js): Database file in the backend/ directory
    // This is safer as it uses the path relative to the current script file.
    DB_PATH = path.resolve(__dirname, 'gym_management.sqlite');
}

let db = null;
const SQLITE_BUSY_TIMEOUT = 5000; 

// Function to insert a default admin user for development purposes
async function insertDefaultAdmin(dbInstance) {
    // ... (This function remains unchanged)
    const defaultEmail = 'admin@example.com';
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return new Promise((resolve, reject) => {
        // Check if an admin user already exists
        dbInstance.get(`SELECT COUNT(*) as count FROM admins WHERE email = ?`, [defaultEmail], (err, row) => {
            if (err) {
                console.error("❌ Error checking for existing admin:", err.message);
                return reject(err);
            }

            if (row.count === 0) {
                // No admin exists, so create one
                dbInstance.run(
                    `INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)`,
                    [defaultEmail, hashedPassword, 'admin'],
                    function(insertErr) {
                        if (insertErr) {
                            console.error("❌ Error inserting default admin:", insertErr.message);
                            return reject(insertErr);
                        }
                        console.log(`✅ Default admin created: ${defaultEmail} with password 'password123'`);
                        resolve();
                    }
                );
            } else {
                console.log("✅ Admin user already exists. No new user created.");
                resolve();
            }
        });
    });
}

async function runDbMigrations() {
    return new Promise((resolve, reject) => {
        // Log the actual path used for visibility
        console.log(`ℹ️ Attempting to open database at: ${DB_PATH}`); 
        
        // Step 1: Open the database connection
        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
            if (err) {
                console.error("❌ Error opening database:", err.message);
                // ⚠️ Provide a short delay on error so the user can read the console window
                setTimeout(() => reject(err), 100); 
                return;
            }
            console.log("✅ Connected to the SQLite database.");

            // Fix 1: Configure connection settings (BUSY TIMEOUT and WAL)
            db.configure('busyTimeout', SQLITE_BUSY_TIMEOUT);
            console.log(`✅ SQLite busy timeout set to ${SQLITE_BUSY_TIMEOUT}ms.`);
            
            // Setting PRAGMA outside of serialize, ensuring they are executed first
            db.run('PRAGMA journal_mode = WAL;', (walErr) => {
                if(walErr) console.error("❌ Error setting WAL:", walErr.message);
                else console.log("✅ SQLite journal_mode set to WAL.");
            });
            
            db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
                if (pragmaErr) {
                    console.error("❌ Error setting foreign_keys PRAGMA:", pragmaErr.message);
                    return reject(pragmaErr); 
                }
                console.log("✅ SQLite foreign_keys set to ON.");
                
                // Fix 2: Run all table creations and seeding *inside* serialize() 
                db.serialize(async () => {
                    
                    // Create the admins table for admin login
                    db.run(`CREATE TABLE IF NOT EXISTS admins (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT NOT NULL
                    )`, (err) => {
                        if (err) {
                            console.error("❌ Error creating admins table:", err.message);
                            return reject(err);
                        }
                        console.log("✅ Admins table is ready.");
                    });
                    
                    // Create the clients table
                    db.run(`CREATE TABLE IF NOT EXISTS clients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        uid TEXT UNIQUE NOT NULL,
                        rollno INTEGER UNIQUE,
                        name TEXT NOT NULL,
                        dob TEXT, 
                        gender TEXT,
                        phone TEXT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        membershipType TEXT NOT NULL,
                        membershipStart TEXT NOT NULL,
                        membershipEnd TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'client',
                        status TEXT,
                        address TEXT,
                        hasTrainer BOOLEAN NOT NULL DEFAULT 0,
                        trainerName TEXT
                    )`, (err) => {
                        if (err) {
                            console.error("❌ Error creating clients table:", err.message);
                            return reject(err);
                        }
                        console.log("✅ Clients table is ready.");
                    });

                        // Create the membership_renewals table
                        db.run(`CREATE TABLE IF NOT EXISTS membership_renewals (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            clientId INTEGER NOT NULL,
                            membershipType TEXT NOT NULL,
                            newEndDate TEXT NOT NULL,
                            renewalDate TEXT NOT NULL,
                            pricePaid REAL,
                            clientName TEXT, 
                            FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE
                        )`, async (err) => {
                        if (err) {
                            console.error("❌ Error creating membership_renewals table:", err.message);
                            return reject(err);
                        }
                        console.log("✅ Membership_renewals table is ready.");
                        try {
                            // Pass the db instance to the insert function
                            await insertDefaultAdmin(db);
                            resolve();
                        } catch (seedErr) {
                            reject(seedErr);
                        }
                    });
                });
            });
        });
    });
}

function getDb() {
    if (!db) {
        throw new Error("Database connection not established. Call runDbMigrations() first.");
    }
    return db;
}

module.exports = { runDbMigrations, getDb };