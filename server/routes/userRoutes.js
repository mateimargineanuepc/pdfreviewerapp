'use strict';

const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * @route POST /api/auth/register
 * @body {string} email - User email address
 * @body {string} password - User password (min 6 characters)
 * @body {string} [role] - User role (optional, default: 'user')
 * @returns {Object} User data and JWT token
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login an existing user
 * @route POST /api/auth/login
 * @body {string} email - User email address
 * @body {string} password - User password
 * @returns {Object} User data and JWT token
 */
router.post('/login', login);

module.exports = router;

