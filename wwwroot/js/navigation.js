// Navigation and routing functionality
(function() {
    'use strict';
    
    // Global variables for route management
    let currentRoute = null;
    let currentRouteLayer = null;
    let currentUserPosition = null;
    let startMarker = null; // Marker for route start
    let endMarker = null;   // Marker for route end
    
    // Initialize navigation functionality when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[navigation] Navigation functionality initialized');
        
        // Debug: Listen to our own events
        window.addEventListener('routeCalculated', function(event) {
            console.log('[navigation] DEBUG: routeCalculated event detected');
        });
        
        window.addEventListener('routeCleared', function(event) {
            console.log('[navigation] DEBUG: routeCleared event detected');
        });
        
        // Listen for position updates from map
        window.addEventListener('userLocationUpdate', function(event) {
            if (event.detail) {
                try {
                    const locationData = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
                    currentUserPosition = {
                        lat: locationData.lat,
                        lng: locationData.lng
                    };
                    console.log('[navigation] User position updated:', currentUserPosition);
                } catch (e) {
                    console.warn('[navigation] Failed to parse user location update:', e);
                }
            }
        });
        
        // Try to get current position from geolocation API
        getCurrentPosition();
    });
    
    // Function to get current user position
    function getCurrentPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    currentUserPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('[navigation] Current position obtained:', currentUserPosition);
                },
                function(error) {
                    console.log('[navigation] Geolocation failed, trying IP-based fallback');
                    tryIPGeolocation();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            console.log('[navigation] Geolocation not supported, trying IP-based fallback');
            tryIPGeolocation();
        }
    }
    
    // IP-based geolocation fallback
    function tryIPGeolocation() {
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data.latitude && data.longitude) {
                    currentUserPosition = {
                        lat: data.latitude,
                        lng: data.longitude
                    };
                    console.log('[navigation] IP-based position obtained:', currentUserPosition);
                }
            })
            .catch(err => {
                console.warn('[navigation] IP-based geolocation failed:', err);
            });
    }
    
    // Function to navigate to a location
    function navigateToLocation(destinationLat, destinationLng, destinationName = '') {
        console.log('[navigation] Starting navigation to:', destinationLat, destinationLng);
        
        if (!currentUserPosition) {
            console.warn('[navigation] Current position not available');
            showNavigationError('Az aktuális pozíció nem elérhető. Kérjük, engedélyezze a GPS-t.');
            return Promise.reject(new Error('Current position not available'));
        }
        
        if (!window.map) {
            console.error('[navigation] Map not available');
            showNavigationError('A térkép nem elérhető.');
            return Promise.reject(new Error('Map not available'));
        }
        
        // Show loading state
        const button = document.querySelector('.navigate-btn');
        if (button) {
            setButtonLoading(button, true);
        }
        
        // Dispatch route calculation started event to show loading skeleton
        console.log('[navigation] Dispatching routeCalculationStarted event');
        window.dispatchEvent(new CustomEvent('routeCalculationStarted', {
            detail: JSON.stringify({ destination: destinationName })
        }));
        
        // Calculate route using our API
        const selectedVehicle = window.StorageManager ? window.StorageManager.getSelectedVehicle() : null;
        
        let fetchPromise;
        
        if (selectedVehicle) {
            console.log('[navigation] Using selected vehicle for route calculation:', selectedVehicle.name || `${selectedVehicle.brand} ${selectedVehicle.model}`);
            
            // Use POST endpoint with vehicle data
            const routeData = {
                fromLat: currentUserPosition.lat,
                fromLon: currentUserPosition.lng,
                toLat: destinationLat,
                toLon: destinationLng,
                vehicle: selectedVehicle
            };
            
            console.log('[navigation] Sending POST request with data:', JSON.stringify(routeData, null, 2));
            
            fetchPromise = fetch('/api/routing/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(routeData)
            });
        } else {
            console.log('[navigation] No vehicle selected, using default consumption');
            
            // Use GET endpoint (default behavior)
            const routeUrl = `/api/routing/route?fromLat=${currentUserPosition.lat}&fromLon=${currentUserPosition.lng}&toLat=${destinationLat}&toLon=${destinationLng}`;
            fetchPromise = fetch(routeUrl);
        }
        
        return fetchPromise
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Route calculation failed');
                }
                return response.json();
            })
            .then(function(route) {
                console.log('[navigation] Route calculated:', route);
                displayRoute(route, destinationName);
                return route;
            })
            .catch(function(error) {
                console.error('[navigation] Route calculation error:', error);
                showNavigationError('Nem sikerült kiszámítani az útvonalat. Kérjük, próbálja újra.');
                throw error;
            })
            .finally(function() {
                if (button) {
                    setButtonLoading(button, false);
                }
            });
    }
    
    // Function to display route on map
    function displayRoute(route, destinationName = '') {
        if (!window.map || !route.geometry || !route.geometry.coordinates) {
            console.error('[navigation] Invalid route data or map not available');
            return;
        }
        
        // Clear previous route and all markers silently (don't dispatch events)
        if (currentRouteLayer || startMarker || endMarker) {
            console.log('[navigation] Removing previous route components before displaying new route');
            clearAllRouteElements();
        }
        
        // Convert OSRM coordinates to Leaflet format (flip lat/lng)
        const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        // Create route polyline
        currentRouteLayer = L.polyline(latLngs, {
            color: '#007bff',
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(window.map);
        
        // Add start marker (beginning of route) - using current position style with green color
        const startPoint = latLngs[0];
        startMarker = L.marker(startPoint, {
            icon: L.divIcon({
                className: 'current-position-marker route-start-marker',
                html: '<div class="current-position-icon route-start"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(window.map);
        
        // Add end marker (destination) - using current position style with red color
        const endPoint = latLngs[latLngs.length - 1];
        endMarker = L.marker(endPoint, {
            icon: L.divIcon({
                className: 'current-position-marker route-end-marker',
                html: '<div class="current-position-icon route-end"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(window.map);
        
        // Fit map to route bounds (including markers)
        const group = L.featureGroup([currentRouteLayer, startMarker, endMarker]);
        window.map.fitBounds(group.getBounds(), {
            padding: [20, 20]
        });
        
        // Store route data
        currentRoute = route;
        
        // Show route card
        const routeData = {
            destination: destinationName,
            distance: route.distance,
            duration: route.duration,
            fuelConsumption: route.fuelConsumption,
            vehicleUsed: route.vehicleUsed,
            startElevation: route.startElevation,
            endElevation: route.endElevation,
            elevationDifference: route.elevationDifference,
            fuelCost: route.fuelCost,
            fuelPrice: route.fuelPrice,
            fuelType: route.fuelType,
            geometry: route.geometry
        };
        
        console.log('[navigation] Dispatching routeCalculated event with data:', routeData);
        console.log('[navigation] Fuel cost data being sent:', {
            fuelCost: routeData.fuelCost,
            fuelPrice: routeData.fuelPrice,
            fuelType: routeData.fuelType
        });
        
        // Dispatch event to show route card
        window.dispatchEvent(new CustomEvent('routeCalculated', {
            detail: JSON.stringify(routeData)
        }));
        
        console.log('[navigation] Route displayed on map and card shown');
    }
    
    // Function to clear current route
    function clearRoute() {
        console.log('[navigation] Clearing route - currentRouteLayer exists:', !!currentRouteLayer, 'startMarker exists:', !!startMarker, 'endMarker exists:', !!endMarker);
        
        // Use helper function to safely clear all elements
        const clearedCount = clearAllRouteElements();
        
        // Always dispatch the routeCleared event when this function is called intentionally
        console.log('[navigation] Dispatching routeCleared event');
        window.dispatchEvent(new CustomEvent('routeCleared', {
            detail: JSON.stringify({ source: 'navigation-manager', elementsCleared: clearedCount })
        }));
        
        console.log('[navigation] Route completely cleared - all components removed from map');
    }
    
    // Helper function to safely remove all route-related elements from map
    function clearAllRouteElements() {
        const elementsCleared = [];
        
        // Remove route polyline
        if (currentRouteLayer && window.map && window.map.hasLayer(currentRouteLayer)) {
            window.map.removeLayer(currentRouteLayer);
            elementsCleared.push('route polyline');
        }
        currentRouteLayer = null;
        
        // Remove start marker
        if (startMarker && window.map && window.map.hasLayer(startMarker)) {
            window.map.removeLayer(startMarker);
            elementsCleared.push('start marker');
        }
        startMarker = null;
        
        // Remove end marker
        if (endMarker && window.map && window.map.hasLayer(endMarker)) {
            window.map.removeLayer(endMarker);
            elementsCleared.push('end marker');
        }
        endMarker = null;
        
        // Clear route data
        currentRoute = null;
        
        console.log('[navigation] Cleared route elements:', elementsCleared.join(', ') || 'none');
        return elementsCleared.length;
    }
    
    // Function to set button loading state
    function setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            button.innerHTML = '<i class="bi bi-arrow-clockwise btn-icon"></i> Útvonal számítása...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.innerHTML = '<i class="bi bi-signpost-2 btn-icon"></i> Navigálás ide';
        }
    }
    
    // Function to show navigation error
    function showNavigationError(message) {
        // You can customize this to show a nicer error dialog
        alert(message);
    }
    
    // Function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // Remove old popup-related functions since we now use route card
    // Function to update popup with route information - REMOVED
    // Function to create route info HTML - REMOVED
    // Function to format distance
    function formatDistance(meters) {
        if (meters < 1000) {
            return Math.round(meters) + ' m';
        } else {
            return (meters / 1000).toFixed(1) + ' km';
        }
    }
    
    // Function to format duration
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours} óra ${minutes} perc`;
        } else {
            return `${minutes} perc`;
        }
    }
    
    // Export functions to global scope
    window.NavigationManager = {
        navigateToLocation: navigateToLocation,
        displayRoute: displayRoute,
        clearRoute: clearRoute,
        getCurrentPosition: getCurrentPosition,
        updateUserPosition: function(lat, lng) {
            currentUserPosition = { lat: lat, lng: lng };
        },
        centerRoute: function() {
            if (currentRouteLayer && window.map) {
                // Create a group with route and markers for better centering
                const layers = [currentRouteLayer];
                if (startMarker) layers.push(startMarker);
                if (endMarker) layers.push(endMarker);
                
                const group = L.featureGroup(layers);
                window.map.fitBounds(group.getBounds(), {
                    padding: [20, 20]
                });
                console.log('[navigation] Route centered on map');
            }
        },
        // Debug function to check route state
        debugRouteState: function() {
            console.log('=== NAVIGATION DEBUG STATE ===');
            console.log('currentRoute:', !!currentRoute);
            console.log('currentRouteLayer:', !!currentRouteLayer);
            console.log('startMarker:', !!startMarker);
            console.log('endMarker:', !!endMarker);
            console.log('currentUserPosition:', currentUserPosition);
            
            if (window.map) {
                console.log('Route layer on map:', currentRouteLayer ? window.map.hasLayer(currentRouteLayer) : false);
                console.log('Start marker on map:', startMarker ? window.map.hasLayer(startMarker) : false);
                console.log('End marker on map:', endMarker ? window.map.hasLayer(endMarker) : false);
            }
            console.log('=== END DEBUG STATE ===');
        },
        // Force clear function for debugging
        forceClear: function() {
            console.log('[navigation] Force clearing all route elements');
            clearAllRouteElements();
            window.dispatchEvent(new CustomEvent('routeCleared', {
                detail: JSON.stringify({ source: 'navigation-manager-force' })
            }));
        }
    };
    
    console.log('[navigation] NavigationManager available globally');
    
})();