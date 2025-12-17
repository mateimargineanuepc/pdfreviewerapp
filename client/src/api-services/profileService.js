'use strict';

import api from './api';

/**
 * Profile Service for managing user profile
 */
class ProfileService {
    /**
     * Gets the current user's profile
     * @returns {Promise<Object>} Profile data
     */
    async getProfile() {
        try {
            const response = await api.get('/api/profile');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch profile',
            };
        }
    }

    /**
     * Changes the user's password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @param {string} confirmPassword - Password confirmation
     * @returns {Promise<Object>} Change password response
     */
    async changePassword(oldPassword, newPassword, confirmPassword) {
        try {
            const response = await api.post('/api/profile/change-password', {
                oldPassword,
                newPassword,
                confirmPassword,
            });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to change password',
            };
        }
    }
}

export default new ProfileService();

