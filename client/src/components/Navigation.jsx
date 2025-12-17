'use strict';

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import './Navigation.css';

/**
 * Navigation component with responsive design
 * Shows full nav bar on desktop, hamburger menu on mobile
 * @returns {JSX.Element} Navigation component
 */
function Navigation() {
    const { user, logout } = useAuth();
    const { t } = useI18n();
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
                        {t('navigation.documents')}
                    </Link>
                    {user && user.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`nav-link ${isActiveRoute('/admin') ? 'active' : ''}`}
                        >
                            {t('navigation.adminDashboard')}
                        </Link>
                    )}
                    {user && (
                        <div className="nav-user-menu">
                            <Link
                                to="/profile"
                                className="nav-user-email-link"
                            >
                                {user.email}
                            </Link>
                            <button onClick={handleLogout} className="nav-logout-button">
                                {t('navigation.logout')}
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
                    {t('navigation.documents')}
                </Link>
                {user && user.role === 'admin' && (
                    <Link
                        to="/admin"
                        className={`nav-link ${isActiveRoute('/admin') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        {t('navigation.adminDashboard')}
                    </Link>
                )}
                {user && (
                    <div className="nav-user-info">
                        <Link
                            to="/profile"
                            className="nav-user-email-link"
                            onClick={closeMenu}
                        >
                            {user.email}
                        </Link>
                        <div className="nav-user-role">{t('auth.role')}: {user.role}</div>
                        <button onClick={handleLogout} className="nav-logout-button">
                            {t('navigation.logout')}
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

