'use strict';

import api from './api';

/**
 * Suggestion Service for handling PDF suggestions/comments
 */
class SuggestionService {
    /**
     * Gets all suggestions for a specific PDF file
     * @param {string} fileName - Name of the PDF file
     * @returns {Promise<Object>} List of suggestions
     */
    async getSuggestions(fileName) {
        try {
            const response = await api.get('/api/suggestions', {
                params: { fileName },
            });
            return {
                success: true,
                data: response.data.data.suggestions || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch suggestions',
            };
        }
    }

    /**
     * Creates a new suggestion
     * @param {Object} suggestionData - Suggestion data
     * @param {string} suggestionData.fileName - Name of the PDF file
     * @param {number} suggestionData.page - Page number
     * @param {number} suggestionData.line - Line number
     * @param {string} suggestionData.comment - Comment text
     * @param {string} [suggestionData.pdfId] - Optional PDF ID
     * @returns {Promise<Object>} Created suggestion
     */
    async createSuggestion(suggestionData) {
        try {
            const response = await api.post('/api/suggestions', suggestionData);
            return {
                success: true,
                data: response.data.data.suggestion,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to create suggestion',
            };
        }
    }

    /**
     * Updates a suggestion
     * @param {string} id - Suggestion ID
     * @param {Object} updateData - Update data
     * @param {string} updateData.comment - Updated comment text
     * @returns {Promise<Object>} Updated suggestion
     */
    async updateSuggestion(id, updateData) {
        try {
            const response = await api.put(`/api/suggestions/${id}`, updateData);
            return {
                success: true,
                data: response.data.data.suggestion,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to update suggestion',
            };
        }
    }

    /**
     * Deletes a suggestion
     * @param {string} id - Suggestion ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteSuggestion(id) {
        try {
            const response = await api.delete(`/api/suggestions/${id}`);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to delete suggestion',
            };
        }
    }
}

export default new SuggestionService();

