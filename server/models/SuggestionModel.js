'use strict';

const mongoose = require('mongoose');

/**
 * Suggestion Schema for PDF review comments and suggestions
 * @typedef {Object} Suggestion
 * @property {string} fileName - Name of the PDF file
 * @property {string} pdfId - Unique identifier for the PDF
 * @property {number} pageNumber - Page number in the PDF (1-indexed)
 * @property {number} lineNumber - Line number on the page
 * @property {string} comment - Comment/suggestion text (required)
 * @property {string} userEmail - Email of the user who created the suggestion
 * @property {Date} createdAt - Suggestion creation date
 * @property {Date} updatedAt - Last update date
 */
const suggestionSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        pdfId: {
            type: String,
            trim: true,
        },
        pageNumber: {
            type: Number,
            required: [true, 'Page number is required'],
            min: [1, 'Page number must be at least 1'],
        },
        lineNumber: {
            type: Number,
            required: [true, 'Line number is required'],
            min: [1, 'Line number must be at least 1'],
        },
        comment: {
            type: String,
            required: [true, 'Comment is required'],
            trim: true,
            minlength: [1, 'Comment cannot be empty'],
        },
        userEmail: {
            type: String,
            required: [true, 'User email is required'],
            lowercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index on fileName for faster queries (frequently queried field)
suggestionSchema.index({ fileName: 1 });

// Compound index for efficient queries by fileName and pageNumber
suggestionSchema.index({ fileName: 1, pageNumber: 1 });

// Index on userEmail for filtering suggestions by user
suggestionSchema.index({ userEmail: 1 });

/**
 * Suggestion Model
 * @type {mongoose.Model<Suggestion>}
 */
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

module.exports = Suggestion;

