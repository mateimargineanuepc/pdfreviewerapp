'use strict';

const mongoose = require('mongoose');

/**
 * UserProgress Schema for tracking PDF page completion by users
 * @typedef {Object} UserProgress
 * @property {string} userId - ID of the user
 * @property {string} userEmail - Email of the user
 * @property {string} fileName - Name of the PDF file
 * @property {number} pageNumber - Page number in the PDF (1-indexed)
 * @property {boolean} isCompleted - Whether the page is marked as done/reviewed
 * @property {Date} completedAt - Date when the page was marked as done
 * @property {Date} createdAt - Record creation date
 * @property {Date} updatedAt - Last update date
 */
const userProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            trim: true,
        },
        userEmail: {
            type: String,
            required: [true, 'User email is required'],
            lowercase: true,
            trim: true,
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        pageNumber: {
            type: Number,
            required: [true, 'Page number is required'],
            min: [1, 'Page number must be at least 1'],
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: one user can only have one progress record per page per file
userProgressSchema.index({ userId: 1, fileName: 1, pageNumber: 1 }, { unique: true });

// Index on fileName for faster queries
userProgressSchema.index({ fileName: 1 });

// Index on userId for faster queries
userProgressSchema.index({ userId: 1 });

// Index on userEmail for faster queries
userProgressSchema.index({ userEmail: 1 });

// Compound index for admin queries
userProgressSchema.index({ fileName: 1, userEmail: 1 });

/**
 * UserProgress Model
 * @type {mongoose.Model<UserProgress>}
 */
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;

