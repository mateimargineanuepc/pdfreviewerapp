'use strict';

const express = require('express');
const multer = require('multer');
const {
    getPdfUrl,
    listPdfFiles,
    proxyPdfFile,
    uploadPdfFile,
    deletePdfFile,
    deleteMultiplePdfFiles,
} = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');
const authMiddlewareOptional = require('../middleware/authMiddlewareOptional');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

/**
 * GET /api/files
 * List all available PDF files (protected route)
 * @route GET /api/files
 * @header Authorization: Bearer <token>
 * @returns {Object} List of PDF files
 */
router.get('/', authMiddleware, listPdfFiles);

/**
 * GET /api/files/:filename/proxy
 * Proxy PDF file from Firebase Storage to avoid CORS issues (protected route)
 * Streams the file directly to the client
 * Accepts token from Authorization header (preferred) or query parameter (legacy support)
 * This route must be defined before /:filename to match correctly
 * @route GET /api/files/:filename/proxy
 * @header Authorization: Bearer <token> (preferred) OR @query token=<token> (legacy)
 * @param {string} filename - Name of the PDF file
 * @returns {Stream} PDF file stream
 */
router.get('/:filename/proxy', authMiddlewareOptional, proxyPdfFile);

/**
 * POST /api/files/upload
 * Upload a PDF file to Firebase Storage (admin only)
 * @route POST /api/files/upload
 * @header Authorization: Bearer <token>
 * @formData file - PDF file to upload (multipart/form-data)
 * @returns {Object} Upload confirmation and file information
 */
router.post('/upload', authMiddleware, adminMiddleware, upload.single('file'), uploadPdfFile);

/**
 * POST /api/files/delete-multiple
 * Delete multiple PDF files from Firebase Storage (admin only)
 * Uses POST instead of DELETE to ensure request body is properly parsed
 * This route must be defined before any /:filename routes to match correctly
 * @route POST /api/files/delete-multiple
 * @header Authorization: Bearer <token>
 * @body {string[]} filenames - Array of PDF filenames to delete
 * @returns {Object} Deletion results with success/error details
 */
router.post('/delete-multiple', authMiddleware, adminMiddleware, deleteMultiplePdfFiles);

/**
 * DELETE /api/files
 * Delete multiple PDF files from Firebase Storage (admin only)
 * This route must be defined before DELETE /:filename to match correctly
 * @route DELETE /api/files
 * @header Authorization: Bearer <token>
 * @body {string[]} filenames - Array of PDF filenames to delete
 * @returns {Object} Deletion results with success/error details
 */
router.delete('/', authMiddleware, adminMiddleware, deleteMultiplePdfFiles);

/**
 * DELETE /api/files/:filename
 * Delete a PDF file from Firebase Storage (admin only)
 * @route DELETE /api/files/:filename
 * @header Authorization: Bearer <token>
 * @param {string} filename - Name of the PDF file to delete
 * @returns {Object} Deletion confirmation
 */
router.delete('/:filename', authMiddleware, adminMiddleware, deletePdfFile);

/**
 * GET /api/files/:filename
 * Get signed URL for a specific PDF file (protected route)
 * Only logged-in users can access this endpoint
 * @route GET /api/files/:filename
 * @header Authorization: Bearer <token>
 * @param {string} filename - Name of the PDF file
 * @returns {Object} Signed URL and file information
 */
router.get('/:filename', authMiddleware, getPdfUrl);

module.exports = router;

