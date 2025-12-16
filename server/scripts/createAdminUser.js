'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Logger = require('../common/logger');

const MONGO_URI = process.env.MONGO_URI;

/**
 * Creates the admin user if it doesn't exist
 */
async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        Logger.info('Connected to MongoDB');

        const adminEmail = 'matei.margineanu';
        const adminPassword = 'Alphanumeric1!';

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            Logger.info(`Admin user already exists: ${adminEmail}`);
            // Update password in case it changed
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            Logger.info('Admin user password updated');
            await mongoose.disconnect();
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Create admin user
        const adminUser = new User({
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
        });

        await adminUser.save();
        Logger.info(`Admin user created successfully: ${adminEmail}`);

        await mongoose.disconnect();
        Logger.info('Disconnected from MongoDB');
    } catch (error) {
        Logger.error('Error creating admin user', error);
        process.exit(1);
    }
}

// Run the script
createAdminUser();

