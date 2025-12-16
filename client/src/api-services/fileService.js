'use strict';

import api from './api';

/**
 * File Service for handling PDF file operations
 */
class FileService {
    /**
     * Gets list of all available PDF files
     * @returns {Promise<Object>} List of PDF files
     */
    async getFileList() {
        try {
            const response = await api.get('/api/files');
            return {
                success: true,
                data: response.data.data.files || [],
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch files',
            };
        }
    }

    /**
     * Gets signed URL for a specific PDF file
     * @param {string} filename - Name of the PDF file
     * @returns {Promise<Object>} Signed URL and file information
     */
    async getFileUrl(filename) {
        try {
            const response = await api.get(`/api/files/${encodeURIComponent(filename)}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to fetch file URL',
            };
        }
    }

    // Cache for PDF files to avoid re-fetching
    static pdfCache = new Map();

    /**
     * Gets PDF file as data URL for secure rendering (no token in URL)
     * Uses ArrayBuffer for better performance than base64
     * Implements caching to speed up subsequent loads
     * @param {string} filename - Name of the PDF file
     * @param {boolean} useCache - Whether to use cache (default: true)
     * @returns {Promise<Object>} Data URL for the PDF
     */
    async getFileBlob(filename, useCache = true) {
        try {
            // Check cache first
            if (useCache && FileService.pdfCache.has(filename)) {
                const cached = FileService.pdfCache.get(filename);
                return {
                    success: true,
                    data: {
                        dataUrl: cached.dataUrl,
                        filename: filename,
                        fromCache: true,
                    },
                };
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            const response = await fetch(
                `${API_BASE_URL}/api/files/${encodeURIComponent(filename)}/proxy`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }

            // Use ArrayBuffer for better performance
            const arrayBuffer = await response.arrayBuffer();
            
            // Convert ArrayBuffer to base64 data URL (required for react-pdf)
            return new Promise((resolve, reject) => {
                const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    
                    // Cache the result
                    if (useCache) {
                        FileService.pdfCache.set(filename, {
                            dataUrl: dataUrl,
                            timestamp: Date.now(),
                        });
                        
                        // Limit cache size to prevent memory issues (keep last 10 files)
                        if (FileService.pdfCache.size > 10) {
                            const firstKey = FileService.pdfCache.keys().next().value;
                            FileService.pdfCache.delete(firstKey);
                        }
                    }
                    
                    resolve({
                        success: true,
                        data: {
                            dataUrl: dataUrl,
                            filename: filename,
                            fromCache: false,
                        },
                    });
                };
                
                reader.onerror = () => {
                    reject({
                        success: false,
                        error: 'Failed to convert PDF to data URL',
                    });
                };
                
                // Use readAsDataURL for react-pdf compatibility
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to fetch PDF file',
            };
        }
    }

    /**
     * Deletes a PDF file (admin only)
     * @param {string} filename - Name of the PDF file to delete
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFile(filename) {
        try {
            const response = await api.delete(`/api/files/${encodeURIComponent(filename)}`);
            // Clear from cache if it exists
            FileService.pdfCache.delete(filename);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to delete file',
            };
        }
    }

    /**
     * Deletes multiple PDF files (admin only)
     * @param {string[]} filenames - Array of PDF filenames to delete
     * @returns {Promise<Object>} Deletion results
     */
    async deleteMultipleFiles(filenames) {
        try {
            // Use POST method for bulk delete to ensure body is properly sent
            // Some servers have issues with DELETE requests containing bodies
            const response = await api.post('/api/files/delete-multiple', {
                filenames,
            });
            // Clear from cache
            filenames.forEach((filename) => {
                FileService.pdfCache.delete(filename);
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Failed to delete files',
            };
        }
    }

    /**
     * Clears the PDF cache
     */
    static clearCache() {
        FileService.pdfCache.clear();
    }
}

export default new FileService();

