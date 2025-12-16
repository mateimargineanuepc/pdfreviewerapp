'use strict';

const express = require('express');
const {
    getPendingRegistrations,
    getAllRegistrations,
    approveRegistration,
    rejectRegistration,
} = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * GET /api/registrations/pending
 * Get all pending registration requests (admin only)
 * @route GET /api/registrations/pending
 * @header Authorization: Bearer <token>
 * @returns {Object} List of pending registration requests
 */
router.get('/pending', authMiddleware, adminMiddleware, getPendingRegistrations);

/**
 * GET /api/registrations
 * Get all registration requests (admin only)
 * @route GET /api/registrations?status=pending|approved|rejected
 * @header Authorization: Bearer <token>
 * @query {string} status - Optional filter by status (pending, approved, rejected)
 * @returns {Object} List of registration requests
 */
router.get('/', authMiddleware, adminMiddleware, getAllRegistrations);

/**
 * POST /api/registrations/:userId/approve
 * Approve a registration request (admin only)
 * @route POST /api/registrations/:userId/approve
 * @header Authorization: Bearer <token>
 * @param {string} userId - User ID to approve
 * @returns {Object} Approved user information
 */
router.post('/:userId/approve', authMiddleware, adminMiddleware, approveRegistration);

/**
 * POST /api/registrations/:userId/reject
 * Reject a registration request (admin only)
 * @route POST /api/registrations/:userId/reject
 * @header Authorization: Bearer <token>
 * @param {string} userId - User ID to reject
 * @body {string} rejectionReason - Optional reason for rejection
 * @returns {Object} Rejected user information
 */
router.post('/:userId/reject', authMiddleware, adminMiddleware, rejectRegistration);

module.exports = router;

