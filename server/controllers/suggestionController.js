'use strict';

const mongoose = require('mongoose');
const Suggestion = require('../models/SuggestionModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Creates a new suggestion for a PDF file
 * @param {express.Request} req - Express request object (req.user contains authenticated user info)
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function createSuggestion(req, res, next) {
    try {
        const { fileName, page, line, comment, pdfId } = req.body;
        const userEmail = req.user.email; // From auth middleware

        // Validate required fields
        if (!fileName) {
            return next(createError(400, 'File name is required'));
        }
        if (!page || typeof page !== 'number') {
            return next(createError(400, 'Page number is required and must be a number'));
        }
        if (!line || typeof line !== 'number') {
            return next(createError(400, 'Line number is required and must be a number'));
        }
        if (!comment || comment.trim().length === 0) {
            return next(createError(400, 'Comment is required and cannot be empty'));
        }

        // Create suggestion
        const suggestion = new Suggestion({
            fileName: fileName.trim(),
            pdfId: pdfId || '',
            pageNumber: page,
            lineNumber: line,
            comment: comment.trim(),
            userEmail: userEmail,
        });

        await suggestion.save();
        Logger.info(`Suggestion created by ${userEmail} for file: ${fileName}, page: ${page}, line: ${line}`);

        res.status(201).json({
            success: true,
            message: 'Suggestion created successfully',
            data: {
                suggestion: {
                    id: suggestion._id,
                    fileName: suggestion.fileName,
                    pdfId: suggestion.pdfId,
                    pageNumber: suggestion.pageNumber,
                    lineNumber: suggestion.lineNumber,
                    comment: suggestion.comment,
                    userEmail: suggestion.userEmail,
                    status: suggestion.status || 'pending',
                    createdAt: suggestion.createdAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error creating suggestion', error);
        next(error);
    }
}

/**
 * Gets all suggestions for a specific PDF file
 * Returns suggestions sorted by page number, then by line number
 * Admins can see all suggestions, regular users see all suggestions (for now)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getSuggestions(req, res, next) {
    try {
        const { fileName } = req.query;
        const isAdmin = req.user && req.user.role === 'admin';

        // Validate fileName parameter
        if (!fileName) {
            return next(createError(400, 'File name query parameter is required'));
        }

        Logger.info(
            `Fetching suggestions for file: ${fileName} by ${isAdmin ? 'admin' : 'user'}: ${req.user?.email || 'anonymous'}`
        );

        // Find all suggestions for the specified file, sorted by page number, then line number
        // Admins see all suggestions, regular users also see all (for transparency)
        const suggestions = await Suggestion.find({ fileName: fileName.trim() })
            .sort({ pageNumber: 1, lineNumber: 1 })
            .select('-__v')
            .lean();

        Logger.info(`Found ${suggestions.length} suggestions for file: ${fileName}`);

        res.status(200).json({
            success: true,
            data: {
                fileName: fileName,
                suggestions: suggestions.map((suggestion) => ({
                    id: suggestion._id,
                    fileName: suggestion.fileName,
                    pdfId: suggestion.pdfId,
                    pageNumber: suggestion.pageNumber,
                    lineNumber: suggestion.lineNumber,
                    comment: suggestion.comment,
                    userEmail: suggestion.userEmail,
                    status: suggestion.status || 'pending',
                    createdAt: suggestion.createdAt,
                    updatedAt: suggestion.updatedAt,
                })),
                count: suggestions.length,
                isAdmin: isAdmin,
            },
        });
    } catch (error) {
        Logger.error('Error fetching suggestions', error);
        next(error);
    }
}

/**
 * Gets a single suggestion by ID
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getSuggestionById(req, res, next) {
    try {
        const { id } = req.params;

        if (!id) {
            return next(createError(400, 'Suggestion ID is required'));
        }

        const suggestion = await Suggestion.findById(id).select('-__v').lean();

        if (!suggestion) {
            return next(createError(404, 'Suggestion not found'));
        }

        res.status(200).json({
            success: true,
            data: {
                suggestion: {
                    id: suggestion._id,
                    fileName: suggestion.fileName,
                    pdfId: suggestion.pdfId,
                    pageNumber: suggestion.pageNumber,
                    lineNumber: suggestion.lineNumber,
                    comment: suggestion.comment,
                    userEmail: suggestion.userEmail,
                    status: suggestion.status || 'pending',
                    createdAt: suggestion.createdAt,
                    updatedAt: suggestion.updatedAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error fetching suggestion by ID', error);
        next(error);
    }
}

/**
 * Updates a suggestion (only by the user who created it)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function updateSuggestion(req, res, next) {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userEmail = req.user.email;

        if (!id) {
            return next(createError(400, 'Suggestion ID is required'));
        }
        if (!comment || comment.trim().length === 0) {
            return next(createError(400, 'Comment is required and cannot be empty'));
        }

        // Find suggestion and verify ownership
        const suggestion = await Suggestion.findById(id);
        if (!suggestion) {
            return next(createError(404, 'Suggestion not found'));
        }
        if (suggestion.userEmail !== userEmail) {
            Logger.warn(`User ${userEmail} attempted to update suggestion created by ${suggestion.userEmail}`);
            return next(createError(403, 'You can only update your own suggestions'));
        }

        // Update suggestion
        suggestion.comment = comment.trim();
        await suggestion.save();

        Logger.info(`Suggestion ${id} updated by ${userEmail}`);

        res.status(200).json({
            success: true,
            message: 'Suggestion updated successfully',
            data: {
                suggestion: {
                    id: suggestion._id,
                    fileName: suggestion.fileName,
                    pdfId: suggestion.pdfId,
                    pageNumber: suggestion.pageNumber,
                    lineNumber: suggestion.lineNumber,
                    comment: suggestion.comment,
                    userEmail: suggestion.userEmail,
                    status: suggestion.status || 'pending',
                    createdAt: suggestion.createdAt,
                    updatedAt: suggestion.updatedAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error updating suggestion', error);
        next(error);
    }
}

/**
 * Deletes a suggestion (only by the user who created it)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function deleteSuggestion(req, res, next) {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        if (!id) {
            return next(createError(400, 'Suggestion ID is required'));
        }

        // Find suggestion and verify ownership
        const suggestion = await Suggestion.findById(id);
        if (!suggestion) {
            return next(createError(404, 'Suggestion not found'));
        }
        if (suggestion.userEmail !== userEmail) {
            Logger.warn(`User ${userEmail} attempted to delete suggestion created by ${suggestion.userEmail}`);
            return next(createError(403, 'You can only delete your own suggestions'));
        }

        await Suggestion.findByIdAndDelete(id);

        Logger.info(`Suggestion ${id} deleted by ${userEmail}`);

        res.status(200).json({
            success: true,
            message: 'Suggestion deleted successfully',
        });
    } catch (error) {
        Logger.error('Error deleting suggestion', error);
        next(error);
    }
}

/**
 * Updates the status of a suggestion (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function updateSuggestionStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) {
            return next(createError(400, 'Suggestion ID is required'));
        }
        if (!status || !['pending', 'done', 'irrelevant', 'in_progress'].includes(status)) {
            return next(createError(400, 'Valid status is required (pending, done, irrelevant, in_progress)'));
        }

        // Find suggestion
        const suggestion = await Suggestion.findById(id);
        if (!suggestion) {
            return next(createError(404, 'Suggestion not found'));
        }

        // Update status
        suggestion.status = status;
        await suggestion.save();

        Logger.info(`Suggestion ${id} status updated to ${status} by admin ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Suggestion status updated successfully',
            data: {
                suggestion: {
                    id: suggestion._id,
                    fileName: suggestion.fileName,
                    pdfId: suggestion.pdfId,
                    pageNumber: suggestion.pageNumber,
                    lineNumber: suggestion.lineNumber,
                    comment: suggestion.comment,
                    userEmail: suggestion.userEmail,
                    status: suggestion.status,
                    createdAt: suggestion.createdAt,
                    updatedAt: suggestion.updatedAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error updating suggestion status', error);
        next(error);
    }
}

/**
 * Deletes multiple suggestions (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function deleteMultipleSuggestions(req, res, next) {
    try {
        const { suggestionIds } = req.body;

        if (!suggestionIds || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
            return next(createError(400, 'suggestionIds array is required and must not be empty'));
        }

        // Validate all IDs are valid MongoDB ObjectIds
        const validIds = suggestionIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== suggestionIds.length) {
            return next(createError(400, 'One or more suggestion IDs are invalid'));
        }

        // Delete suggestions
        const result = await Suggestion.deleteMany({ _id: { $in: validIds } });

        Logger.info(`Admin ${req.user.email} deleted ${result.deletedCount} suggestions`);

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} suggestion(s) deleted successfully`,
            data: {
                deletedCount: result.deletedCount,
                requestedCount: suggestionIds.length,
            },
        });
    } catch (error) {
        Logger.error('Error deleting multiple suggestions', error);
        next(error);
    }
}

module.exports = {
    createSuggestion,
    getSuggestions,
    getSuggestionById,
    updateSuggestion,
    deleteSuggestion,
    updateSuggestionStatus,
    deleteMultipleSuggestions,
};

