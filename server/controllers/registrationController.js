'use strict';

const User = require('../models/UserModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Gets all pending registration requests (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getPendingRegistrations(req, res, next) {
    try {
        Logger.info(`Fetching pending registrations by admin: ${req.user.email}`);

        const pendingUsers = await User.find({ registrationStatus: 'pending' })
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .lean();

        Logger.info(`Found ${pendingUsers.length} pending registration requests`);

        res.status(200).json({
            success: true,
            data: {
                registrations: pendingUsers.map((user) => ({
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                    registrationDetails: user.registrationDetails,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                })),
                count: pendingUsers.length,
            },
        });
    } catch (error) {
        Logger.error('Error fetching pending registrations', error);
        next(error);
    }
}

/**
 * Gets all registration requests (pending, approved, rejected) (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getAllRegistrations(req, res, next) {
    try {
        const { status } = req.query; // Optional filter by status

        Logger.info(`Fetching all registrations by admin: ${req.user.email}${status ? ` (filter: ${status})` : ''}`);

        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.registrationStatus = status;
        }

        const users = await User.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .lean();

        Logger.info(`Found ${users.length} registration requests`);

        res.status(200).json({
            success: true,
            data: {
                registrations: users.map((user) => ({
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                    registrationDetails: user.registrationDetails,
                    rejectionReason: user.rejectionReason,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                })),
                count: users.length,
            },
        });
    } catch (error) {
        Logger.error('Error fetching all registrations', error);
        next(error);
    }
}

/**
 * Approves a registration request (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function approveRegistration(req, res, next) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return next(createError(400, 'User ID is required'));
        }

        Logger.info(`Approving registration for user: ${userId} by admin: ${req.user.email}`);

        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        if (user.registrationStatus === 'approved') {
            return next(createError(400, 'User is already approved'));
        }

        user.registrationStatus = 'approved';
        user.rejectionReason = undefined; // Clear rejection reason if any
        await user.save();

        Logger.info(`Registration approved for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Registration approved successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                },
            },
        });
    } catch (error) {
        Logger.error('Error approving registration', error);
        next(error);
    }
}

/**
 * Rejects a registration request (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function rejectRegistration(req, res, next) {
    try {
        const { userId } = req.params;
        const { rejectionReason } = req.body;

        if (!userId) {
            return next(createError(400, 'User ID is required'));
        }

        Logger.info(`Rejecting registration for user: ${userId} by admin: ${req.user.email}`);

        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, 'User not found'));
        }

        if (user.registrationStatus === 'rejected') {
            return next(createError(400, 'User is already rejected'));
        }

        user.registrationStatus = 'rejected';
        if (rejectionReason && rejectionReason.trim().length > 0) {
            user.rejectionReason = rejectionReason.trim();
        }
        await user.save();

        Logger.info(`Registration rejected for user: ${user.email}${user.rejectionReason ? ` (reason: ${user.rejectionReason})` : ''}`);

        res.status(200).json({
            success: true,
            message: 'Registration rejected successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                    rejectionReason: user.rejectionReason,
                },
            },
        });
    } catch (error) {
        Logger.error('Error rejecting registration', error);
        next(error);
    }
}

module.exports = {
    getPendingRegistrations,
    getAllRegistrations,
    approveRegistration,
    rejectRegistration,
};

