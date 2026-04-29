import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const useAutoLogout = (timeoutMs = 600000) => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const timerRef = useRef(null);

    useEffect(() => {
        // Only apply to employees
        if (!user || user.role !== 'EMPLOYEE') return;

        const handleTimeout = () => {
            logout();
            showToast("Session expired due to inactivity. Please log in again.", "info");
        };

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(handleTimeout, timeoutMs);
        };

        const handleActivity = () => {
            resetTimer();
        };

        // Initialize timer
        resetTimer();

        // Listen for user interactions
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, logout, showToast, timeoutMs]);
};
