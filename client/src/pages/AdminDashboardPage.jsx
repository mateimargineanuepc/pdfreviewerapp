'use strict';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import registrationService from '../api-services/registrationService';
import progressService from '../api-services/progressService';
import fileService from '../api-services/fileService';
import './AdminDashboardPage.css';

/**
 * AdminDashboardPage component for managing user registrations
 * @returns {JSX.Element} AdminDashboardPage component
 */
function AdminDashboardPage() {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [rejectingUserId, setRejectingUserId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' or 'progress'
    const [allProgress, setAllProgress] = useState([]);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [files, setFiles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(''); // Selected user email for filtering
    const [pageCounts, setPageCounts] = useState({}); // Cache for PDF page counts

    /**
     * Loads registration requests or progress based on active tab
     */
    useEffect(() => {
        if (user && user.role === 'admin') {
            if (activeTab === 'registrations') {
                loadRegistrations();
            } else if (activeTab === 'progress') {
                loadAllProgress();
                loadFileList();
            }
        }
    }, [user, statusFilter, activeTab]);

    /**
     * Fetches registration requests from API
     */
    const loadRegistrations = async () => {
        setLoading(true);
        setError('');
        const result = await registrationService.getAllRegistrations(statusFilter);
        if (result.success) {
            setRegistrations(result.data);
        } else {
            setError(result.error || 'Failed to load registrations');
        }
        setLoading(false);
    };

    /**
     * Handles approval of a registration
     * @param {string} userId - User ID to approve
     */
    const handleApprove = async (userId) => {
        if (!window.confirm('Are you sure you want to approve this registration?')) {
            return;
        }

        setLoading(true);
        setError('');
        const result = await registrationService.approveRegistration(userId);
        if (result.success) {
            await loadRegistrations();
        } else {
            setError(result.error || 'Failed to approve registration');
        }
        setLoading(false);
    };

    /**
     * Handles rejection of a registration
     * @param {string} userId - User ID to reject
     */
    const handleReject = async (userId) => {
        if (!rejectionReason.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        if (!window.confirm('Are you sure you want to reject this registration?')) {
            return;
        }

        setLoading(true);
        setError('');
        const result = await registrationService.rejectRegistration(userId, rejectionReason);
        if (result.success) {
            setRejectingUserId(null);
            setRejectionReason('');
            await loadRegistrations();
        } else {
            setError(result.error || 'Failed to reject registration');
        }
        setLoading(false);
    };

    /**
     * Loads all users progress
     */
    const loadAllProgress = async () => {
        setLoadingProgress(true);
        try {
            const result = await progressService.getAllUsersProgress();
            if (result.success) {
                setAllProgress(result.data.progress || []);
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        } finally {
            setLoadingProgress(false);
        }
    };

    /**
     * Gets page count for a PDF file
     * @param {string} fileName - Name of the PDF file
     * @returns {Promise<number>} Total number of pages
     */
    const getPageCount = async (fileName) => {
        // Check cache first
        if (pageCounts[fileName]) {
            return pageCounts[fileName];
        }

        try {
            // Load PDF to get page count
            const result = await fileService.getFileBlob(fileName, true);
            if (result.success && result.data.dataUrl) {
                // Use pdfjs to get page count from data URL
                const { getDocument } = await import('pdfjs-dist');
                // Extract base64 data from data URL
                const base64Data = result.data.dataUrl.split(',')[1];
                if (base64Data) {
                    // Convert base64 to Uint8Array
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    const loadingTask = getDocument({ data: bytes });
                    const pdf = await loadingTask.promise;
                    const count = pdf.numPages;
                    
                    // Cache the page count
                    setPageCounts((prev) => ({ ...prev, [fileName]: count }));
                    return count;
                }
            }
        } catch (error) {
            console.error(`Failed to get page count for ${fileName}:`, error);
        }
        
        return 0;
    };

    /**
     * Loads file list for progress overview and gets page counts
     */
    const loadFileList = async () => {
        try {
            const result = await fileService.getFileList();
            if (result.success) {
                const fileList = result.data || [];
                setFiles(fileList);
                
                // Load page counts for all files
                const counts = {};
                for (const file of fileList) {
                    const count = await getPageCount(file.name);
                    counts[file.name] = count;
                }
                setPageCounts(counts);
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    /**
     * Gets progress for a specific user and file
     * @param {string} userEmail - User email
     * @param {string} fileName - File name
     * @returns {Object} Progress data
     */
    const getUserFileProgress = (userEmail, fileName) => {
        return allProgress.find(
            (p) => p.userEmail === userEmail && p.fileName === fileName
        );
    };

    // Only show for admins
    if (!user || user.role !== 'admin') {
        return (
            <div className="admin-dashboard-page">
                <div className="admin-dashboard-container">
                    <div className="error-message">Access denied. Admin privileges required.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-container">
                <h1>Admin Dashboard</h1>

                {/* Tab Navigation */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                    >
                        Registration Management
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('progress')}
                    >
                        Progress Overview
                    </button>
                </div>

                {/* Registration Management Tab */}
                {activeTab === 'registrations' && (
                    <>
                        <h2>Registration Management</h2>

                {/* Status Filter */}
                <div className="status-filter">
                    <label htmlFor="statusFilter">Filter by Status:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Loading State */}
                {loading && <div className="loading">Loading registrations...</div>}

                {/* Registrations List */}
                {!loading && registrations.length > 0 && (
                    <div className="registrations-list">
                        {registrations.map((registration) => (
                            <div key={registration.id} className="registration-card">
                                <div className="registration-header">
                                    <div className="registration-email">{registration.email}</div>
                                    <div className={`registration-status status-${registration.registrationStatus}`}>
                                        {registration.registrationStatus.toUpperCase()}
                                    </div>
                                </div>
                                <div className="registration-details">
                                    <strong>Registration Details:</strong>
                                    <p>{registration.registrationDetails}</p>
                                </div>
                                {registration.rejectionReason && (
                                    <div className="rejection-reason">
                                        <strong>Rejection Reason:</strong>
                                        <p>{registration.rejectionReason}</p>
                                    </div>
                                )}
                                <div className="registration-meta">
                                    <small>
                                        Registered: {new Date(registration.createdAt).toLocaleString()}
                                    </small>
                                </div>
                                {registration.registrationStatus === 'pending' && (
                                    <div className="registration-actions">
                                        <button
                                            onClick={() => handleApprove(registration.id)}
                                            disabled={loading}
                                            className="approve-button"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectingUserId(registration.id)}
                                            disabled={loading}
                                            className="reject-button"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {rejectingUserId === registration.id && (
                                    <div className="rejection-form">
                                        <label htmlFor="rejectionReason">Rejection Reason:</label>
                                        <textarea
                                            id="rejectionReason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Please provide a reason for rejection..."
                                            rows="3"
                                        />
                                        <div className="rejection-form-actions">
                                            <button
                                                onClick={() => handleReject(registration.id)}
                                                disabled={loading || !rejectionReason.trim()}
                                                className="confirm-reject-button"
                                            >
                                                Confirm Rejection
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRejectingUserId(null);
                                                    setRejectionReason('');
                                                }}
                                                disabled={loading}
                                                className="cancel-button"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* No Registrations */}
                {!loading && registrations.length === 0 && (
                    <div className="no-registrations">
                        <p>
                            {statusFilter
                                ? `No ${statusFilter} registrations found.`
                                : 'No registrations found.'}
                        </p>
                    </div>
                )}
                    </>
                )}

                {/* Progress Overview Tab */}
                {activeTab === 'progress' && (
                    <>
                        <h2>Progress Overview</h2>
                        
                        {/* User Selection Dropdown */}
                        <div className="user-filter">
                            <label htmlFor="userSelect">Select User:</label>
                            <select
                                id="userSelect"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="user-select"
                            >
                                <option value="">All Users</option>
                                {Array.from(new Set(allProgress.map((p) => p.userEmail)))
                                    .sort()
                                    .map((userEmail) => (
                                        <option key={userEmail} value={userEmail}>
                                            {userEmail}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {loadingProgress ? (
                            <div className="loading">Loading progress data...</div>
                        ) : (
                            <div className="progress-overview">
                                {files.length === 0 ? (
                                    <div className="no-progress">
                                        <p>No documents available.</p>
                                    </div>
                                ) : (
                                    <div className="progress-table-container">
                                        <table className="progress-table">
                                            <thead>
                                                <tr>
                                                    <th>Document</th>
                                                    <th>Progress</th>
                                                    <th>Completed Pages</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {files.map((file) => {
                                                    // Get users who have progress on this file (filtered by selectedUser)
                                                    const usersForFile = Array.from(
                                                        new Set(
                                                            allProgress
                                                                .filter((p) => {
                                                                    const matchesFile = p.fileName === file.name;
                                                                    const matchesUser = !selectedUser || p.userEmail === selectedUser;
                                                                    return matchesFile && matchesUser;
                                                                })
                                                                .map((p) => p.userEmail)
                                                        )
                                                    );

                                                    if (usersForFile.length === 0) {
                                                        return (
                                                            <tr key={file.name}>
                                                                <td colSpan="3" className="no-progress-cell">
                                                                    {file.name} - {selectedUser ? 'No progress yet for this user' : 'No progress yet'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return usersForFile.map((userEmail) => {
                                                        const progress = getUserFileProgress(userEmail, file.name);
                                                        const completedCount = progress ? progress.completedCount : 0;
                                                        const totalPages = pageCounts[file.name] || 0;
                                                        const percentage = totalPages > 0 ? Math.round((completedCount / totalPages) * 100) : 0;
                                                        
                                                        return (
                                                            <tr key={`${userEmail}_${file.name}`}>
                                                                <td>
                                                                    {file.name}
                                                                    {!selectedUser && (
                                                                        <div className="user-email-badge">{userEmail}</div>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="progress-bar-container">
                                                                        <div
                                                                            className="progress-bar-fill"
                                                                            style={{
                                                                                width: `${percentage}%`,
                                                                                backgroundColor: percentage > 0 
                                                                                    ? 'var(--gold-primary)' 
                                                                                    : 'var(--border-color)',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="progress-percentage">
                                                                        {percentage}% {totalPages > 0 && `(${completedCount}/${totalPages})`}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {completedCount} page{completedCount !== 1 ? 's' : ''} completed
                                                                    {progress && progress.completedPages.length > 0 && (
                                                                        <div className="completed-pages-list">
                                                                            Pages: {progress.completedPages.join(', ')}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminDashboardPage;

