const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/db');
const seedData = require('./config/seed');

const app = express();

// CORS configuration (allows Vercel, Render, localhost, and custom domains)
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Initialize Database Schema & Seed Data
const initPromise = (async () => {
    try {
        await db.initSchema();
        await seedData();
    } catch (err) {
        console.error('❌ Database initialization failure:', err.message);
    }
})();

// Health Check Endpoint (useful for Render / Uptime monitors)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        database: db.dbType,
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/project/:projectId/tasks', require('./routes/tasks'));
app.use('/api/stats', require('./routes/stats'));

// Serve Static Frontend if built (e.g. single-container full-stack Render deployment)
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
} else {
    // 404 handler for API routes when frontend is hosted separately (e.g. Vercel)
    app.use('/api/*', (req, res) => {
        res.status(404).json({ message: `API route ${req.originalUrl} not found` });
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
let server = null;

if (require.main === module) {
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(
            `🚀 Team Task Manager Server is running on port ${PORT} [${db.dbType.toUpperCase()}]`
        );
    });
}

module.exports = { app, server, initPromise };