// Initialize map when DOM is ready to ensure container size is correct
document.addEventListener('DOMContentLoaded', function () {
    // Default to a Europe-wide view (no specific city) so users see the continent on load
    var map = L.map('map', {
        zoomControl: false // Disable default zoom controls
    }).setView([52.0, 10.0], 5); // Europe center, slightly closer (zoom +1)
    
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

    // Current active layer
    var currentLayer = lightLayer;

    // Function to switch map theme
    function switchMapTheme(theme) {
        console.log('[map] Switching to theme:', theme);
        
        // Remove current layer
        if (map.hasLayer(currentLayer)) {
            map.removeLayer(currentLayer);
        }
        
        // Add new layer based on theme
        if (theme === 'dark') {
            currentLayer = darkLayer;
        } else {
            currentLayer = lightLayer;
        }
        
        currentLayer.addTo(map);
    }

    // Listen for theme changes
    window.addEventListener('mapThemeChanged', function(event) {
        if (event.detail && event.detail.theme) {
            switchMapTheme(event.detail.theme);
        }
    });

    // Apply initial theme based on current document theme or default to light
    var initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    switchMapTheme(initialTheme);

    // Variable to store current position marker
    var currentPositionMarker = null;

    // Variables for long-press detection
    var longPressTimer = null;
    var longPressPosition = null;
    var isLongPressing = false;
    var longPressThreshold = 800; // ms
    var moveThreshold = 10; // pixels

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

    // Long-press functionality for location queries
    function startLongPress(e) {
        var position = e.latlng || (e.originalEvent && L.latLng(e.originalEvent.latlng));
        if (!position) return;
        
        longPressPosition = position;
        isLongPressing = false;
        
        longPressTimer = setTimeout(function() {
            isLongPressing = true;
            handleLongPress(longPressPosition);
        }, longPressThreshold);
    }

    function cancelLongPress() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        longPressPosition = null;
        isLongPressing = false;
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
            }));
            
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

    // Touch events for mobile
    map.on('touchstart', function(e) {
        if (e.originalEvent.touches.length === 1) { // Single touch
            startLongPress(e);
        }
    });

    map.on('touchend', cancelLongPress);
    map.on('touchcancel', cancelLongPress);
    map.on('touchmove', function(e) {
        if (longPressTimer && longPressPosition && e.originalEvent.touches.length === 1) {
            var touch = e.originalEvent.touches[0];
            var touchLatLng = map.containerPointToLatLng([touch.clientX, touch.clientY]);
            var distance = map.distance(longPressPosition, touchLatLng);
            if (distance > moveThreshold) {
                cancelLongPress();
            }
        }
    });

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
    
    // Custom zoom controls functionality
    function setupCustomZoomControls() {
        var zoomInBtn = document.getElementById('zoomIn');
        var zoomOutBtn = document.getElementById('zoomOut');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', function() {
                map.zoomIn();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', function() {
                map.zoomOut();
            });
        }
        
        // Update button states based on zoom level
        function updateZoomButtonStates() {
            var currentZoom = map.getZoom();
            var maxZoom = map.getMaxZoom();
            var minZoom = map.getMinZoom();
            
            if (zoomInBtn) {
                zoomInBtn.disabled = (currentZoom >= maxZoom);
                zoomInBtn.style.opacity = (currentZoom >= maxZoom) ? '0.5' : '1';
            }
            
            if (zoomOutBtn) {
                zoomOutBtn.disabled = (currentZoom <= minZoom);
                zoomOutBtn.style.opacity = (currentZoom <= minZoom) ? '0.5' : '1';
            }
        }
        
        // Listen to zoom changes
        map.on('zoomend', updateZoomButtonStates);
        
        // Initial state
        updateZoomButtonStates();
    }
    
    // Initialize custom zoom controls
    setupCustomZoomControls();
});