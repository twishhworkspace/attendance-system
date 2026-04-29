import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const useAutoLogout = (timeoutMs = 60000) => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const lastActivityRef = useRef(Date.now());
    const intervalRef = useRef(null);

    useEffect(() => {
        // Only apply to employees
        if (!user || user.role !== 'EMPLOYEE') return;

        // Ensure we start fresh when mounted
        lastActivityRef.current = Date.now();

        const checkInactivity = () => {
            if (Date.now() - lastActivityRef.current >= timeoutMs) {
                logout();
                showToast("Session expired due to inactivity. Please log in again.", "info");
            }
        };

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkInactivity();
            }
        };

        // Check every 5 seconds (Handles active app inactivity)
        intervalRef.current = setInterval(checkInactivity, 5000);

        // Listen for user interactions to reset the activity clock
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove'];
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });
        
        // Listen for when the app comes out of the background
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, logout, showToast, timeoutMs]);
};
