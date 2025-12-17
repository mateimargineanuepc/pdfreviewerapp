'use strict';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import './RegisterPage.css';

/**
 * RegisterPage component for user registration
 * @returns {JSX.Element} RegisterPage component
 */
function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registrationDetails, setRegistrationDetails] = useState('');
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        registrationDetails: '',
        general: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    /**
     * Validates form fields and returns errors object
     * @returns {Object} Object with field errors
     */
    const validateForm = () => {
        const newErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            registrationDetails: '',
            general: '',
        };

        // Validate email
        if (!email || email.trim().length === 0) {
            newErrors.email = t('registration.emailRequired');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = t('registration.emailInvalid');
            }
        }

        // Validate password
        if (!password || password.length === 0) {
            newErrors.password = t('registration.passwordRequired');
        } else if (password.length < 6) {
            newErrors.password = t('registration.passwordTooShort');
        }

        // Validate confirm password
        if (!confirmPassword || confirmPassword.length === 0) {
            newErrors.confirmPassword = t('registration.confirmPasswordRequired');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('registration.passwordsDoNotMatch');
        }

        // Validate registration details
        if (!registrationDetails || registrationDetails.trim().length === 0) {
            newErrors.registrationDetails = t('registration.registrationDetailsRequired');
        } else if (registrationDetails.trim().length < 10) {
            newErrors.registrationDetails = t('registration.registrationDetailsTooShort');
        }

        return newErrors;
    };

    /**
     * Handles form submission
     * @param {React.FormEvent} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        const validationErrors = validateForm();
        setErrors(validationErrors);

        // Check if there are any validation errors
        const hasErrors = Object.values(validationErrors).some((error) => error !== '');
        if (hasErrors) {
            return;
        }

        setLoading(true);
        setSuccess(false);

        // Attempt registration
        const result = await register(email, password, registrationDetails);

        if (result.success) {
            // Check if approval is required
            if (result.data?.requiresApproval) {
                setSuccess(true);
                setErrors({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    registrationDetails: '',
                    general: '',
                });
            } else {
                // Auto-approved (shouldn't happen for regular users)
                navigate('/');
            }
        } else {
            // Handle backend validation errors
            const errorMessage = result.error || t('registration.registrationFailed');
            
            // Try to parse specific field errors from backend
            if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                setErrors((prev) => ({
                    ...prev,
                    email: errorMessage,
                    general: '',
                }));
            } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
                setErrors((prev) => ({
                    ...prev,
                    password: errorMessage,
                    general: '',
                }));
            } else if (errorMessage.includes('registration details') || errorMessage.includes('Registration details')) {
                setErrors((prev) => ({
                    ...prev,
                    registrationDetails: errorMessage,
                    general: '',
                }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    general: errorMessage,
                }));
            }
        }

        setLoading(false);
    };

    /**
     * Handles field blur to validate on the fly
     * @param {string} fieldName - Name of the field to validate
     */
    const handleBlur = (fieldName) => {
        const validationErrors = validateForm();
        setErrors((prev) => ({
            ...prev,
            [fieldName]: validationErrors[fieldName],
        }));
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h1>{t('app.name')}</h1>
                <h2>{t('registration.title')}</h2>
                <form onSubmit={handleSubmit} className="register-form">
                    {errors.general && <div className="error-message">{errors.general}</div>}
                    <div className="form-group">
                        <label htmlFor="email">
                            {t('auth.email')} <span className="required">{t('registration.required')}</span>:
                        </label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) {
                                    setErrors((prev) => ({ ...prev, email: '' }));
                                }
                            }}
                            onBlur={() => handleBlur('email')}
                            required
                            disabled={loading}
                            placeholder={t('auth.email')}
                            autoComplete="email"
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <div className="field-error">{errors.email}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">
                            {t('auth.password')} <span className="required">{t('registration.required')}</span>:
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) {
                                    setErrors((prev) => ({ ...prev, password: '' }));
                                }
                                // Clear confirm password error if passwords now match
                                if (e.target.value === confirmPassword && errors.confirmPassword) {
                                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                }
                            }}
                            onBlur={() => handleBlur('password')}
                            required
                            disabled={loading}
                            placeholder={t('auth.password')}
                            autoComplete="new-password"
                            minLength={6}
                            className={errors.password ? 'error' : ''}
                        />
                        {errors.password && <div className="field-error">{errors.password}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            {t('auth.confirmPassword')} <span className="required">{t('registration.required')}</span>:
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) {
                                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                }
                            }}
                            onBlur={() => handleBlur('confirmPassword')}
                            required
                            disabled={loading}
                            placeholder={t('auth.confirmPassword')}
                            autoComplete="new-password"
                            minLength={6}
                            className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="registrationDetails">
                            {t('registration.registrationDetails')} <span className="required">{t('registration.required')}</span>:
                        </label>
                        <textarea
                            id="registrationDetails"
                            value={registrationDetails}
                            onChange={(e) => {
                                setRegistrationDetails(e.target.value);
                                if (errors.registrationDetails) {
                                    setErrors((prev) => ({ ...prev, registrationDetails: '' }));
                                }
                            }}
                            onBlur={() => handleBlur('registrationDetails')}
                            required
                            disabled={loading}
                            placeholder={t('registration.registrationDetailsPlaceholder')}
                            rows="5"
                            minLength={10}
                            className={`registration-details-textarea ${errors.registrationDetails ? 'error' : ''}`}
                        />
                        {errors.registrationDetails && (
                            <div className="field-error">{errors.registrationDetails}</div>
                        )}
                        <small className="form-hint">
                            {t('registration.registrationDetailsHint')}
                        </small>
                    </div>
                    {success && (
                        <div className="success-message">
                            <p>
                                <strong>{t('registration.successTitle')}</strong>
                            </p>
                            <p>
                                {t('registration.successMessage')}
                            </p>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading || success || Object.values(errors).some((error) => error !== '')} 
                        className="submit-button"
                    >
                        {loading ? t('auth.submittingRequest') : t('auth.registerButton')}
                    </button>
                    <div className="login-link">
                        <p>
                            {t('auth.hasAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;

