'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Gets all users (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getAllUsers(req, res, next) {
    try {
        Logger.info(`Fetching all users by admin: ${req.user.email}`);

        const users = await User.find({})
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .lean();

        Logger.info(`Found ${users.length} users`);

        res.status(200).json({
            success: true,
            data: {
                users: users.map((user) => ({
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: user.role,
                    registrationStatus: user.registrationStatus || 'pending',
                    registrationDetails: user.registrationDetails || '',
                    rejectionReason: user.rejectionReason || '',
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                })),
                count: users.length,
            },
        });
    } catch (error) {
        Logger.error('Error fetching all users', error);
        next(error);
    }
}

/**
 * Updates user's first name and last name (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { firstName, lastName } = req.body;

        // Validate input
        if (!firstName || firstName.trim().length === 0) {
            return next(createError(400, 'First name is required'));
        }

        if (firstName.trim().length > 100) {
            return next(createError(400, 'First name must not exceed 100 characters'));
        }

        if (!lastName || lastName.trim().length === 0) {
            return next(createError(400, 'Last name is required'));
        }

        if (lastName.trim().length > 100) {
            return next(createError(400, 'Last name must not exceed 100 characters'));
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Prevent admin from editing themselves (optional - you can remove this if needed)
        // if (user._id.toString() === req.user.userId) {
        //     return next(createError(403, 'Cannot edit your own account from this interface'));
        // }

        // Update user
        user.firstName = firstName.trim();
        user.lastName = lastName.trim();
        await user.save();

        Logger.info(`User ${user.email} updated by admin ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                },
            },
        });
    } catch (error) {
        Logger.error('Error updating user', error);
        next(error);
    }
}

/**
 * Deletes a user (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.userId) {
            return next(createError(403, 'Cannot delete your own account'));
        }

        // Prevent deleting the default admin user
        if (user.email === 'matei.margineanu' && user.role === 'admin') {
            return next(createError(403, 'Cannot delete the default admin account'));
        }

        // Delete user
        await User.findByIdAndDelete(id);

        Logger.info(`User ${user.email} deleted by admin ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        Logger.error('Error deleting user', error);
        next(error);
    }
}

/**
 * Changes a user's password (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function changeUserPassword(req, res, next) {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Validate input
        if (!newPassword || newPassword.length === 0) {
            return next(createError(400, 'New password is required'));
        }

        if (newPassword.length < 6) {
            return next(createError(400, 'New password must be at least 6 characters long'));
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedPassword;
        await user.save();

        Logger.info(`Password changed for user ${user.email} by admin ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        Logger.error('Error changing user password', error);
        next(error);
    }
}

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    changeUserPassword,
};

