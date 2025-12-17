'use strict';

import api from './api';

/**
 * User Management Service for admin operations
 */
class UserManagementService {
    /**
     * Gets all users
     * @returns {Promise<Object>} Response containing list of users or an error
     */
    async getAllUsers() {
        try {
            const response = await api.get('/api/admin/users');
            return {
                success: true,
                data: response.data.data.users,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to fetch users';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Updates a user's first name and last name
     * @param {string} userId - User ID
     * @param {string} firstName - User's first name
     * @param {string} lastName - User's last name
     * @returns {Promise<Object>} Response indicating success or failure
     */
    async updateUser(userId, firstName, lastName) {
        try {
            const response = await api.put(`/api/admin/users/${userId}`, {
                firstName,
                lastName,
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to update user';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Deletes a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Response indicating success or failure
     */
    async deleteUser(userId) {
        try {
            const response = await api.delete(`/api/admin/users/${userId}`);
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to delete user';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Changes a user's password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Response indicating success or failure
     */
    async changeUserPassword(userId, newPassword) {
        try {
            const response = await api.post(`/api/admin/users/${userId}/change-password`, {
                newPassword,
            });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to change password';
            return { success: false, error: errorMessage };
        }
    }
}

export default new UserManagementService();

