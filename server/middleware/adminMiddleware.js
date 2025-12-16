'use strict';

const { createError } = require('../common/error-handler');
const Logger = require('../common/logger');

/**
 * Middleware to check if user is an administrator
 * Must be used after authMiddleware
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
function adminMiddleware(req, res, next) {
    try {
        // Check if user is authenticated
        if (!req.user) {
            Logger.warn('Admin access attempt without authentication');
            return next(createError(401, 'Authentication required'));
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            Logger.warn(`Non-admin user attempted admin action: ${req.user.email}`);
            return next(createError(403, 'Admin access required'));
        }

        Logger.debug(`Admin access granted: ${req.user.email}`);
        next();
    } catch (error) {
        Logger.error('Admin middleware error', error);
        next(error);
    }
}

module.exports = adminMiddleware;

