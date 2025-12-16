'use strict';

const jwt = require('jsonwebtoken');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

// JWT secret key from environment variables (fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Optional authentication middleware that verifies JWT token from Authorization header or query parameter
 * Attaches user info to req.user if token is valid, but doesn't fail if token is missing
 * Useful for endpoints that can work with or without authentication
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
function authMiddlewareOptional(req, res, next) {
    try {
        // Try to get token from Authorization header first
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.query.token) {
            // Fallback to query parameter (for react-pdf compatibility)
            token = req.query.token;
        }

        if (!token) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                Logger.warn('Authentication attempt with expired token');
                return next(createError(401, 'Token has expired'));
            } else if (error.name === 'JsonWebTokenError') {
                Logger.warn('Authentication attempt with invalid token');
                return next(createError(401, 'Invalid token'));
            } else {
                throw error;
            }
        }

        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        Logger.debug(`User authenticated: ${decoded.email}`);
        next();
    } catch (error) {
        Logger.error('Authentication middleware error', error);
        next(error);
    }
}

module.exports = authMiddlewareOptional;

