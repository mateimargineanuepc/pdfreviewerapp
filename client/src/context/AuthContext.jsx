'use strict';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api-services/api';

/**
 * Authentication Context for managing user authentication state
 * @typedef {Object} AuthContextType
 * @property {Object|null} user - Current user object
 * @property {string|null} token - JWT token
 * @property {boolean} loading - Loading state
 * @property {Function} login - Login function
 * @property {Function} logout - Logout function
 * @property {Function} register - Register function
 */

const AuthContext = createContext(null);

/**
 * AuthProvider component that provides authentication context to children
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} AuthProvider component
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Initialize auth state from localStorage on mount
     */
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    /**
     * Login function
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response
     */
    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', {
                email,
                password,
            });

            if (response.data.success && response.data.data) {
                const { user: userData, token: authToken } = response.data.data;

                // Store token and user in localStorage
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(userData));

                // Update state
                setToken(authToken);
                setUser(userData);

                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Login failed' };
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.error?.message || error.message || 'Login failed';
            return { success: false, error: errorMessage };
        }
    };

    /**
     * Register function
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} registrationDetails - Registration details for admin approval
     * @param {string} firstName - User first name
     * @param {string} lastName - User last name
     * @returns {Promise<Object>} Registration response
     */
    const register = async (email, password, registrationDetails, firstName, lastName) => {
        try {
            const response = await api.post('/api/auth/register', {
                email,
                password,
                registrationDetails,
                firstName,
                lastName,
            });

            if (response.data.success && response.data.data) {
                const { user: userData, token: authToken, requiresApproval } = response.data.data;

                // Only store token and user if account is approved (not pending)
                if (authToken && !requiresApproval) {
                    localStorage.setItem('token', authToken);
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update state
                    setToken(authToken);
                    setUser(userData);
                }

                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: 'Registration failed' };
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.error?.message || error.message || 'Registration failed';
            return { success: false, error: errorMessage };
        }
    };

    /**
     * Logout function
     * Clears token and user data from localStorage and state
     */
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    /**
     * Inactivity timer - logs out user after 45 minutes of inactivity
     * Tracks: mouse movements, clicks, keyboard input, scroll, touch events
     */
    useEffect(() => {
        // Only set up inactivity timer if user is authenticated
        if (!token || !user) {
            return;
        }

        const INACTIVITY_TIMEOUT = 45 * 60 * 1000; // 45 minutes in milliseconds
        let inactivityTimer = null;

        /**
         * Resets the inactivity timer
         */
        const resetInactivityTimer = () => {
            // Clear existing timer
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }

            // Set new timer
            inactivityTimer = setTimeout(() => {
                // Logout user after inactivity timeout
                console.log('User inactive for 45 minutes. Logging out...');
                logout();
                // Redirect to login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }, INACTIVITY_TIMEOUT);
        };

        /**
         * Event handlers for user activity
         */
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'keydown',
        ];

        // Set up event listeners for user activity
        activityEvents.forEach((event) => {
            document.addEventListener(event, resetInactivityTimer, true);
        });

        // Initialize timer on mount
        resetInactivityTimer();

        // Cleanup function
        return () => {
            // Clear timer
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
            // Remove event listeners
            activityEvents.forEach((event) => {
                document.removeEventListener(event, resetInactivityTimer, true);
            });
        };
    }, [token, user, logout]);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        register,
        isAuthenticated: !!token && !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use AuthContext
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

