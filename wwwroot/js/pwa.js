// PWA functionality for DriveWise
(function() {
    'use strict';

    let deferredPrompt;

    // Check if app is running in standalone mode
    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.matchMedia('(display-mode: fullscreen)').matches ||
               window.navigator.standalone === true;
    }

    // Handle PWA install prompt (capture but don't show UI)
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt triggered');
        
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        
        // Save the event for later use (browser can still show its own install UI)
        deferredPrompt = e;
        
        console.log('[PWA] Install prompt available - browser will handle installation UI');
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('PWA successfully installed');
        deferredPrompt = null;
        
        if (window.Toast) {
            window.Toast.success('DriveWise sikeresen telepítve!');
        }
        
        // Optional: Save installation status
        if (window.StorageManager) {
            window.StorageManager.set('pwa-installed', 'true');
        }
    });

    // Handle display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
        if (e.matches) {
            console.log('App is now running in standalone mode');
        }
    });

    // Initialize PWA features when DOM is ready
    function initPWA() {
        console.log('[PWA] Initializing PWA features');
        
        // Check if already installed
        if (isStandalone()) {
            console.log('[PWA] App is running in standalone mode');
        }

        // Add beforeunload handler for standalone mode
        if (isStandalone()) {
            window.addEventListener('beforeunload', (e) => {
                // Optional: Add warning when closing standalone app
                // e.preventDefault();
                // return e.returnValue = "Biztosan be szeretn�d z�rni a DriveWise alkalmaz�st?";
            });
        }

        // Handle keyboard shortcuts in standalone mode
        if (isStandalone()) {
            document.addEventListener('keydown', (e) => {
                // Ctrl+R or F5 to refresh
                if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
                    e.preventDefault();
                    window.location.reload();
                }
                
                // Escape to close modals (enhanced for PWA)
                if (e.key === 'Escape') {
                    // Let existing modal handlers take care of this
                }
            });
        }

        // Add orientation change handling
        window.addEventListener('orientationchange', () => {
            // Small delay to ensure proper rendering after orientation change
            setTimeout(() => {
                if (window.map && window.map.invalidateSize) {
                    window.map.invalidateSize();
                }
            }, 300);
        });

        // Add network status indicators
        function updateNetworkStatus() {
            const isOnline = navigator.onLine;
            document.body.classList.toggle('app-offline', !isOnline);
            
            if (!isOnline) {
                console.log('[PWA] App is offline - limited functionality');
                if (window.Toast) {
                    window.Toast.warning('Offline mód - korlátozott funkcionalitás');
                }
            } else {
                console.log('[PWA] App is online');
                if (window.Toast && document.body.classList.contains('app-offline')) {
                    window.Toast.success('Kapcsolat helyreállt');
                }
            }
        }

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus(); // Initial check
    }

    // Public API (minimal - no install button functions)
    window.PWA = {
        isStandalone: isStandalone
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();