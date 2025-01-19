import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DeviceDetection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);

    const checkDevice = () => {
        // More comprehensive mobile detection
        const isMobileDevice = (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(navigator.userAgent) ||
            window.innerWidth <= 800 ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );

        console.log('Device Detection Results:');
        console.log('Current Path:', location.pathname);
        console.log('User Agent:', navigator.userAgent);
        console.log('Window Width:', window.innerWidth);
        console.log('Touch Enabled:', 'ontouchstart' in window);
        console.log('Max Touch Points:', navigator.maxTouchPoints);
        console.log('Is Mobile Device:', isMobileDevice);

        setIsMobile(isMobileDevice);

        // Only redirect if we're not already on the restriction page
        if (isMobileDevice && location.pathname !== '/mobile-restriction') {
            console.log('Redirecting to mobile restriction page...');
            navigate('/mobile-restriction', { replace: true });
            return true;
        }
        return false;
    };

    useEffect(() => {
        const isMobileDevice = checkDevice();
        
        if (!isMobileDevice) {
            const handleResize = () => {
                checkDevice();
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [location.pathname]);

    // Force check on mount and pathname change
    useEffect(() => {
        checkDevice();
    }, [location.pathname]);

    return null;
};

export default DeviceDetection;
