'use strict';

import { useState, useEffect, useRef } from 'react';
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
    const [navVisible, setNavVisible] = useState(true);
    const navRef = useRef(null);
    const touchStartY = useRef(null);
    const lastScrollY = useRef(0);
    const hideTimerRef = useRef(null);

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

    /**
     * Handles touch start for swipe down gesture
     * @param {TouchEvent} e - Touch event
     */
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    /**
     * Handles touch move for swipe down gesture
     * @param {TouchEvent} e - Touch event
     */
    const handleTouchMove = (e) => {
        if (touchStartY.current === null) return;
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY.current;
        
        // Swipe down from top (deltaY > 0 and starting near top of screen)
        if (deltaY > 50 && touchStartY.current < 100 && window.innerWidth <= 767) {
            setNavVisible(true);
            // Restart timer when nav becomes visible via swipe
            clearHideTimer();
            hideTimerRef.current = setTimeout(() => {
                setNavVisible(false);
            }, 4000);
        }
    };

    /**
     * Handles touch end
     */
    const handleTouchEnd = () => {
        touchStartY.current = null;
    };

    /**
     * Clears the hide timer
     */
    const clearHideTimer = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    };

    /**
     * Starts the hide timer (10 seconds)
     */
    const startHideTimer = () => {
        clearHideTimer();
        if (window.innerWidth <= 767) {
            hideTimerRef.current = setTimeout(() => {
                setNavVisible(false);
            }, 4000); // 4 seconds
        }
    };

    /**
     * Handles scroll to hide/show navigation on mobile
     */
    useEffect(() => {
        if (window.innerWidth > 767) {
            setNavVisible(true);
            return;
        }

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show nav when scrolling up or at top, and restart timer
            if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
                if (!navVisible) {
                    setNavVisible(true);
                }
                startHideTimer(); // Restart timer when nav becomes visible
            } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                // Don't hide immediately on scroll down, let timer handle it
            }
            
            lastScrollY.current = currentScrollY;
        };

        // Start timer when nav becomes visible initially
        if (navVisible) {
            startHideTimer();
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            clearHideTimer();
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [navVisible]);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
    
    return (
        <nav className={`main-navigation ${!navVisible && isMobile ? 'nav-hidden' : ''}`} ref={navRef}>
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

