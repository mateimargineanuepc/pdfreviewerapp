'use strict';

import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Health Service for checking backend availability
 */
class HealthService {
    /**
     * Checks if the backend is available
     * @param {number} timeout - Request timeout in milliseconds (default: 5000)
     * @param {AbortSignal} [signal] - AbortSignal to cancel the request
     * @returns {Promise<boolean>} True if backend is available, false otherwise
     */
    async checkBackendHealth(timeout = 5000, signal = null) {
        try {
            const config = {
                timeout: timeout,
                validateStatus: (status) => status >= 200 && status < 500, // Accept any response (even errors mean server is up)
            };
            
            // Add signal if provided
            if (signal) {
                config.signal = signal;
            }

            const response = await axios.get(`${API_BASE_URL}/`, config);
            // If we get any response (even 404), the server is running
            return true;
        } catch (error) {
            // Ignore abort errors
            if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                throw error; // Re-throw to be handled by caller
            }
            // Network errors, timeouts, or connection refused mean server is down
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.code === 'ERR_NETWORK') {
                return false;
            }
            // Other errors might mean server is up but endpoint doesn't exist (still counts as "up")
            return error.response !== undefined;
        }
    }
}

export default new HealthService();

