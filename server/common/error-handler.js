'use strict';

const Logger = require('./logger');

/**
 * Centralized error handler middleware for Express
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
    Logger.error('Error occurred:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}

/**
 * Creates a standardized error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error}
 */
function createError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

module.exports = {
    errorHandler,
    createError,
};

