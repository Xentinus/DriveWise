// PWA functionality for DriveWise
(function() {
    'use strict';

    let deferredPrompt;
    let installButton;

    // Create install button (hidden by default)
    function createInstallButton() {
        if (document.getElementById('pwa-install-btn')) return;

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.className = 'btn btn-primary d-none position-fixed';
        button.style.cssText = `
            bottom: 80px; 
            right: 20px; 
            z-index: 1050;
            border-radius: 25px;
            padding: 10px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        button.innerHTML = '<i class="bi bi-download"></i> Alkalmazás telepítése';
        button.setAttribute('aria-label', 'DriveWise alkalmazás telepítése');
        
        button.addEventListener('click', installApp);
        document.body.appendChild(button);
        
        return button;
    }

    // Show install button
    function showInstallButton() {
        if (!installButton) {
            installButton = createInstallButton();
        }
        installButton.classList.remove('d-none');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installButton) {
                installButton.classList.add('d-none');
            }
        }, 10000);
    }

    // Hide install button
    function hideInstallButton() {
        if (installButton) {
            installButton.classList.add('d-none');
        }
    }

    // Install the PWA
    async function installApp() {
        if (!deferredPrompt) {
            console.log('No install prompt available');
            return;
        }

        hideInstallButton();

        try {
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
                // Show button again after 30 seconds if dismissed
                setTimeout(showInstallButton, 30000);
            }
            
            deferredPrompt = null;
        } catch (error) {
            console.error('Error during app installation:', error);
        }
    }

    // Check if app is running in standalone mode
    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.matchMedia('(display-mode: fullscreen)').matches ||
               window.navigator.standalone === true;
    }

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt triggered');
        
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        
        // Save the event for later use
        deferredPrompt = e;
        
        // Only show install button if not already in standalone mode
        if (!isStandalone()) {
            // Show install button after a short delay
            setTimeout(showInstallButton, 3000);
        }
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        console.log('PWA successfully installed');
        hideInstallButton();
        deferredPrompt = null;
        
        // Optional: Show success message
        if (window.StorageManager) {
            window.StorageManager.set('pwa-installed', 'true');
        }
    });

    // Handle display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
        if (e.matches) {
            console.log('App is now running in standalone mode');
            hideInstallButton();
        }
    });

    // Initialize PWA features when DOM is ready
    function initPWA() {
        console.log('[PWA] Initializing PWA features');
        
        // Check if already installed
        if (isStandalone()) {
            console.log('[PWA] App is running in standalone mode');
            hideInstallButton();
        }

        // Add beforeunload handler for standalone mode
        if (isStandalone()) {
            window.addEventListener('beforeunload', (e) => {
                // Optional: Add warning when closing standalone app
                // e.preventDefault();
                // return e.returnValue = "Biztosan be szeretnéd zárni a DriveWise alkalmazást?";
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
            } else {
                console.log('[PWA] App is online');
            }
        }

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus(); // Initial check
    }

    // Public API
    window.PWA = {
        install: installApp,
        isStandalone: isStandalone,
        showInstallButton: showInstallButton,
        hideInstallButton: hideInstallButton
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPWA);
    } else {
        initPWA();
    }

})();