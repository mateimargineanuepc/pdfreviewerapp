'use strict';

const express = require('express');
const {
    createSuggestion,
    getSuggestions,
    getSuggestionById,
    updateSuggestion,
    deleteSuggestion,
} = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/suggestions
 * Get all suggestions for a specific file (query param: fileName)
 * @route GET /api/suggestions?fileName=example.pdf
 * @query {string} fileName - Name of the PDF file
 * @returns {Object} List of suggestions sorted by page number
 */
router.get('/', getSuggestions);

/**
 * GET /api/suggestions/:id
 * Get a single suggestion by ID
 * @route GET /api/suggestions/:id
 * @param {string} id - Suggestion ID
 * @returns {Object} Suggestion data
 */
router.get('/:id', getSuggestionById);

/**
 * POST /api/suggestions
 * Create a new suggestion (protected route)
 * @route POST /api/suggestions
 * @header Authorization: Bearer <token>
 * @body {string} fileName - Name of the PDF file
 * @body {number} page - Page number
 * @body {number} line - Line number
 * @body {string} comment - Comment/suggestion text
 * @body {string} [pdfId] - Optional PDF ID
 * @returns {Object} Created suggestion data
 */
router.post('/', authMiddleware, createSuggestion);

/**
 * PUT /api/suggestions/:id
 * Update a suggestion (protected route - only by creator)
 * @route PUT /api/suggestions/:id
 * @header Authorization: Bearer <token>
 * @param {string} id - Suggestion ID
 * @body {string} comment - Updated comment text
 * @returns {Object} Updated suggestion data
 */
router.put('/:id', authMiddleware, updateSuggestion);

/**
 * DELETE /api/suggestions/:id
 * Delete a suggestion (protected route - only by creator)
 * @route DELETE /api/suggestions/:id
 * @header Authorization: Bearer <token>
 * @param {string} id - Suggestion ID
 * @returns {Object} Success message
 */
router.delete('/:id', authMiddleware, deleteSuggestion);

module.exports = router;

