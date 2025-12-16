'use strict';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api-services/api';
import './FileUpload.css';

/**
 * FileUpload component for admin users to upload PDF files
 * @returns {JSX.Element} FileUpload component
 */
function FileUpload({ onUploadSuccess }) {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /**
     * Handles file selection
     * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                setSelectedFile(null);
                return;
            }

            // Validate file size (50MB)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                setError('File size exceeds 50MB limit');
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setError('');
            setSuccess('');
        }
    };

    /**
     * Handles file upload
     * @param {React.FormEvent} e - Form submit event
     */
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSuccess(`File "${selectedFile.name}" uploaded successfully!`);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('pdf-upload-input');
                if (fileInput) {
                    fileInput.value = '';
                }
                // Call success callback to refresh file list
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            }
        } catch (error) {
            setError(
                error.response?.data?.error?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Failed to upload file'
            );
        } finally {
            setUploading(false);
        }
    };

    // Only show upload component for admins
    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="file-upload-container">
            <h3>Upload PDF Document</h3>
            <form onSubmit={handleUpload} className="file-upload-form">
                <div className="file-upload-input-wrapper">
                    <input
                        type="file"
                        id="pdf-upload-input"
                        accept=".pdf,application/pdf"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="file-upload-input"
                    />
                    <label htmlFor="pdf-upload-input" className="file-upload-label">
                        {selectedFile ? selectedFile.name : 'Choose PDF file...'}
                    </label>
                </div>

                {selectedFile && (
                    <div className="file-info-display">
                        <p>
                            <strong>File:</strong> {selectedFile.name}
                        </p>
                        <p>
                            <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                )}

                {error && <div className="file-upload-error">{error}</div>}
                {success && <div className="file-upload-success">{success}</div>}

                <button type="submit" disabled={!selectedFile || uploading} className="upload-button">
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
            </form>
        </div>
    );
}

export default FileUpload;

