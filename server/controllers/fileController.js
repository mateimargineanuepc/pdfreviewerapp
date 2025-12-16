'use strict';

const { getStorageBucket } = require('../config/firebase');
const Logger = require('../common/logger');
const { createError } = require('../common/error-handler');

/**
 * Generates a signed URL for a PDF file stored in Firebase Storage
 * The signed URL is valid for 1 hour and allows read access
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function getPdfUrl(req, res, next) {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename) {
            return next(createError(400, 'Filename is required'));
        }

        // Sanitize filename to prevent path traversal attacks
        const sanitizedFilename = filename.replace(/\.\./g, '').replace(/^\//, '');

        Logger.info(`Generating signed URL for file: ${sanitizedFilename}`);

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        // Get file reference
        const file = bucket.file(sanitizedFilename);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            Logger.warn(`File not found: ${sanitizedFilename}`);
            return next(createError(404, 'File not found'));
        }

        // Generate signed URL (valid for 1 hour)
        const expiresIn = 60 * 60 * 1000; // 1 hour in milliseconds
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn,
        });

        Logger.info(`Signed URL generated successfully for file: ${sanitizedFilename}`);

        // Return signed URL
        res.status(200).json({
            success: true,
            data: {
                filename: sanitizedFilename,
                url: signedUrl,
                expiresIn: expiresIn,
                expiresAt: new Date(Date.now() + expiresIn).toISOString(),
            },
        });
    } catch (error) {
        Logger.error('Error generating signed URL', error);
        next(error);
    }
}

/**
 * Lists all available PDF files in Firebase Storage
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function listPdfFiles(req, res, next) {
    try {
        Logger.info('Listing PDF files from Firebase Storage');

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        // List files with .pdf extension
        const [files] = await bucket.getFiles({
            prefix: '',
        });

        // Filter PDF files and extract filenames
        const pdfFiles = files
            .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
            .map((file) => ({
                name: file.name,
                size: file.metadata.size,
                updated: file.metadata.updated,
            }));

        Logger.info(`Found ${pdfFiles.length} PDF files`);

        res.status(200).json({
            success: true,
            data: {
                files: pdfFiles,
                count: pdfFiles.length,
            },
        });
    } catch (error) {
        Logger.error('Error listing PDF files', error);
        next(error);
    }
}

/**
 * Proxies PDF file from Firebase Storage to avoid CORS issues
 * Streams the file directly to the client
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function proxyPdfFile(req, res, next) {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename) {
            return next(createError(400, 'Filename is required'));
        }

        // Check authentication (token can come from header or query param)
        if (!req.user) {
            Logger.warn('Unauthorized attempt to access PDF file');
            return next(createError(401, 'Authentication required'));
        }

        // Sanitize filename to prevent path traversal attacks
        const sanitizedFilename = filename.replace(/\.\./g, '').replace(/^\//, '');

        Logger.info(`Proxying PDF file: ${sanitizedFilename} for user: ${req.user.email}`);

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        // Get file reference
        const file = bucket.file(sanitizedFilename);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            Logger.warn(`File not found: ${sanitizedFilename}`);
            return next(createError(404, 'File not found'));
        }

        // Get file metadata
        const [metadata] = await file.getMetadata();

        // Set appropriate headers
        res.setHeader('Content-Type', metadata.contentType || 'application/pdf');
        res.setHeader('Content-Length', metadata.size);
        res.setHeader('Content-Disposition', `inline; filename="${sanitizedFilename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Accept-Ranges', 'bytes'); // Enable range requests for better performance
        res.setHeader('Content-Encoding', 'identity'); // No compression for PDFs

        // Stream file to response
        const stream = file.createReadStream();
        stream.pipe(res);

        stream.on('error', (error) => {
            Logger.error('Error streaming file', error);
            if (!res.headersSent) {
                next(createError(500, 'Error streaming file'));
            }
        });
    } catch (error) {
        Logger.error('Error proxying PDF file', error);
        next(error);
    }
}

/**
 * Uploads a PDF file to Firebase Storage (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function uploadPdfFile(req, res, next) {
    try {
        if (!req.file) {
            return next(createError(400, 'No file uploaded'));
        }

        // Validate file type
        if (req.file.mimetype !== 'application/pdf') {
            return next(createError(400, 'Only PDF files are allowed'));
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (req.file.size > maxSize) {
            return next(createError(400, 'File size exceeds 50MB limit'));
        }

        const filename = req.file.originalname;
        const sanitizedFilename = filename.replace(/\.\./g, '').replace(/^\//, '');

        Logger.info(`Uploading PDF file: ${sanitizedFilename} by admin: ${req.user.email}`);

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        // Create file reference
        const file = bucket.file(sanitizedFilename);

        // Check if file already exists
        const [exists] = await file.exists();
        if (exists) {
            Logger.warn(`File already exists: ${sanitizedFilename}`);
            return next(createError(409, 'File with this name already exists'));
        }

        // Upload file to Firebase Storage
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'application/pdf',
            },
        });

        stream.on('error', (error) => {
            Logger.error('Error uploading file to Firebase', error);
            next(createError(500, 'Failed to upload file'));
        });

        stream.on('finish', async () => {
            try {
                // Make file publicly readable (optional, depending on your security needs)
                // await file.makePublic();

                Logger.info(`File uploaded successfully: ${sanitizedFilename}`);

                res.status(201).json({
                    success: true,
                    message: 'File uploaded successfully',
                    data: {
                        filename: sanitizedFilename,
                        size: req.file.size,
                    },
                });
            } catch (error) {
                Logger.error('Error finalizing file upload', error);
                next(createError(500, 'Failed to finalize file upload'));
            }
        });

        // Write file buffer to stream
        stream.end(req.file.buffer);
    } catch (error) {
        Logger.error('Error uploading PDF file', error);
        next(error);
    }
}

/**
 * Deletes a PDF file from Firebase Storage (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function deletePdfFile(req, res, next) {
    try {
        const { filename } = req.params;

        // Validate filename
        if (!filename) {
            return next(createError(400, 'Filename is required'));
        }

        // Sanitize filename to prevent path traversal attacks
        const sanitizedFilename = filename.replace(/\.\./g, '').replace(/^\//, '');

        Logger.info(`Deleting PDF file: ${sanitizedFilename} by admin: ${req.user.email}`);

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        // Get file reference
        const file = bucket.file(sanitizedFilename);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            Logger.warn(`File not found for deletion: ${sanitizedFilename}`);
            return next(createError(404, 'File not found'));
        }

        // Delete file
        await file.delete();

        Logger.info(`File deleted successfully: ${sanitizedFilename}`);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
            data: {
                filename: sanitizedFilename,
            },
        });
    } catch (error) {
        Logger.error('Error deleting PDF file', error);
        next(error);
    }
}

/**
 * Deletes multiple PDF files from Firebase Storage (admin only)
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Promise<void>}
 */
