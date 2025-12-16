'use strict';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        // Attempt login
        const result = await login(email, password);

        if (result.success) {
            // Redirect to home or PDF viewer
            navigate('/');
        } else {
            setError(result.error || 'Login failed. Please check your credentials.');
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>PDF Review Application</h1>
                <h2>Login</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="email">Email or Username:</label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="Enter your email or username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="submit-button">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    <div className="register-link">
                        <p>
                            Don't have an account? <Link to="/register">Register here</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;

