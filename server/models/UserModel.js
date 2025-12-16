'use strict';

const mongoose = require('mongoose');

/**
 * User Schema for authentication and user management
 * @typedef {Object} User
 * @property {string} email - User email address (unique, required)
 * @property {string} password - Hashed password
 * @property {string} role - User role (default: 'user')
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            // Allow both email format (user@domain.com) and simple username format (for admin like "matei.margineanu")
            match: [/^(\S+@\S+\.\S+|[a-zA-Z0-9._-]+)$/, 'Please provide a valid email address or username'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        registrationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        registrationDetails: {
            type: String,
            required: [true, 'Registration details are required'],
            trim: true,
            maxlength: [1000, 'Registration details must not exceed 1000 characters'],
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Rejection reason must not exceed 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Note: Email field already has an index due to unique: true constraint

/**
 * User Model
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;

