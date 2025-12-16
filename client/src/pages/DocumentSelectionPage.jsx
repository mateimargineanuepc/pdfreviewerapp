'use strict';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useOrientation } from '../hooks/useOrientation';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import fileService from '../api-services/fileService';
import './DocumentSelectionPage.css';

// Set up PDF.js worker - use worker from node_modules via Vite
// This ensures proper MIME types and module resolution
if (typeof window !== 'undefined') {
    // Ensure worker is properly initialized only once
    if (!pdfjs.GlobalWorkerOptions.workerSrc || pdfjs.GlobalWorkerOptions.workerSrc === '') {
        // Use worker from node_modules - Vite will handle it correctly
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.mjs',
            import.meta.url
        ).toString();
    }
}

/**
 * DocumentSelectionPage component for browsing and selecting PDF documents
 * @returns {JSX.Element} DocumentSelectionPage component
 */
function DocumentSelectionPage() {
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrls, setPreviewUrls] = useState({});
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();
    const orientation = useOrientation();
    const { user } = useAuth();

    /**
     * Loads list of available PDF files
     */
    useEffect(() => {
        loadFileList();
    }, []);

    /**
     * Filters files based on search query
     */
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFiles(files);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = files.filter((file) => file.name.toLowerCase().includes(query));
            setFilteredFiles(filtered);
        }
    }, [searchQuery, files]);

    /**
     * Loads preview URLs for files
     */
    useEffect(() => {
        if (files.length > 0) {
            loadPreviewUrls();
        }
    }, [files]);

    /**
     * Recalculate layout on orientation change
     */
    useEffect(() => {
        // Force a re-render when orientation changes
        // This ensures the grid layout recalculates
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 200);
        return () => clearTimeout(timer);
    }, [orientation]);

    /**
     * Fetches list of available PDF files from API
     */
    const loadFileList = async () => {
        setLoading(true);
        setError('');
        const result = await fileService.getFileList();
        if (result.success) {
            setFiles(result.data);
            setFilteredFiles(result.data);
        } else {
            setError(result.error || 'Failed to load files');
        }
        setLoading(false);
    };

    /**
     * Handles successful file upload - refreshes the file list
     */
    const handleUploadSuccess = () => {
        loadFileList();
    };

    /**
     * Loads preview URLs for all files using secure data URL method
     * Loads previews sequentially to avoid overwhelming the browser
     */
    const loadPreviewUrls = async () => {
        const urls = {};

        // Load previews one at a time to avoid performance issues
        for (const file of files) {
            try {
                // Fetch PDF as data URL using secure method (token in header, not URL)
                // Use cache for better performance
                const result = await fileService.getFileBlob(file.name, true);
                if (result.success) {
                    // Use data URL instead of blob URL to avoid CSP issues
                    urls[file.name] = result.data.dataUrl;
                    setPreviewUrls({ ...urls }); // Update state incrementally
                }
            } catch (error) {
                console.error(`Failed to load preview for ${file.name}:`, error);
            }
            
            // Small delay to prevent UI blocking
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    };

    /**
     * Handles document selection (navigation to viewer)
     * @param {string} filename - Name of the selected file
     * @param {React.MouseEvent} e - Click event
     */
    const handleDocumentSelect = (filename, e) => {
        // Don't navigate if clicking on checkbox, checkbox wrapper, or delete button
        const target = e.target;
        const isCheckbox = target.type === 'checkbox';
        const isCheckboxWrapper = target.closest('.document-checkbox-wrapper');
        const isDeleteButton = target.closest('.delete-button');
        
        if (isCheckbox || isCheckboxWrapper || isDeleteButton) {
            e.stopPropagation();
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        navigate(`/viewer?file=${encodeURIComponent(filename)}`);
    };

    /**
     * Handles checkbox selection for deletion
     * @param {string} filename - Name of the file
     * @param {boolean} checked - Whether the checkbox is checked
     * @param {React.MouseEvent} e - Click event
     */
    const handleCheckboxChange = (filename, checked, e) => {
        e.stopPropagation();
        const newSelected = new Set(selectedFiles);
        if (checked) {
            newSelected.add(filename);
        } else {
            newSelected.delete(filename);
        }
        setSelectedFiles(newSelected);
    };

    /**
     * Handles select all / deselect all
     * @param {boolean} selectAll - Whether to select all or deselect all
     */
    const handleSelectAll = (selectAll) => {
        if (selectAll) {
            setSelectedFiles(new Set(filteredFiles.map((file) => file.name)));
        } else {
            setSelectedFiles(new Set());
        }
    };

    /**
     * Handles file deletion
     * @param {string[]} filenames - Array of filenames to delete
     */
    const handleDeleteFiles = async (filenames) => {
        if (!window.confirm(`Are you sure you want to delete ${filenames.length} file(s)? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        setError('');

        try {
            const result = await fileService.deleteMultipleFiles(filenames);
            if (result.success) {
                // Remove deleted files from state
                const deletedSet = new Set(filenames);
                setFiles((prevFiles) => prevFiles.filter((file) => !deletedSet.has(file.name)));
                setFilteredFiles((prevFiles) => prevFiles.filter((file) => !deletedSet.has(file.name)));
                setSelectedFiles(new Set());
                // Clear preview URLs for deleted files
                const newPreviewUrls = { ...previewUrls };
                filenames.forEach((filename) => {
                    delete newPreviewUrls[filename];
                });
                setPreviewUrls(newPreviewUrls);
            } else {
                setError(result.error || 'Failed to delete files');
            }
        } catch (error) {
            setError(error.message || 'Failed to delete files');
        } finally {
            setDeleting(false);
        }
    };

    /**
     * Handles search input change
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     */
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div className="document-selection-page">
            <div className="document-selection-container">
                <h1>Select a Document</h1>

                {/* File Upload (Admin Only) */}
                {user && user.role === 'admin' && (
                    <FileUpload onUploadSuccess={handleUploadSuccess} />
                )}

                {/* Admin Controls - Selection and Delete */}
                {user && user.role === 'admin' && filteredFiles.length > 0 && (
                    <div className="admin-controls">
                        <div className="selection-controls">
                            <label className="select-all-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.size > 0 && selectedFiles.size === filteredFiles.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    disabled={deleting}
                                />
                                <span>
                                    {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </span>
                            </label>
                            {selectedFiles.size > 0 && (
                                <button
                                    onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
                                    disabled={deleting}
                                    className="delete-selected-button"
                                >
                                    {deleting ? 'Deleting...' : `Delete Selected (${selectedFiles.size})`}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search documents by name..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="clear-search-button"
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Results Count */}
                {!loading && (
                    <div className="results-count">
                        {filteredFiles.length === 0
                            ? 'No documents found'
                            : `Showing ${filteredFiles.length} of ${files.length} document${files.length !== 1 ? 's' : ''}`}
                    </div>
                )}

                {/* Loading State */}
                {loading && <div className="loading">Loading documents...</div>}

                {/* Documents Grid */}
                {!loading && filteredFiles.length > 0 && (
                    <div className="documents-grid">
                        {filteredFiles.map((file) => (
                            <div
                                key={file.name}
                                className={`document-card ${selectedFiles.has(file.name) ? 'selected' : ''}`}
                                onClick={(e) => handleDocumentSelect(file.name, e)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleDocumentSelect(file.name, e);
                                    }
                                }}
                            >
                                {/* Admin Checkbox */}
                                {user && user.role === 'admin' && (
                                    <div
                                        className="document-checkbox-wrapper"
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            className="document-checkbox"
                                            checked={selectedFiles.has(file.name)}
                                            onChange={(e) => handleCheckboxChange(file.name, e.target.checked, e)}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            disabled={deleting}
                                        />
                                    </div>
                                )}
                                <div
                                    className="document-preview"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {previewUrls[file.name] ? (
                                        <Document
                                            file={previewUrls[file.name]}
                                            loading={<div className="preview-loading">Loading</div>}
                                            error={
                                                <div className="preview-error">Preview unavailable</div>
                                            }
                                        >
                                            <Page
                                                pageNumber={1}
                                                width={200}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className="preview-page"
                                            />
                                        </Document>
                                    ) : (
                                        <div className="preview-loading">Loading</div>
                                    )}
                                </div>
                                <div
                                    className="document-card-content"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <div className="document-name">{file.name}</div>
                                    <div className="document-info">
                                        <small>
                                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '—'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && filteredFiles.length === 0 && searchQuery && (
                    <div className="no-results">
                        <p>No documents found matching "{searchQuery}"</p>
                        <button onClick={() => setSearchQuery('')} className="clear-search-link">
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentSelectionPage;

