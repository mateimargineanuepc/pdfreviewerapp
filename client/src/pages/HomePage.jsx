'use strict';

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './HomePage.css';

/**
 * HomePage component - Main landing page after login
 * @returns {JSX.Element} HomePage component
 */
function HomePage() {
    const { user } = useAuth();

    return (
        <div className="home-page">
            <div className="home-container">
                <h1>Welcome to PDF Review Application</h1>
                {user && (
                    <div className="user-info">
                        <p>Logged in as: <strong>{user.email}</strong></p>
                        <p>Role: <strong>{user.role}</strong></p>
                    </div>
                )}
                <div className="actions">
                    <Link to="/documents" className="viewer-button">
                        Browse Documents
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default HomePage;

