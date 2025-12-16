'use strict';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect device orientation changes
 * @returns {Object} Object containing orientation info and a force update function
 */
export function useOrientation() {
    const [orientation, setOrientation] = useState({
        angle: window.orientation || 0,
        type: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    });

    useEffect(() => {
        const handleOrientationChange = () => {
            // Delay to ensure layout has updated
            setTimeout(() => {
                setOrientation({
                    angle: window.orientation || 0,
                    type: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
                });
            }, 100);
        };

        const handleResize = () => {
            // Also update on resize to catch orientation changes
            setTimeout(() => {
                setOrientation({
                    angle: window.orientation || 0,
                    type: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
                });
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return orientation;
}

