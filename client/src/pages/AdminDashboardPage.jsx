'use strict';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
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
    const { t } = useI18n();
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
        if (!window.confirm(t('admin.confirmApprove'))) {
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
            setError(t('admin.rejectionReasonRequired'));
            return;
        }

        if (!window.confirm(t('admin.confirmReject'))) {
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
                    <div className="error-message">{t('admin.accessDenied')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-container">
                <h1>{t('admin.dashboard')}</h1>

                {/* Tab Navigation */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                    >
                        {t('admin.registrationManagement')}
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('progress')}
                    >
                        {t('admin.progressOverview')}
                    </button>
                </div>

                {/* Registration Management Tab */}
                {activeTab === 'registrations' && (
                    <>
                        <h2>{t('admin.registrationManagement')}</h2>

                {/* Status Filter */}
                <div className="status-filter">
                    <label htmlFor="statusFilter">{t('admin.filterByStatus')}</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">{t('admin.all')}</option>
                        <option value="pending">{t('admin.pending')}</option>
                        <option value="approved">{t('admin.approved')}</option>
                        <option value="rejected">{t('admin.rejected')}</option>
                    </select>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Loading State */}
                {loading && <div className="loading">{t('admin.loadingRegistrations')}</div>}

                {/* Registrations List */}
                {!loading && registrations.length > 0 && (
                    <div className="registrations-list">
                        {registrations.map((registration) => (
                            <div key={registration.id} className="registration-card">
                                <div className="registration-header">
                                    <div className="registration-email">{registration.email}</div>
                                    <div className={`registration-status status-${registration.registrationStatus || 'pending'}`}>
                                        {(registration.registrationStatus || 'pending').toUpperCase()}
                                    </div>
                                </div>
                                <div className="registration-details">
                                    <strong>{t('admin.registrationDetails')}</strong>
                                    <p>{registration.registrationDetails}</p>
                                </div>
                                {registration.rejectionReason && (
                                    <div className="rejection-reason">
                                        <strong>{t('admin.rejectionReason')}</strong>
                                        <p>{registration.rejectionReason}</p>
                                    </div>
                                )}
                                <div className="registration-meta">
                                    <small>
                                        {t('admin.registered')} {new Date(registration.createdAt).toLocaleString()}
                                    </small>
                                </div>
                                {(!registration.registrationStatus || registration.registrationStatus === 'pending') && (
                                    <div className="registration-actions">
                                        <button
                                            onClick={() => handleApprove(registration.id)}
                                            disabled={loading}
                                            className="approve-button"
                                        >
                                            {t('admin.approve')}
                                        </button>
                                        <button
                                            onClick={() => setRejectingUserId(registration.id)}
                                            disabled={loading}
                                            className="reject-button"
                                        >
                                            {t('admin.reject')}
                                        </button>
                                    </div>
                                )}
                                {rejectingUserId === registration.id && (
                                    <div className="rejection-form">
                                        <label htmlFor="rejectionReason">{t('admin.rejectionReasonLabel')}</label>
                                        <textarea
                                            id="rejectionReason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder={t('admin.rejectionReasonPlaceholder')}
                                            rows="3"
                                        />
                                        <div className="rejection-form-actions">
                                            <button
                                                onClick={() => handleReject(registration.id)}
                                                disabled={loading || !rejectionReason.trim()}
                                                className="confirm-reject-button"
                                            >
                                                {t('admin.confirmRejection')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRejectingUserId(null);
                                                    setRejectionReason('');
                                                }}
                                                disabled={loading}
                                                className="cancel-button"
                                            >
                                                {t('admin.cancel')}
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
                            {statusFilter === 'pending'
                                ? t('admin.noPendingRegistrations')
                                : statusFilter === 'approved'
                                ? t('admin.noApprovedRegistrations')
                                : statusFilter === 'rejected'
                                ? t('admin.noRejectedRegistrations')
                                : t('admin.noRegistrations')}
                        </p>
                    </div>
                )}
                    </>
                )}

                {/* Progress Overview Tab */}
                {activeTab === 'progress' && (
                    <>
                        <h2>{t('admin.progressOverview')}</h2>
                        
                        {/* User Selection Dropdown */}
                        <div className="user-filter">
                            <label htmlFor="userSelect">{t('admin.filterByUser')}</label>
                            <select
                                id="userSelect"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="user-select"
                            >
                                <option value="">{t('admin.allUsers')}</option>
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
                            <div className="loading">{t('admin.loadingProgress')}</div>
                        ) : (
                            <div className="progress-overview">
                                {files.length === 0 ? (
                                    <div className="no-progress">
                                        <p>{t('admin.noProgress')}</p>
                                    </div>
                                ) : (
                                    <div className="progress-table-container">
                                        <table className="progress-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('admin.document')}</th>
                                                    <th>{t('admin.progress')}</th>
                                                    <th>{t('admin.completedPages')}</th>
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
                                                                    {file.name} - {selectedUser ? t('admin.noProgressForUser', { email: selectedUser }) : t('admin.noProgress')}
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
                                                                    {completedCount} {t('admin.pages')} {completedCount !== 1 ? '' : ''} {t('admin.completed')}
                                                                    {progress && progress.completedPages.length > 0 && (
                                                                        <div className="completed-pages-list">
                                                                            {t('admin.pages')}: {progress.completedPages.join(', ')}
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

