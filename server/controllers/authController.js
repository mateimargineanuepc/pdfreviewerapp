'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

// JWT secret key from environment variables (fallback for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Registers a new user
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function register(req, res, next) {
    try {
        const { email, password, role, registrationDetails } = req.body;

        // Validate input with specific error messages
        if (!email || email.trim().length === 0) {
            return next(createError(400, 'Email is required'));
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(createError(400, 'Please provide a valid email address'));
        }

        if (!password || password.length === 0) {
            return next(createError(400, 'Password is required'));
        }

        if (password.length < 6) {
            return next(createError(400, 'Password must be at least 6 characters long'));
        }

        if (!registrationDetails || registrationDetails.trim().length === 0) {
            return next(createError(400, 'Registration details are required'));
        }

        if (registrationDetails.trim().length < 10) {
            return next(createError(400, 'Registration details must be at least 10 characters long'));
        }

        // Normalize email to lowercase (since User schema has lowercase: true)
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            Logger.warn(`Registration attempt with existing email: ${normalizedEmail}`);
            return next(createError(409, 'User with this email already exists'));
        }

        // Hash password with bcryptjs (salt rounds: 10)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user with pending status (unless it's an admin creating another admin)
        const user = new User({
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'user',
            registrationStatus: role === 'admin' ? 'approved' : 'pending',
            registrationDetails: registrationDetails.trim(),
        });

        await user.save();
        Logger.info(`User registration request created: ${normalizedEmail} (status: ${user.registrationStatus})`);

        // Don't generate token for pending registrations - they need admin approval first
        if (user.registrationStatus === 'pending') {
            return res.status(201).json({
                success: true,
                message: 'Registration request submitted successfully. Your account is pending admin approval.',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        registrationStatus: user.registrationStatus,
                    },
                    requiresApproval: true,
                },
            });
        }

        // Generate JWT token only for approved users (e.g., admin creating admin)
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN,
            }
        );

        // Return user data (without password) and token
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    registrationStatus: user.registrationStatus,
                },
                token,
            },
        });
    } catch (error) {
        Logger.error('Registration error', error);
        next(error);
    }
}

/**
 * Logs in an existing user
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return next(createError(400, 'Email and password are required'));
        }

        // Normalize email to lowercase (since User schema has lowercase: true)
        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            Logger.warn(`Login attempt with non-existent email: ${normalizedEmail}`);
            return next(createError(401, 'Invalid email or password'));
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            Logger.warn(`Login attempt with invalid password for email: ${normalizedEmail}`);
            return next(createError(401, 'Invalid email or password'));
        }

        // Check if account is approved
        if (user.registrationStatus === 'pending') {
            Logger.warn(`Login attempt with pending account: ${normalizedEmail}`);
            return next(
                createError(
                    403,
                    'Your account is pending admin approval. Please wait for approval before logging in.'
                )
            );
        }

        if (user.registrationStatus === 'rejected') {
            Logger.warn(`Login attempt with rejected account: ${normalizedEmail}`);
            return next(
                createError(
                    403,
                    user.rejectionReason
                        ? `Your registration was rejected: ${user.rejectionReason}`
                        : 'Your registration was rejected. Please contact an administrator for more information.'
                )
            );
        }

        Logger.info(`User logged in successfully: ${normalizedEmail}`);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN,
            }
        );

        // Return user data (without password) and token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        Logger.error('Login error', error);
        next(error);
    }
}

module.exports = {
    register,
    login,
};

