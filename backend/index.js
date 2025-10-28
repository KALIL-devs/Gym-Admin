// backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Database and routes
const { runDbMigrations } = require('./database'); 
const adminRoutes = require('./routes/adminRoutes');

// ⭐ CHANGE: Import the function directly
const { checkAndNotifyClients } = require('./scheduled-tasks'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/admin', adminRoutes());

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).send('✅ Aayshmaa Fitness Backend API is running!');
});

// Serve React frontend (Vite build)
const clientBuildPath = path.join(__dirname, '../client-side/dist');
app.use(express.static(clientBuildPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start the app
async function startApp() {
    try {
        console.log('⏳ Initializing database...');
        
        await runDbMigrations(); 
        console.log('✅ Database connected and migrated successfully.');

        // ⭐ CHANGE: Call the function directly for testing
        // This will run the email check EVERY TIME the server starts!
        await checkAndNotifyClients(); 
        // ------------------------------------------------------

        app.listen(PORT, async () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log('ℹ️ Open your browser and navigate to: http://localhost:' + PORT);
        });
    } catch (error) {
        console.error('❌ Fatal error during startup:', error);
        
        setTimeout(() => {
             process.exit(1);
        }, 5000); 
    }
}

startApp();