'use strict';

import roTranslations from './ro.json';

/**
 * Available languages
 * @type {Object<string, Object>}
 */
const translations = {
    ro: roTranslations,
};

/**
 * Current language (default: Romanian)
 * @type {string}
 */
let currentLanguage = 'ro';

/**
 * Sets the current language
 * @param {string} lang - Language code (e.g., 'ro', 'en')
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
    }
}

/**
 * Gets the current language
 * @returns {string} Current language code
 */
export function getLanguage() {
    return currentLanguage;
}

/**
 * Gets a translation by key path
 * Supports nested keys with dot notation (e.g., 'app.title')
 * Supports placeholders with {{variable}} syntax
 * @param {string} key - Translation key (supports dot notation)
 * @param {Object} [params] - Parameters to replace in translation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
    const translation = getTranslation(key);
    
    if (!translation) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
    }

    // Replace placeholders
    return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
    });
}

/**
 * Gets a translation by key path from current language
 * @param {string} key - Translation key (supports dot notation)
 * @returns {string|null} Translation or null if not found
 */
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return null;
        }
    }

    return typeof value === 'string' ? value : null;
}

/**
 * Translation hook for React components
 * Returns translation function
 * @returns {Function} Translation function (key, params) => string
 */
export function useTranslation() {
    return { t, setLanguage, getLanguage };
}

export default { t, setLanguage, getLanguage, useTranslation };

