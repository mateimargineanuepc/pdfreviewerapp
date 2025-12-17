'use strict';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import profileService from '../api-services/profileService';
import './ProfilePage.css';

/**
 * ProfilePage component for viewing and managing user profile
 * @returns {JSX.Element} ProfilePage component
 */
function ProfilePage() {
    const { user } = useAuth();
    const { t } = useI18n();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Password change form state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    /**
     * Loads user profile on mount
     */
    useEffect(() => {
        loadProfile();
    }, []);

    /**
     * Loads user profile from API
     */
    const loadProfile = async () => {
        setLoading(true);
        setError('');
        const result = await profileService.getProfile();
        if (result.success) {
            setProfile(result.data.user);
        } else {
            setError(result.error || 'Failed to load profile');
        }
        setLoading(false);
    };

    /**
     * Validates password change form
     * @returns {boolean} True if form is valid
     */
    const validatePasswordForm = () => {
        const newErrors = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        };

        let isValid = true;

        if (!oldPassword || oldPassword.length === 0) {
            newErrors.oldPassword = t('profile.oldPasswordRequired');
            isValid = false;
        }

        if (!newPassword || newPassword.length === 0) {
            newErrors.newPassword = t('profile.newPasswordRequired');
            isValid = false;
        } else if (newPassword.length < 6) {
            newErrors.newPassword = t('profile.newPasswordTooShort');
            isValid = false;
        }

        if (!confirmPassword || confirmPassword.length === 0) {
            newErrors.confirmPassword = t('profile.confirmPasswordRequired');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = t('profile.passwordsDoNotMatch');
            isValid = false;
        }

        if (oldPassword === newPassword) {
            newErrors.newPassword = t('profile.newPasswordMustBeDifferent');
            isValid = false;
        }

        setPasswordErrors(newErrors);
        return isValid;
    };

    /**
     * Handles password change form submission
     * @param {React.FormEvent} e - Form submit event
     */
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!validatePasswordForm()) {
            return;
        }

        setChangingPassword(true);
        setError('');

        const result = await profileService.changePassword(oldPassword, newPassword, confirmPassword);
        
        if (result.success) {
            // Show confirmation modal
            setShowConfirmModal(true);
            // Reset form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordErrors({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } else {
            // Handle specific errors
            if (result.error.includes('incorrect') || result.error.includes('Old password')) {
                setPasswordErrors((prev) => ({
                    ...prev,
                    oldPassword: result.error,
                }));
            } else {
                setError(result.error || 'Failed to change password');
            }
        }

        setChangingPassword(false);
    };

    /**
     * Closes confirmation modal
     */
    const closeConfirmModal = () => {
        setShowConfirmModal(false);
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>{t('profile.title')}</h1>

                {/* Profile Information */}
                <div className="profile-section">
                    <h2>{t('profile.personalInformation')}</h2>
                    <div className="profile-info">
                        <div className="info-row">
                            <label>{t('profile.firstName')}:</label>
                            <span>{profile?.firstName || user?.firstName || '-'}</span>
                        </div>
                        <div className="info-row">
                            <label>{t('profile.lastName')}:</label>
                            <span>{profile?.lastName || user?.lastName || '-'}</span>
                        </div>
                        <div className="info-row">
                            <label>{t('profile.email')}:</label>
                            <span>{profile?.email || user?.email || '-'}</span>
                        </div>
                        <div className="info-row">
                            <label>{t('profile.role')}:</label>
                            <span>{profile?.role || user?.role || '-'}</span>
                        </div>
                        <div className="info-row">
                            <label>{t('profile.registrationDetails')}:</label>
                            <div className="registration-details-text">
                                {profile?.registrationDetails || '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Change Form */}
                <div className="profile-section">
                    <h2>{t('profile.changePassword')}</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handlePasswordChange} className="password-change-form">
                        <div className="form-group">
                            <label htmlFor="oldPassword">
                                {t('profile.oldPassword')} <span className="required">*</span>:
                            </label>
                            <input
                                type="password"
                                id="oldPassword"
                                value={oldPassword}
                                onChange={(e) => {
                                    setOldPassword(e.target.value);
                                    if (passwordErrors.oldPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, oldPassword: '' }));
                                    }
                                }}
                                disabled={changingPassword}
                                className={passwordErrors.oldPassword ? 'error' : ''}
                                required
                            />
                            {passwordErrors.oldPassword && (
                                <div className="field-error">{passwordErrors.oldPassword}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">
                                {t('profile.newPassword')} <span className="required">*</span>:
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (passwordErrors.newPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                                    }
                                    // Clear confirm password error if passwords now match
                                    if (e.target.value === confirmPassword && passwordErrors.confirmPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                    }
                                }}
                                disabled={changingPassword}
                                minLength={6}
                                className={passwordErrors.newPassword ? 'error' : ''}
                                required
                            />
                            {passwordErrors.newPassword && (
                                <div className="field-error">{passwordErrors.newPassword}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                {t('profile.confirmPassword')} <span className="required">*</span>:
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (passwordErrors.confirmPassword) {
                                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                    }
                                }}
                                disabled={changingPassword}
                                minLength={6}
                                className={passwordErrors.confirmPassword ? 'error' : ''}
                                required
                            />
                            {passwordErrors.confirmPassword && (
                                <div className="field-error">{passwordErrors.confirmPassword}</div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
                            className="submit-button"
                        >
                            {changingPassword ? t('profile.changing') : t('profile.changePasswordButton')}
                        </button>
                    </form>
                </div>

                {/* Confirmation Modal */}
                {showConfirmModal && (
                    <div className="modal-overlay" onClick={closeConfirmModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{t('profile.passwordChanged')}</h3>
                            <p>{t('profile.passwordChangedMessage')}</p>
                            <button onClick={closeConfirmModal} className="modal-button">
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;

