import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            console.log('✅ [PWA] beforeinstallprompt event fired!');
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            console.log('🎉 [PWA] App successfully installed!');
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        console.log('[PWA] Environment Audit - Standalone:', isStandalone);
        console.log('[PWA] Navigator protocol:', navigator.serviceWorker ? 'SW_SUPPORTED' : 'SW_NOT_SUPPORTED');
        
        if (isStandalone) {
            console.log('ℹ️ [PWA] App is already running in standalone mode.');
            setIsInstallable(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) {
            console.warn('[PWA] No deferred prompt available.');
            return;
        }

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User Response: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, installPWA };
};
