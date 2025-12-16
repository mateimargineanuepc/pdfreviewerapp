'use strict';

import api from './api';

/**
 * Registration Service for handling registration approval operations (admin only)
 */
class RegistrationService {
    /**
     * Gets all pending registration requests
     * @returns {Promise<Object>} List of pending registrations
     */
    async getPendingRegistrations() {
        try {
            const response = await api.get('/api/registrations/pending');
            return {
                success: true,
                data: response.data.data.registrations || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch pending registrations',
            };
        }
    }

    /**
     * Gets all registration requests (with optional status filter)
     * @param {string} status - Optional filter: 'pending', 'approved', 'rejected'
     * @returns {Promise<Object>} List of registrations
     */
    async getAllRegistrations(status = null) {
        try {
            const params = status ? { status } : {};
            const response = await api.get('/api/registrations', { params });
            return {
                success: true,
                data: response.data.data.registrations || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch registrations',
            };
        }
    }

    /**
     * Approves a registration request
     * @param {string} userId - User ID to approve
     * @returns {Promise<Object>} Approval result
     */
    async approveRegistration(userId) {
        try {
            const response = await api.post(`/api/registrations/${userId}/approve`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to approve registration',
            };
        }
    }

    /**
     * Rejects a registration request
     * @param {string} userId - User ID to reject
     * @param {string} rejectionReason - Optional reason for rejection
     * @returns {Promise<Object>} Rejection result
     */
    async rejectRegistration(userId, rejectionReason = '') {
        try {
            const response = await api.post(`/api/registrations/${userId}/reject`, {
                rejectionReason,
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to reject registration',
            };
        }
    }
}

export default new RegistrationService();

