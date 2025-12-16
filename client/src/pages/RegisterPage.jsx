'use strict';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
            newErrors.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        // Validate password
        if (!password || password.length === 0) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        // Validate confirm password
        if (!confirmPassword || confirmPassword.length === 0) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Validate registration details
        if (!registrationDetails || registrationDetails.trim().length === 0) {
            newErrors.registrationDetails = 'Registration details are required';
        } else if (registrationDetails.trim().length < 10) {
            newErrors.registrationDetails = 'Please provide more details (at least 10 characters)';
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
            const errorMessage = result.error || 'Registration failed. Please try again.';
            
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
                <h1>PDF Review Application</h1>
                <h2>Create Account</h2>
                <form onSubmit={handleSubmit} className="register-form">
                    {errors.general && <div className="error-message">{errors.general}</div>}
                    <div className="form-group">
                        <label htmlFor="email">
                            Email <span className="required">*</span>:
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
                            placeholder="Enter your email"
                            autoComplete="email"
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <div className="field-error">{errors.email}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">
                            Password <span className="required">*</span>:
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
                            placeholder="Enter your password (min 6 characters)"
                            autoComplete="new-password"
                            minLength={6}
                            className={errors.password ? 'error' : ''}
                        />
                        {errors.password && <div className="field-error">{errors.password}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password <span className="required">*</span>:
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
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            minLength={6}
                            className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="registrationDetails">
                            Registration Details <span className="required">*</span>:
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
                            placeholder="Please tell us: How did you hear about this website? What is your real name? Any other relevant information that would help us approve your registration."
                            rows="5"
                            minLength={10}
                            className={`registration-details-textarea ${errors.registrationDetails ? 'error' : ''}`}
                        />
                        {errors.registrationDetails && (
                            <div className="field-error">{errors.registrationDetails}</div>
                        )}
                        <small className="form-hint">
                            Please provide details about how you found this website, your real name, and any other
                            information that would help us approve your registration.
                        </small>
                    </div>
                    {success && (
                        <div className="success-message">
                            <p>
                                <strong>Registration request submitted successfully!</strong>
                            </p>
                            <p>
                                Your account is pending admin approval. You will be able to log in once an administrator
                                approves your registration.
                            </p>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading || success || Object.values(errors).some((error) => error !== '')} 
                        className="submit-button"
                    >
                        {loading ? 'Submitting Request...' : 'Submit Registration Request'}
                    </button>
                    <div className="login-link">
                        <p>
                            Already have an account? <Link to="/login">Login here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;

