// Initialize map when DOM is ready to ensure container size is correct
document.addEventListener('DOMContentLoaded', function () {
    // Default to a Europe-wide view (no specific city) so users see the continent on load
    var map = L.map('map').setView([52.0, 10.0], 5); // Europe center, slightly closer (zoom +1)

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
                    
                    // Add popup to current position marker
                    currentPositionMarker.bindPopup('Az aktuális pozíciód');
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
                    
                    currentPositionMarker.bindPopup('Hozzávetőleges pozíció (' + data.city + ')');
                    console.log('IP-based position marker added to map');
                } else {
                    console.log('IP-based geolocation also failed');
                }
            })
            .catch(err => {
                console.log('IP-based geolocation error:', err);
            });
    }

    // Add a manual location button as fallback
    var locationButton = L.control({ position: 'topright' });
    locationButton.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.innerHTML = '<button class="location-btn" title="Aktuális pozíció"><i>📍</i></button>';
        div.style.backgroundColor = 'white';
        div.style.border = '2px solid rgba(0,0,0,0.2)';
        div.style.borderRadius = '4px';
        div.style.cursor = 'pointer';
        
        div.onclick = function(){
            console.log('Manual location button clicked');
            if (navigator.geolocation) {
                // Try with very relaxed settings
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        var lat = position.coords.latitude;
                        var lng = position.coords.longitude;
                        console.log('Manual GPS location received:', lat, lng);
                        
                        map.setView([lat, lng], 15);
                        
                        if (currentPositionMarker) {
                            map.removeLayer(currentPositionMarker);
                        }
                        
                        currentPositionMarker = L.marker([lat, lng], {
                            icon: L.divIcon({
                                className: 'current-position-marker',
                                html: '<div class="current-position-icon"></div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })
                        }).addTo(map);
                        
                        currentPositionMarker.bindPopup('Pontos GPS pozíció').openPopup();
                    },
                    function(error) {
                        console.log('Manual GPS failed, trying IP geolocation:', error.message);
                        // If GPS fails, try IP geolocation
                        fetch('https://ipapi.co/json/')
                            .then(response => response.json())
                            .then(data => {
                                if (data.latitude && data.longitude) {
                                    var lat = data.latitude;
                                    var lng = data.longitude;
                                    console.log('Manual IP location received:', lat, lng);
                                    
                                    map.setView([lat, lng], 12);
                                    
                                    if (currentPositionMarker) {
                                        map.removeLayer(currentPositionMarker);
                                    }
                                    
                                    currentPositionMarker = L.marker([lat, lng], {
                                        icon: L.divIcon({
                                            className: 'current-position-marker ip-location',
                                            html: '<div class="current-position-icon ip-based"></div>',
                                            iconSize: [20, 20],
                                            iconAnchor: [10, 10]
                                        })
                                    }).addTo(map);
                                    
                                    currentPositionMarker.bindPopup('Hozzávetőleges pozíció (' + data.city + ')').openPopup();
                                } else {
                                    alert('Nem sikerült meghatározni a pozíciót');
                                }
                            })
                            .catch(err => {
                                alert('Nem sikerült meghatározni a pozíciót: ' + err.message);
                            });
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 30000, // 30 seconds
                        maximumAge: 60000 // 1 minute
                    }
                );
            } else {
                alert('A böngésző nem támogatja a geolokációt');
            }
        }
        return div;
    };
    locationButton.addTo(map);

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
});