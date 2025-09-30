// Initialize map when DOM is ready to ensure container size is correct
document.addEventListener('DOMContentLoaded', function () {
    console.log('[map] DOM loaded, initializing map...');
    
    // Default to a Europe-wide view (no specific city) so users see the continent on load
    var map = L.map('map', {
        zoomControl: false // Disable default zoom controls
    }).setView([52.0, 10.0], 5); // Europe center, slightly closer (zoom +1)
    
    console.log('[map] Leaflet map created');
    
    // Make map globally available for search functionality
    window.map = map;

    // Define light and dark tile layers
    var lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    // Current active layer - start with null to force initial load
    var currentLayer = null;

    // Function to switch map theme
    function switchMapTheme(theme) {
        console.log('[map] Switching to theme:', theme);
        
        // Check if we're already using the correct theme layer
        let targetLayer = theme === 'dark' ? darkLayer : lightLayer;
        
        if (currentLayer === targetLayer && map.hasLayer(currentLayer)) {
            console.log('[map] Already using correct theme layer, skipping switch');
            return;
        }
        
        // Remove current layer
        if (currentLayer && map.hasLayer(currentLayer)) {
            map.removeLayer(currentLayer);
        }
        
        // Add new layer based on theme
        currentLayer = targetLayer;
        currentLayer.addTo(map);
        
        console.log('[map] Theme switched to:', theme);
    }

    // Listen for theme changes
    window.addEventListener('mapThemeChanged', function(event) {
        if (event.detail) {
            try {
                // Handle both object and string details
                let themeData = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
                if (themeData.theme) {
                    switchMapTheme(themeData.theme);
                }
            } catch (e) {
                console.warn('[map] Failed to parse map theme change event', e);
            }
        }
    });

    // Apply initial theme based on current document theme or default to light
    var initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    console.log('[map] Applying initial theme:', initialTheme);
    switchMapTheme(initialTheme);

    // Variable to store current position marker
    var currentPositionMarker = null;

    // Variables for long-press detection
    var longPressTimer = null;
    var longPressPosition = null;
    var isLongPressing = false;
    var longPressThreshold = 800; // ms
    var moveThreshold = 10; // pixels
    var touchStartTime = null; // Track touch start time
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); // Detect mobile

    // Check if geolocation is supported and get user's location
    if (navigator.geolocation) {
        console.log('Geolocation is supported, requesting position...');
        
        // Try to get cached position first
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    // Success - user allowed location access
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    console.log('Location received:', lat, lng);
                    
                    // Center map on user's location with closer zoom
                    map.setView([lat, lng], 13);
                    console.log('Map centered on user location');
                    
                    // Create custom current position marker
                    currentPositionMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'current-position-marker',
                            html: '<div class="current-position-icon"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(map);
                    console.log('Current position marker added to map');
                    
                    // Update NavigationManager with current position
                    if (window.NavigationManager) {
                        window.NavigationManager.updateUserPosition(lat, lng);
                    }
                    
                    // Emit position update event
                    window.dispatchEvent(new CustomEvent('userLocationUpdate', {
                        detail: JSON.stringify({ lat: lat, lng: lng })
                    }));
                },
                function(error) {
                    console.log('GPS Geolocation failed:', error.message, 'Code:', error.code);
                    // Try IP-based geolocation as fallback
                    tryIPGeolocation();
                },
                {
                    enableHighAccuracy: false, // Start with less strict
                    timeout: 30000, // Much longer timeout
                    maximumAge: 60000 // 1 minute cache
                }
            );
        }
    } else {
        console.log('Geolocation is not supported by this browser');
        // Try IP-based geolocation
        tryIPGeolocation();
    }

    // IP-based geolocation fallback
    function tryIPGeolocation() {
        console.log('Trying IP-based geolocation...');
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data.latitude && data.longitude) {
                    var lat = data.latitude;
                    var lng = data.longitude;
                    console.log('IP-based location received:', lat, lng, 'City:', data.city);
                    
                    // Center map on IP-based location
                    map.setView([lat, lng], 11); // Slightly zoomed out since it's less precise
                    
                    // Create marker with different style for IP-based location
                    currentPositionMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'current-position-marker ip-location',
                            html: '<div class="current-position-icon ip-based"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(map);
                    
                    console.log('IP-based position marker added to map');
                } else {
                    console.log('IP-based geolocation also failed');
                }
            })
            .catch(err => {
                console.log('IP-based geolocation error:', err);
            });
    }

    // Long-press functionality for location queries - improved for mobile
    function startLongPress(e) {
        var position = e.latlng || (e.originalEvent && L.latLng(e.originalEvent.latlng));
        if (!position) {
            console.log('[map] No position found in long press event');
            return;
        }
        
        console.log('[map] Starting long press at:', position.lat, position.lng);
        
        longPressPosition = position;
        isLongPressing = false;
        touchStartTime = Date.now();
        
        // Cancel any existing timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
        
        longPressTimer = setTimeout(function() {
            // Double check that we're still in the same position and enough time has passed
            if (longPressPosition && Date.now() - touchStartTime >= longPressThreshold) {
                isLongPressing = true;
                console.log('[map] Long press confirmed after', Date.now() - touchStartTime, 'ms');
                handleLongPress(longPressPosition);
            } else {
                console.log('[map] Long press validation failed');
            }
        }, longPressThreshold);
        
        console.log('[map] Long press timer set for', longPressThreshold, 'ms');
    }

    function cancelLongPress() {
        console.log('[map] Canceling long press timer - had timer:', !!longPressTimer, 'was long pressing:', isLongPressing, 'is mobile:', isMobile);
        
        // Only cancel the timer, don't clear mobile tap data yet
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        // Only clear position data for desktop, mobile handles it in touchend
        if (!isMobile) {
            longPressPosition = null;
            touchStartTime = null;
            isLongPressing = false;
        }
    }

    function handleLongPress(position) {
        console.log('Long press detected at:', position.lat, position.lng);
        
        // Add visual feedback - temporary marker
        var longPressMarker = L.marker([position.lat, position.lng], {
            icon: L.divIcon({
                className: 'long-press-marker',
                html: '<div class="long-press-icon loading"></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        
        // Query location data
        queryLocationData(position.lat, position.lng).then(function(data) {
            // Update marker to show success
            longPressMarker.setIcon(L.divIcon({
                className: 'long-press-marker',
                html: '<div class="long-press-icon success"></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }))
            
            // Show location info popup
            showLocationInfo(data, position, longPressMarker);
        }).catch(function(error) {
            console.error('Error querying location data:', error);
            
            // Update marker to show error
            longPressMarker.setIcon(L.divIcon({
                className: 'long-press-marker',
                html: '<div class="long-press-icon error"></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }));
            
            // Show error popup
            longPressMarker.bindPopup('Hiba a helyszín adatainak lekérdezésekor').openPopup();
            
            // Remove marker after a delay
            setTimeout(function() {
                map.removeLayer(longPressMarker);
            }, 3000);
        });
    }

    // Add event listeners to map for long-press
    map.on('mousedown', function(e) {
        if (e.originalEvent.button === 0) { // Left mouse button
            startLongPress(e);
        }
    });

    map.on('mouseup', cancelLongPress);
    map.on('mousemove', function(e) {
        if (longPressTimer && longPressPosition) {
            var distance = map.distance(longPressPosition, e.latlng);
            if (distance > moveThreshold) {
                cancelLongPress();
            }
        }
    });

    // Touch events for mobile - simple tap for location query
    map.on('touchstart', function(e) {
        if (e.originalEvent.touches.length === 1) { // Single touch
            console.log('[map] Touch start detected - isMobile:', isMobile);
            
            if (isMobile) {
                // On mobile, just store the position and time for tap detection
                var position = e.latlng;
                if (position) {
                    longPressPosition = position;
                    touchStartTime = Date.now();
                    console.log('[map] Mobile tap start at:', position.lat, position.lng, 'time:', touchStartTime);
                } else {
                    console.log('[map] No position found in touch event');
                }
            } else {
                // On desktop/non-mobile, use long press
                console.log('[map] Desktop detected, using long press');
                startLongPress(e);
            }
        } else {
            console.log('[map] Multi-touch detected, ignoring');
        }
    });

    map.on('touchend', function(e) {
        console.log('[map] Touch end - was long pressing:', isLongPressing, 'is mobile:', isMobile);
        
        if (isMobile && longPressPosition && touchStartTime) {
            var touchDuration = Date.now() - touchStartTime;
            console.log('[map] Mobile touch duration:', touchDuration, 'ms');
            
            // On mobile, if it's a quick tap (less than 300ms), treat it as location query
            if (touchDuration < 300) {
                console.log('[map] Mobile tap detected, querying location');
                handleLongPress(longPressPosition);
            }
            
            // Clear mobile tap data immediately after processing
            longPressPosition = null;
            touchStartTime = null;
        }
        
        // Only prevent default if we actually detected a long press
        if (isLongPressing) {
            e.originalEvent.preventDefault();
        }
        
        // Cancel any remaining long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        isLongPressing = false;
    });
    
    map.on('touchcancel', function(e) {
        console.log('[map] Touch cancel');
        cancelLongPress();
    });
    
    map.on('touchmove', function(e) {
        if (longPressPosition && e.originalEvent.touches.length === 1) {
            var touch = e.originalEvent.touches[0];
            var touchLatLng = map.containerPointToLatLng([touch.clientX, touch.clientY]);
            var distance = map.distance(longPressPosition, touchLatLng);
            if (distance > moveThreshold) {
                console.log('[map] Touch moved too far, canceling');
                cancelLongPress();
            }
        }
    });

    // Add a simple click handler for mobile as backup
    map.on('click', function(e) {
        console.log('[map] Click event detected - isMobile:', isMobile);
        
        if (isMobile) {
            console.log('[map] Mobile click at:', e.latlng.lat, e.latlng.lng);
            // Small delay to avoid conflicts with touch events
            setTimeout(function() {
                handleLongPress(e.latlng);
            }, 50);
        }
    });

    // Add debug logging for map interaction
    var mapContainer = document.getElementById('map');
    if (mapContainer) {
        console.log('[map] Map container found, setting up basic protection');
        
        // Only prevent context menu, allow other interactions
        mapContainer.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        console.log('[map] Context menu prevention added to map container');
    }

    // If map is in a container with dynamic size, call invalidateSize after a short delay
    setTimeout(function () { map.invalidateSize(); }, 200);

    // Recalculate size on window resize / orientation change (mobile)
    function safeInvalidate() {
        try { map.invalidateSize(); } catch (e) { /* ignore */ }
    }
    window.addEventListener('resize', function () { setTimeout(safeInvalidate, 150); });
    window.addEventListener('orientationchange', function () { setTimeout(safeInvalidate, 300); });

    // Simple button wiring (placeholders) — user can replace with real actions
    var vehiclesBtn = document.getElementById('vehiclesBtn');
    var planBtn = document.getElementById('planBtn');
    var settingsBtn = document.getElementById('settingsBtn');

    // Dock button handlers
    [vehiclesBtn, planBtn, settingsBtn].forEach(function (btn) {
        if (!btn) return;
        btn.addEventListener('click', function (ev) {
            if (!this.classList.contains('nav-btn')) uiRipple(this, ev);
            setActive(this);
            // Placeholder actions removed - ModalManager handles showing panels/cards.
        });
    });
    
    // Location data query function
    function queryLocationData(lat, lng) {
        return new Promise(function(resolve, reject) {
            // Use our local API for location details
            var detailsUrl = `/api/location/details?lat=${lat}&lon=${lng}`;
            
            fetch(detailsUrl)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Location details API response was not ok');
                    }
                    return response.json();
                })
                .then(function(result) {
                    // Convert our API response to the expected format
                    var locationData = formatLocationData(result, lat, lng, result.elevation);
                    resolve(locationData);
                })
                .catch(function(error) {
                    reject(error);
                });
        });
    }

    // Format location data for display
    function formatLocationData(apiData, lat, lng, elevation) {
        var formatted = {
            coordinates: {
                lat: lat,
                lng: lng,
                formatted: lat.toFixed(6) + ', ' + lng.toFixed(6)
            },
            elevation: elevation,
            address: {},
            details: {}
        };

        if (apiData.address) {
            var addr = apiData.address;
            formatted.address = {
                display_name: apiData.displayName || 'Ismeretlen helyszín',
                house_number: addr.houseNumber || '',
                road: addr.road || '',
                neighbourhood: addr.neighbourhood || '',
                city: addr.city || '',
                postcode: addr.postcode || '',
                state: addr.state || '',
                country: addr.country || ''
            };
        } else {
            formatted.address = {
                display_name: apiData.displayName || 'Ismeretlen helyszín'
            };
        }

        return formatted;
    }

    // Show location info popup
    function showLocationInfo(locationData, position, marker) {
        var popupContent = createLocationPopupContent(locationData);
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'location-info-popup'
        }).openPopup();

        // Auto-remove marker after 10 seconds if popup is closed
        marker.on('popupclose', function() {
            setTimeout(function() {
                if (map.hasLayer(marker)) {
                    map.removeLayer(marker);
                }
            }, 10000);
        });
    }

    // Create popup content HTML
    function createLocationPopupContent(data) {
        var html = '<div class="location-info">';
        html += '<div class="location-info-header">';
        html += '<h4 class="location-title">📍 Helyszín információ</h4>';
        html += '</div>';

        html += '<div class="location-info-content">';
        
        // Address information
        if (data.address && data.address.display_name) {
            html += '<div class="location-section">';
            html += '<strong>Cím:</strong><br>';
            html += '<span class="address-text">' + escapeHtml(data.address.display_name) + '</span>';
            html += '</div>';
        }

        // Coordinates
        html += '<div class="location-section">';
        html += '<strong>Koordináták:</strong><br>';
        html += '<code class="coordinates">' + data.coordinates.formatted + '</code>';
        html += '</div>';

        // Elevation information
        if (data.elevation !== null && data.elevation !== undefined) {
            html += '<div class="location-section">';
            html += '<strong>Magasság:</strong><br>';
            html += '<span class="elevation-text">' + Math.round(data.elevation) + ' méter</span>';
            html += '</div>';
        }

        html += '</div>';
        
        // Navigation actions with proper UTF-8 encoding
        html += '<div class="location-actions">';
        html += '<button type="button" class="navigate-btn" onclick="handleNavigation(' + data.coordinates.lat + ', ' + data.coordinates.lng + ', \'' + escapeHtml(data.address?.display_name || 'Kiválasztott helyszín') + '\')">';
        html += '<i class="bi bi-signpost-2 btn-icon"></i> Navigálás ide';
        html += '</button>';
        html += '</div>';
        
        html += '</div>';

        return html;
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // Navigation handler function
    window.handleNavigation = function(lat, lng, locationName) {
        console.log('[map] Navigation requested to:', lat, lng, locationName);
        
        // Close all popups and remove long-press markers
        map.eachLayer(function(layer) {
            if (layer._popup && layer._popup.isOpen()) {
                layer.closePopup();
            }
            // Remove long-press markers
            if (layer.options && layer.options.icon && 
                layer.options.icon.options && 
                layer.options.icon.options.className === 'long-press-marker') {
                setTimeout(function() {
                    if (map.hasLayer(layer)) {
                        map.removeLayer(layer);
                    }
                }, 500); // Small delay to let user see the navigation started
            }
        });
        
        if (window.NavigationManager) {
            window.NavigationManager.navigateToLocation(lat, lng, locationName)
                .then(function() {
                    console.log('[map] Navigation started successfully');
                })
                .catch(function(error) {
                    console.error('[map] Navigation failed:', error);
                });
        } else {
            console.error('[map] NavigationManager not available');
            alert('A navigációs szolgáltatás nem érhető el. Kérjük, frissítse az oldalt.');
        }
    };

    // Ripple helper
    function uiRipple(el, ev) {
        var rect = el.getBoundingClientRect();
        var clientX = (ev && ev.clientX) || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || (rect.left + rect.width / 2);
        var clientY = (ev && ev.clientY) || (ev.touches && ev.touches[0] && ev.touches[0].clientY) || (rect.top + rect.height / 2);
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = (clientX - rect.left - Math.max(rect.width, rect.height)/2) + 'px';
        ripple.style.top = (clientY - rect.top - Math.max(rect.width, rect.height)/2) + 'px';
        ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
        el.style.position = el.style.position || 'relative';
        el.appendChild(ripple);
        setTimeout(function () { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 700);
    }

    function setActive(el) {
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        el.classList.add('active');
    }
    

    
    // Debug function for long press testing
    window.testLongPress = function() {
        console.log('[map] Testing long press manually');
        var testPosition = map.getCenter();
        handleLongPress(testPosition);
    };
    
    // Debug function to check long press state
    window.debugLongPress = function() {
        console.log('=== INTERACTION DEBUG ===');
        console.log('isMobile:', isMobile);
        console.log('longPressTimer:', !!longPressTimer);
        console.log('longPressPosition:', longPressPosition);
        console.log('isLongPressing:', isLongPressing);
        console.log('touchStartTime:', touchStartTime);
        console.log('longPressThreshold:', longPressThreshold);
        console.log('moveThreshold:', moveThreshold);
        console.log('========================');
    };
    
    console.log('[map] Long press debug functions available: testLongPress(), debugLongPress()');
});