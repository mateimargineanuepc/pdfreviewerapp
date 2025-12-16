'use strict';

const UserProgress = require('../models/UserProgressModel');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Toggles the completion status of a page for the current user
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function togglePageCompletion(req, res, next) {
    try {
        const { fileName, pageNumber } = req.body;
        const userId = req.user.userId;
        const userEmail = req.user.email;

        // Validate required fields
        if (!fileName) {
            return next(createError(400, 'File name is required'));
        }
        if (!pageNumber || typeof pageNumber !== 'number' || pageNumber < 1) {
            return next(createError(400, 'Valid page number is required (must be >= 1)'));
        }

        // Find or create progress record
        let progress = await UserProgress.findOne({
            userId: userId,
            fileName: fileName.trim(),
            pageNumber: pageNumber,
        });

        if (!progress) {
            // Create new progress record
            progress = new UserProgress({
                userId: userId,
                userEmail: userEmail,
                fileName: fileName.trim(),
                pageNumber: pageNumber,
                isCompleted: true,
                completedAt: new Date(),
            });
        } else {
            // Toggle completion status
            progress.isCompleted = !progress.isCompleted;
            progress.completedAt = progress.isCompleted ? new Date() : null;
        }

        await progress.save();

        Logger.info(
            `Page ${pageNumber} of ${fileName} marked as ${progress.isCompleted ? 'completed' : 'incomplete'} by ${userEmail}`
        );

        res.status(200).json({
            success: true,
            message: `Page ${pageNumber} marked as ${progress.isCompleted ? 'completed' : 'incomplete'}`,
            data: {
                progress: {
                    id: progress._id,
                    userId: progress.userId,
                    userEmail: progress.userEmail,
                    fileName: progress.fileName,
                    pageNumber: progress.pageNumber,
                    isCompleted: progress.isCompleted,
                    completedAt: progress.completedAt,
                },
            },
        });
    } catch (error) {
        Logger.error('Error toggling page completion', error);
        next(error);
    }
}

/**
 * Gets progress for a specific document for the current user
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getUserProgress(req, res, next) {
    try {
        const { fileName } = req.query;
        const userId = req.user.userId;

        if (!fileName) {
            return next(createError(400, 'File name query parameter is required'));
        }

        // Get all progress records for this user and file
        const progressRecords = await UserProgress.find({
            userId: userId,
            fileName: fileName.trim(),
            isCompleted: true,
        })
            .select('-__v')
            .lean();

        // Get completed page numbers
        const completedPages = progressRecords.map((record) => record.pageNumber);

        Logger.info(`Fetched progress for file: ${fileName} by user: ${req.user.email}`);

        res.status(200).json({
            success: true,
            data: {
                fileName: fileName,
                userId: userId,
                completedPages: completedPages,
                completedCount: completedPages.length,
            },
        });
    } catch (error) {
        Logger.error('Error fetching user progress', error);
        next(error);
    }
}

/**
 * Gets all progress for all users (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getAllUsersProgress(req, res, next) {
    try {
        // Get all progress records
        const allProgress = await UserProgress.find({ isCompleted: true })
            .select('-__v')
            .lean()
            .sort({ fileName: 1, userEmail: 1, pageNumber: 1 });

        // Group by user and file
        const progressByUser = {};

        allProgress.forEach((record) => {
            const key = `${record.userEmail}_${record.fileName}`;
            if (!progressByUser[key]) {
                progressByUser[key] = {
                    userEmail: record.userEmail,
                    userId: record.userId,
                    fileName: record.fileName,
                    completedPages: [],
                };
            }
            progressByUser[key].completedPages.push(record.pageNumber);
        });

        // Convert to array and calculate counts
        const progressArray = Object.values(progressByUser).map((item) => ({
            userEmail: item.userEmail,
            userId: item.userId,
            fileName: item.fileName,
            completedPages: item.completedPages.sort((a, b) => a - b),
            completedCount: item.completedPages.length,
        }));

        Logger.info(`Admin ${req.user.email} fetched all users progress`);

        res.status(200).json({
            success: true,
            data: {
                progress: progressArray,
                totalRecords: allProgress.length,
            },
        });
    } catch (error) {
        Logger.error('Error fetching all users progress', error);
        next(error);
    }
}

/**
 * Gets progress for a specific page (to check if current user has marked it as done)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getPageProgress(req, res, next) {
    try {
        const { fileName, pageNumber } = req.query;
        const userId = req.user.userId;

        if (!fileName) {
            return next(createError(400, 'File name query parameter is required'));
        }
        if (!pageNumber || typeof parseInt(pageNumber) !== 'number' || parseInt(pageNumber) < 1) {
            return next(createError(400, 'Valid page number query parameter is required'));
        }

        const pageNum = parseInt(pageNumber);
        const progress = await UserProgress.findOne({
            userId: userId,
            fileName: fileName.trim(),
            pageNumber: pageNum,
        })
            .select('-__v')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                fileName: fileName,
                pageNumber: pageNum,
                isCompleted: progress ? progress.isCompleted : false,
                completedAt: progress ? progress.completedAt : null,
            },
        });
    } catch (error) {
        Logger.error('Error fetching page progress', error);
        next(error);
    }
}

module.exports = {
    togglePageCompletion,
    getUserProgress,
    getAllUsersProgress,
    getPageProgress,
};

