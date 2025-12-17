'use strict';

import { useState, useEffect, useRef } from 'react';
import healthService from '../api-services/healthService';
import { useI18n } from '../context/I18nContext';
import './BackendHealthCheck.css';

/**
 * BackendHealthCheck component
 * Checks if backend is available before allowing app to load
 * Shows loading spinner and retries every 1000ms until backend is up
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render once backend is available
 * @returns {JSX.Element} BackendHealthCheck component
 */
function BackendHealthCheck({ children }) {
    const [backendAvailable, setBackendAvailable] = useState(false);
    const [checking, setChecking] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [showSkipOption, setShowSkipOption] = useState(false);
    const isMountedRef = useRef(true);
    const retryIntervalRef = useRef(null);
    const abortControllerRef = useRef(null);
    const checkingRef = useRef(false); // Prevent concurrent checks
    const MAX_RETRIES = 10; // Maximum retries before showing skip option
    const { t } = useI18n();

    useEffect(() => {
        // Don't start checking if already available
        if (backendAvailable) {
            return;
        }

        isMountedRef.current = true;

        /**
         * Checks backend health and retries if needed
         */
        const checkHealth = async () => {
            // Prevent concurrent checks
            if (checkingRef.current || !isMountedRef.current) {
                return;
            }

            checkingRef.current = true;

            // Cancel any previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new AbortController for this request
            abortControllerRef.current = new AbortController();

            try {
                const isAvailable = await healthService.checkBackendHealth(3000, abortControllerRef.current.signal);
                
                if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
                    if (isAvailable) {
                        setBackendAvailable(true);
                        setChecking(false);
                        if (retryIntervalRef.current) {
                            clearInterval(retryIntervalRef.current);
                            retryIntervalRef.current = null;
                        }
                    } else {
                        // Backend not available, will retry on next interval
                        setRetryCount((prev) => {
                            const newCount = prev + 1;
                            // Show skip option after MAX_RETRIES
                            if (newCount >= MAX_RETRIES) {
                                setShowSkipOption(true);
                            }
                            return newCount;
                        });
                    }
                }
            } catch (error) {
                // Ignore abort errors
                if (error.name === 'AbortError' || error.name === 'CanceledError') {
                    return;
                }
                // Error checking health, will retry
                if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
                    setRetryCount((prev) => {
                        const newCount = prev + 1;
                        // Show skip option after MAX_RETRIES
                        if (newCount >= MAX_RETRIES) {
                            setShowSkipOption(true);
                        }
                        return newCount;
                    });
                }
            } finally {
                checkingRef.current = false;
            }
        };

        // Initial check
        checkHealth();

        // Set up retry interval (1000ms as requested)
        retryIntervalRef.current = setInterval(() => {
            if (isMountedRef.current && !backendAvailable && !checkingRef.current) {
                checkHealth();
            }
        }, 1000);

        // Cleanup
        return () => {
            isMountedRef.current = false;
            checkingRef.current = false;
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []); // Empty dependency array - only run once on mount

    // Show loading spinner while checking backend
    if (!backendAvailable || checking) {
        return (
            <div className="backend-health-check">
                <div className="health-check-container">
                    <div className="health-check-spinner"></div>
                    <h2>{t('pdfViewer.connectingToServer')}</h2>
                    <p>{t('pdfViewer.checkingServer')}</p>
                    {retryCount > 0 && (
                        <p className="retry-info">{t('pdfViewer.retrying', { count: retryCount })}</p>
                    )}
                    {showSkipOption && (
                        <div className="skip-option">
                            <p style={{ marginTop: '20px', color: 'var(--silver-accent)' }}>
                                Nu se poate conecta la server. Dorești să continui oricum?
                            </p>
                            <button
                                onClick={() => {
                                    if (retryIntervalRef.current) {
                                        clearInterval(retryIntervalRef.current);
                                        retryIntervalRef.current = null;
                                    }
                                    if (abortControllerRef.current) {
                                        abortControllerRef.current.abort();
                                        abortControllerRef.current = null;
                                    }
                                    setBackendAvailable(true);
                                    setChecking(false);
                                }}
                                className="skip-button"
                                style={{
                                    marginTop: '15px',
                                    padding: '10px 20px',
                                    backgroundColor: 'var(--bg-gradient-gold)',
                                    color: 'var(--text-dark)',
                                    border: '1px solid var(--border-gold)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                }}
                            >
                                Continuă oricum
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Backend is available, render children
    return <>{children}</>;
}

export default BackendHealthCheck;

