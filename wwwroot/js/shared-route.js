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
        if (window.Toast) {
            window.Toast.info('Megosztott útvonal betöltése...');
        }
        
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
                        
                        if (window.Toast) {
                            window.Toast.success('Megosztott útvonal betöltve!');
                        }
                        
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
                if (window.Toast) {
                    window.Toast.error('Nem sikerült betölteni a megosztott útvonalat');
                }
                
                // Remove invalid route parameter from URL
                const url = new URL(window.location);
                url.searchParams.delete('route');
                window.history.replaceState({}, document.title, url.toString());
            });
    }
    
    // Export for global access
    window.SharedRouteHandler = {
        loadSharedRoute: loadSharedRoute
    };
    
    console.log('[shared-route] SharedRouteHandler globálisan elérhet?');
    
})();
