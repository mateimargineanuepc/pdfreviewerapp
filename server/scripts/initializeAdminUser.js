'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Logger = require('../common/logger');

/**
 * Admin user credentials
 * These are automatically created/updated on server startup
 */
const ADMIN_EMAIL = 'matei.margineanu';
const ADMIN_PASSWORD = 'Alphanumeric1!';

/**
 * Initializes the admin user if it doesn't exist or updates password if it does
 * This function is called automatically on server startup
 * @returns {Promise<void>}
 */
async function initializeAdminUser() {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        
        if (existingAdmin) {
            // Update password in case it changed (ensures consistency)
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
            
            // Only update if password is different
            const isPasswordSame = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.password);
            if (!isPasswordSame) {
                existingAdmin.password = hashedPassword;
                await existingAdmin.save();
                Logger.info(`Admin user password updated: ${ADMIN_EMAIL}`);
            }
            
            // Ensure role is admin
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                Logger.info(`Admin user role updated: ${ADMIN_EMAIL}`);
            }
            
            // Ensure registration status is approved for admin
            if (existingAdmin.registrationStatus !== 'approved') {
                existingAdmin.registrationStatus = 'approved';
                if (!existingAdmin.registrationDetails) {
                    existingAdmin.registrationDetails = 'System administrator - auto-created on server startup';
                }
                await existingAdmin.save();
                Logger.info(`Admin user registration status updated: ${ADMIN_EMAIL}`);
            }
            
            Logger.debug(`Admin user already exists: ${ADMIN_EMAIL}`);
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

        // Create admin user (automatically approved)
        const adminUser = new User({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            registrationStatus: 'approved',
            registrationDetails: 'System administrator - auto-created on server startup',
        });

        await adminUser.save();
        Logger.info(`Admin user created successfully: ${ADMIN_EMAIL}`);
    } catch (error) {
        // Log error but don't crash the server
        Logger.error('Error initializing admin user', error);
        // In production, you might want to throw the error to prevent server start
        // For now, we'll just log it so the server can still start
    }
}

module.exports = {
    initializeAdminUser,
};

