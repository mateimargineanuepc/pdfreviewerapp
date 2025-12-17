'use strict';

const express = require('express');
const {
    getAllUsers,
    updateUser,
    deleteUser,
    changeUserPassword,
} = require('../controllers/userManagementController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users (admin only)
 * @route GET /api/admin/users
 * @header Authorization: Bearer <token>
 * @returns {Object} List of all users
 */
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

/**
 * PUT /api/admin/users/:id
 * Update user's first name and last name (admin only)
 * @route PUT /api/admin/users/:id
 * @header Authorization: Bearer <token>
 * @param {string} id - User ID
 * @body {string} firstName - User's first name
 * @body {string} lastName - User's last name
 * @returns {Object} Updated user information
 */
router.put('/:id', authMiddleware, adminMiddleware, updateUser);

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 * @route DELETE /api/admin/users/:id
 * @header Authorization: Bearer <token>
 * @param {string} id - User ID
 * @returns {Object} Success message
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

/**
 * POST /api/admin/users/:id/change-password
 * Change a user's password (admin only)
 * @route POST /api/admin/users/:id/change-password
 * @header Authorization: Bearer <token>
 * @param {string} id - User ID
 * @body {string} newPassword - New password (min 6 characters)
 * @returns {Object} Success message
 */
router.post('/:id/change-password', authMiddleware, adminMiddleware, changeUserPassword);

module.exports = router;

