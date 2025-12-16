'use strict';

import { useState, useEffect, useRef } from 'react';
import healthService from '../api-services/healthService';
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
    const isMountedRef = useRef(true);
    const retryIntervalRef = useRef(null);

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
            if (!isMountedRef.current) return;

            try {
                const isAvailable = await healthService.checkBackendHealth(3000); // 3 second timeout
                
                if (isMountedRef.current) {
                    if (isAvailable) {
                        setBackendAvailable(true);
                        setChecking(false);
                        if (retryIntervalRef.current) {
                            clearInterval(retryIntervalRef.current);
                            retryIntervalRef.current = null;
                        }
                    } else {
                        // Backend not available, will retry on next interval
                        setRetryCount((prev) => prev + 1);
                    }
                }
            } catch (error) {
                // Error checking health, will retry
                if (isMountedRef.current) {
                    setRetryCount((prev) => prev + 1);
                }
            }
        };

        // Initial check
        checkHealth();

        // Set up retry interval (1000ms as requested)
        retryIntervalRef.current = setInterval(() => {
            if (isMountedRef.current && !backendAvailable) {
                checkHealth();
            }
        }, 1000);

        // Cleanup
        return () => {
            isMountedRef.current = false;
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
        };
    }, [backendAvailable]); // Include backendAvailable to stop retries when available

    // Show loading spinner while checking backend
    if (!backendAvailable || checking) {
        return (
            <div className="backend-health-check">
                <div className="health-check-container">
                    <div className="health-check-spinner"></div>
                    <h2>Connecting to server...</h2>
                    <p>Please wait while we check if the server is available.</p>
                    {retryCount > 0 && (
                        <p className="retry-info">Retrying... (Attempt {retryCount})</p>
                    )}
                </div>
            </div>
        );
    }

    // Backend is available, render children
    return <>{children}</>;
}

export default BackendHealthCheck;

