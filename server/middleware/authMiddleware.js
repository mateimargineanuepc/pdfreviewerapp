'use strict';

const jwt = require('jsonwebtoken');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

// JWT secret key from environment variables (fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware that verifies JWT token from Authorization header
 * Attaches user info to req.user if token is valid
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
function authMiddleware(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            Logger.warn('Authentication attempt without Authorization header');
            return next(createError(401, 'Authorization header is required'));
        }

        // Check if header starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
            Logger.warn('Authentication attempt with invalid Authorization header format');
            return next(createError(401, 'Authorization header must start with "Bearer "'));
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if (!token) {
            Logger.warn('Authentication attempt with empty token');
            return next(createError(401, 'Token is required'));
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

module.exports = authMiddleware;

