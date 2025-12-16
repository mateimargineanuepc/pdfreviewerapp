'use strict';

import api from './api';

/**
 * Progress Service for handling PDF page completion tracking
 */
class ProgressService {
    /**
     * Toggles the completion status of a page
     * @param {string} fileName - Name of the PDF file
     * @param {number} pageNumber - Page number
     * @returns {Promise<Object>} Progress data
     */
    async togglePageCompletion(fileName, pageNumber) {
        try {
            const response = await api.post('/api/progress/toggle', {
                fileName,
                pageNumber,
            });
            return {
                success: true,
                data: response.data.data.progress,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to toggle page completion',
            };
        }
    }

    /**
     * Gets progress for a specific document for the current user
     * @param {string} fileName - Name of the PDF file
     * @returns {Promise<Object>} User progress data
     */
    async getUserProgress(fileName) {
        try {
            const response = await api.get('/api/progress/user', {
                params: { fileName },
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch user progress',
            };
        }
    }

    /**
     * Gets progress for a specific page
     * @param {string} fileName - Name of the PDF file
     * @param {number} pageNumber - Page number
     * @returns {Promise<Object>} Page progress data
     */
    async getPageProgress(fileName, pageNumber) {
        try {
            const response = await api.get('/api/progress/page', {
                params: { fileName, pageNumber },
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch page progress',
            };
        }
    }

    /**
     * Gets all users progress (admin only)
     * @returns {Promise<Object>} All users progress data
     */
    async getAllUsersProgress() {
        try {
            const response = await api.get('/api/progress/all');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch all users progress',
            };
        }
    }
}

export default new ProgressService();

