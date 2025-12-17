'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Gets the current user's profile information
 * @param {express.Request} req - Express request object (req.user contains authenticated user info)
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getProfile(req, res, next) {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select('-password -__v').lean();

        if (!user) {
            return next(createError(404, 'User not found'));
        }

        Logger.info(`Profile fetched for user: ${user.email}`);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: user.role,
                    registrationDetails: user.registrationDetails || '',
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error fetching profile', error);
        next(error);
    }
}

/**
 * Changes the user's password
 * @param {express.Request} req - Express request object (req.user contains authenticated user info)
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function changePassword(req, res, next) {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!oldPassword || oldPassword.length === 0) {
            return next(createError(400, 'Old password is required'));
        }

        if (!newPassword || newPassword.length === 0) {
            return next(createError(400, 'New password is required'));
        }

        if (newPassword.length < 6) {
            return next(createError(400, 'New password must be at least 6 characters long'));
        }

        if (!confirmPassword || confirmPassword.length === 0) {
            return next(createError(400, 'Password confirmation is required'));
        }

        if (newPassword !== confirmPassword) {
            return next(createError(400, 'New password and confirmation do not match'));
        }

        if (oldPassword === newPassword) {
            return next(createError(400, 'New password must be different from the old password'));
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            Logger.warn(`Password change attempt with invalid old password for user: ${user.email}`);
            return next(createError(401, 'Old password is incorrect'));
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        Logger.info(`Password changed successfully for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        Logger.error('Error changing password', error);
        next(error);
    }
}

module.exports = {
    getProfile,
    changePassword,
};

