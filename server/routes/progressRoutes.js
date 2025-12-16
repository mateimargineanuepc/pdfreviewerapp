'use strict';

const express = require('express');
const {
    togglePageCompletion,
    getUserProgress,
    getAllUsersProgress,
    getPageProgress,
} = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * POST /api/progress/toggle
 * Toggle page completion status for current user
 * @route POST /api/progress/toggle
 * @header Authorization: Bearer <token>
 * @body {string} fileName - Name of the PDF file
 * @body {number} pageNumber - Page number
 * @returns {Object} Progress data
 */
router.post('/toggle', authMiddleware, togglePageCompletion);

/**
 * GET /api/progress/user
 * Get progress for a specific document for current user
 * @route GET /api/progress/user?fileName=example.pdf
 * @header Authorization: Bearer <token>
 * @query {string} fileName - Name of the PDF file
 * @returns {Object} User progress data
 */
router.get('/user', authMiddleware, getUserProgress);

/**
 * GET /api/progress/page
 * Get progress for a specific page for current user
 * @route GET /api/progress/page?fileName=example.pdf&pageNumber=1
 * @header Authorization: Bearer <token>
 * @query {string} fileName - Name of the PDF file
 * @query {number} pageNumber - Page number
 * @returns {Object} Page progress data
 */
router.get('/page', authMiddleware, getPageProgress);

/**
 * GET /api/progress/all
 * Get all users progress (admin only)
 * @route GET /api/progress/all
 * @header Authorization: Bearer <token>
 * @returns {Object} All users progress data
 */
router.get('/all', authMiddleware, adminMiddleware, getAllUsersProgress);

module.exports = router;

