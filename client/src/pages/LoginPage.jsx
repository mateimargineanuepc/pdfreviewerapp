'use strict';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import './LoginPage.css';

/**
 * LoginPage component for user authentication
 * @returns {JSX.Element} LoginPage component
 */
function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    /**
     * Handles form submission
     * @param {React.FormEvent} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate input
        if (!email || !password) {
            setError(t('auth.email') + ' și ' + t('auth.password').toLowerCase() + ' sunt obligatorii');
            setLoading(false);
            return;
        }

        // Attempt login
        const result = await login(email, password);

        if (result.success) {
            // Redirect to home or PDF viewer
            navigate('/');
        } else {
            setError(result.error || 'Autentificare eșuată. Te rugăm să verifici datele de autentificare.');
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>{t('app.title')}</h1>
                <h2>{t('auth.login')}</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="email">{t('auth.email')}:</label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            placeholder={t('auth.email')}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">{t('auth.password')}:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder={t('auth.password')}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? t('auth.loggingIn') : t('auth.loginButton')}
                    </button>
                    <div className="register-link">
                        <p>
                            {t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;

