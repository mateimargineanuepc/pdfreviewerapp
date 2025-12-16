'use strict';

/**
 * Logger utility class for consistent logging throughout the application
 * @class Logger
 */
class Logger {
    /**
     * Logs an error message
     * @param {string} message - Error message to log
     * @param {Error} [error] - Optional error object
     * @returns {void}
     */
    static error(message, error) {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp} - ${message}`);
        if (error) {
            console.error(error);
        }
    }

    /**
     * Logs a warning message
     * @param {string} message - Warning message to log
     * @returns {void}
     */
    static warn(message) {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN] ${timestamp} - ${message}`);
    }

    /**
     * Logs an info message
     * @param {string} message - Info message to log
     * @returns {void}
     */
    static info(message) {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] ${timestamp} - ${message}`);
    }

    /**
     * Logs a debug message
     * @param {string} message - Debug message to log
     * @returns {void}
     */
    static debug(message) {
        const timestamp = new Date().toISOString();
        console.log(`[DEBUG] ${timestamp} - ${message}`);
    }

    /**
     * Logs a detailed message
     * @param {string} message - Detailed message to log
     * @param {Object} [data] - Optional data object to log
     * @returns {void}
     */
    static detailed(message, data) {
        const timestamp = new Date().toISOString();
        console.log(`[DETAILED] ${timestamp} - ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 4));
        }
    }
}

module.exports = Logger;

