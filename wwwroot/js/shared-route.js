// Shared route handling functionality
(function() {
    'use strict';
    
    // Initialize shared route handling when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[shared-route] Megosztott útvonal kezel? inicializálva');
        
        // Check for route parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const routeParam = urlParams.get('route');
        
        if (routeParam) {
            console.log('[shared-route] Útvonal paraméter találva az URL-ben:', routeParam);
            loadSharedRoute(routeParam);
        }
    });
    
    function loadSharedRoute(shareId) {
        console.log('[shared-route] Megosztott útvonal betöltése:', shareId);
        
        // Show loading state
        showToast('Megosztott útvonal betöltése...', 'info');
        
        // Call API to get shared route data
        fetch(`/api/routing/shared/${encodeURIComponent(shareId)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(routeData => {
                console.log('[shared-route] Megosztott útvonal adatok megérkeztek:', routeData);
                
                // Wait for navigation manager to be ready
                const checkNavigationManager = () => {
                    if (window.NavigationManager && window.NavigationManager.displayRoute) {
                        console.log('[shared-route] Megosztott útvonal megjelenítése a térképen');
                        
                        // Display the route directly using the route data
                        window.NavigationManager.displayRoute(routeData, 'Megosztott útvonal');
                        
                        showToast('Megosztott útvonal betöltve!', 'success');
                        
                        // Remove route parameter from URL without page reload
                        const url = new URL(window.location);
                        url.searchParams.delete('route');
                        window.history.replaceState({}, document.title, url.toString());
                        
                    } else {
                        // Retry in 100ms if NavigationManager is not ready
                        setTimeout(checkNavigationManager, 100);
                    }
                };
                
                // Start checking for NavigationManager
                setTimeout(checkNavigationManager, 100);
            })
            .catch(error => {
                console.error('[shared-route] Megosztott útvonal betöltése sikertelen:', error);
                showToast('Nem sikerült betölteni a megosztott útvonalat', 'error');
                
                // Remove invalid route parameter from URL
                const url = new URL(window.location);
                url.searchParams.delete('route');
                window.history.replaceState({}, document.title, url.toString());
            });
    }
    
    function showToast(message, type = 'info') {
        // Check if RouteCard toast function is available
        if (window.RouteCard && typeof window.RouteCard.showToast === 'function') {
            window.RouteCard.showToast(message, type);
            return;
        }
        
        // Fallback: create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove after 3 seconds (longer for info messages)
        const duration = type === 'info' ? 4000 : 3000;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    // Export for global access
    window.SharedRouteHandler = {
        loadSharedRoute: loadSharedRoute,
        showToast: showToast
    };
    
    console.log('[shared-route] SharedRouteHandler globálisan elérhet?');
    
})();