async function deleteMultiplePdfFiles(req, res, next) {
    try {
        Logger.debug('deleteMultiplePdfFiles called', { body: req.body, method: req.method, path: req.path });

        const { filenames } = req.body;

        // Validate filenames array
        if (!Array.isArray(filenames) || filenames.length === 0) {
            Logger.warn('Invalid filenames array provided for deletion');
            return next(createError(400, 'Filenames array is required and must not be empty'));
        }

        Logger.info(`Deleting ${filenames.length} PDF files by admin: ${req.user.email}`);

        // Get Firebase Storage bucket
        const bucket = getStorageBucket();

        const results = {
            deleted: [],
            notFound: [],
            errors: [],
        };

        // Delete files one by one
        for (const filename of filenames) {
            try {
                // Sanitize filename
                const sanitizedFilename = filename.replace(/\.\./g, '').replace(/^\//, '');

                // Get file reference
                const file = bucket.file(sanitizedFilename);

                // Check if file exists
                const [exists] = await file.exists();
                if (!exists) {
                    Logger.warn(`File not found for deletion: ${sanitizedFilename}`);
                    results.notFound.push(sanitizedFilename);
                    continue;
                }

                // Delete file
                await file.delete();
                results.deleted.push(sanitizedFilename);
                Logger.info(`File deleted successfully: ${sanitizedFilename}`);
            } catch (error) {
                Logger.error(`Error deleting file ${filename}`, error);
                results.errors.push({ filename, error: error.message });
            }
        }

        Logger.info(
            `Bulk delete completed: ${results.deleted.length} deleted, ${results.notFound.length} not found, ${results.errors.length} errors`
        );

        res.status(200).json({
            success: true,
            message: `Deleted ${results.deleted.length} file(s)`,
            data: results,
        });
    } catch (error) {
        Logger.error('Error deleting multiple PDF files', error);
        next(error);
    }
}

module.exports = {
    getPdfUrl,
    listPdfFiles,
    proxyPdfFile,
    uploadPdfFile,
    deletePdfFile,
    deleteMultiplePdfFiles,
};

