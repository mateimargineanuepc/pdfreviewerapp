'use strict';

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

/**
 * Navigation component with responsive design
 * Shows full nav bar on desktop, hamburger menu on mobile
 * @returns {JSX.Element} Navigation component
 */
function Navigation() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    /**
     * Handles logout
     */
    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    /**
     * Closes mobile menu
     */
    const closeMenu = () => {
        setMenuOpen(false);
    };

    /**
     * Toggles mobile menu
     */
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    /**
     * Checks if a route is active
     * @param {string} path - Route path to check
     * @returns {boolean} True if route is active
     */
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="main-navigation">
            <div className="nav-container">
                {/* Logo/Brand */}
                <Link to="/" className="nav-brand" onClick={closeMenu}>
                    <h2>Anastasimatar Stupcanu - Corectare</h2>
                </Link>

                {/* Desktop Navigation */}
                <div className="nav-desktop">
                    <Link
                        to="/documents"
                        className={`nav-link ${isActiveRoute('/documents') ? 'active' : ''}`}
                    >
                        Documents
                    </Link>
                    {user && user.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`nav-link ${isActiveRoute('/admin') ? 'active' : ''}`}
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    {user && (
                        <div className="nav-user-menu">
                            <span className="nav-user-email">{user.email}</span>
                            <button onClick={handleLogout} className="nav-logout-button">
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className={`mobile-menu-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
                <Link
                    to="/documents"
                    className={`nav-link ${isActiveRoute('/documents') ? 'active' : ''}`}
                    onClick={closeMenu}
                >
                    Documents
                </Link>
                {user && user.role === 'admin' && (
                    <Link
                        to="/admin"
                        className={`nav-link ${isActiveRoute('/admin') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Admin Dashboard
                    </Link>
                )}
                {user && (
                    <div className="nav-user-info">
                        <div className="nav-user-email">{user.email}</div>
                        <div className="nav-user-role">Role: {user.role}</div>
                        <button onClick={handleLogout} className="nav-logout-button">
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Menu Overlay */}
            {menuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
        </nav>
    );
}

export default Navigation;

