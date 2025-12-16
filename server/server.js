'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const Logger = require('./common/logger');
const { errorHandler } = require('./common/error-handler');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const suggestionRoutes = require('./routes/suggestionRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const { initializeAdminUser } = require('./scripts/initializeAdminUser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
/**
 * Connects to MongoDB using the connection string from environment variables
 * Logs successful and failed connection attempts
 * @returns {Promise<void>}
 */
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        Logger.info('Connected to MongoDB successfully');
    } catch (error) {
        Logger.error('MongoDB connection error', error);
        process.exit(1);
    }
}

// Routes
/**
 * Root route handler
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void}
 */
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// API Routes
app.use('/api/auth', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/progress', progressRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
/**
 * Initializes the server and database connection
 * @returns {Promise<void>}
 */
async function startServer() {
    try {
        await connectToDatabase();
        
        // Initialize admin user on server startup
        await initializeAdminUser();
        
        app.listen(PORT, () => {
            Logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        Logger.error('Failed to start server', error);
        process.exit(1);
    }
}

startServer();

