'use strict';

import { createContext, useContext, useState, useEffect } from 'react';
import { t, setLanguage, getLanguage } from '../i18n/i18n';

/**
 * I18n Context for managing translations
 * @typedef {Object} I18nContextType
 * @property {Function} t - Translation function
 * @property {Function} setLanguage - Function to change language
 * @property {string} language - Current language code
 */

const I18nContext = createContext(null);

/**
 * I18nProvider component that provides translation context to children
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} I18nProvider component
 */
export function I18nProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        // Get language from localStorage or default to 'ro'
        return localStorage.getItem('language') || 'ro';
    });

    /**
     * Changes the current language
     * @param {string} lang - Language code (e.g., 'ro', 'en')
     */
    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        setLanguageState(lang);
    };

    // Initialize language on mount
    useEffect(() => {
        setLanguage(language);
    }, [language]);

    const value = {
        t,
        setLanguage: changeLanguage,
        language,
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Custom hook to use I18nContext
 * @returns {I18nContextType} I18n context value
 * @throws {Error} If used outside I18nProvider
 */
export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

