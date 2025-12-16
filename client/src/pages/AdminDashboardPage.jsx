'use strict';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import registrationService from '../api-services/registrationService';
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

    /**
     * Loads registration requests
     */
    useEffect(() => {
        if (user && user.role === 'admin') {
            loadRegistrations();
        }
    }, [user, statusFilter]);

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
                <h1>Admin Dashboard - Registration Management</h1>

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
            </div>
        </div>
    );
}

export default AdminDashboardPage;

