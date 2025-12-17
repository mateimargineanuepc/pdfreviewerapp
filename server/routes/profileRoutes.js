'use strict';

const express = require('express');
const { getProfile, changePassword } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/profile
 * Get current user's profile information
 * @route GET /api/profile
 * @header Authorization: Bearer <token>
 * @returns {Object} User profile data
 */
router.get('/', authMiddleware, getProfile);

/**
 * POST /api/profile/change-password
 * Change user's password
 * @route POST /api/profile/change-password
 * @header Authorization: Bearer <token>
 * @body {string} oldPassword - Current password
 * @body {string} newPassword - New password (min 6 characters)
 * @body {string} confirmPassword - Password confirmation
 * @returns {Object} Success message
 */
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;

