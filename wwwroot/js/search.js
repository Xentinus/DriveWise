// Search functionality for location search
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('locationSearch');
    var clearButton = document.getElementById('clearSearch');
    var searchResults = document.getElementById('searchResults');
    var searchInputGroup = document.querySelector('.search-input-group');
    var unifiedWidget = document.querySelector('.unified-top-widget');
    var searchTimeout;
    var currentSearchMarker = null;
    var selectedResultIndex = -1;
    
    // Get map instance from global scope
    var map = window.map;
    
    // Wait for map to be initialized
    function waitForMap() {
        return new Promise(function(resolve) {
            if (window.map) {
                resolve(window.map);
            } else {
                // Check every 100ms for map initialization
                var checkInterval = setInterval(function() {
                    if (window.map) {
                        clearInterval(checkInterval);
                        resolve(window.map);
                    }
                }, 100);
            }
        });
    }
    
    // Initialize search functionality
    waitForMap().then(function(mapInstance) {
        map = mapInstance;
        console.log('Search functionality initialized with map');
    });
    
    // Search input event listeners
    searchInput.addEventListener('input', function() {
        var query = this.value.trim();
        
        if (query.length === 0) {
            hideSearchResults();
            hideClearButton();
            return;
        }
        
        showClearButton();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search requests
        searchTimeout = setTimeout(function() {
            performSearch(query);
        }, 300);
    });
    
    // Add focus/blur handlers for mobile layout optimization
    searchInput.addEventListener('focus', function() {
        // Add search-focused class to unified widget
        var unifiedWidget = document.querySelector('.unified-top-widget');
        if (unifiedWidget) {
            unifiedWidget.classList.add('search-focused');
        }
        
        // Temporarily minimize route card if it's visible and not minimized
        if (window.RouteCard && window.RouteCard.isVisible() && !window.RouteCard.isMinimized()) {
            window.RouteCard.minimize();
            // Set a flag to restore it later
            searchInput.dataset.shouldRestoreRoute = 'true';
        }
    });
    
    searchInput.addEventListener('blur', function() {
        // Small delay to allow clicks on search results
        setTimeout(() => {
            var unifiedWidget = document.querySelector('.unified-top-widget');
            if (unifiedWidget) {
                unifiedWidget.classList.remove('search-focused');
            }
            
            // Restore route card if we minimized it
            if (searchInput.dataset.shouldRestoreRoute === 'true') {
                if (window.RouteCard && window.RouteCard.isVisible()) {
                    window.RouteCard.restore();
                }
                delete searchInput.dataset.shouldRestoreRoute;
            }
        }, 150);
    });
    
    // Clear button functionality
    clearButton.addEventListener('click', function() {
        clearSearch();
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        var results = searchResults.querySelectorAll('.search-result-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedResultIndex = Math.min(selectedResultIndex + 1, results.length - 1);
            updateSelectedResult(results);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedResultIndex = Math.max(selectedResultIndex - 1, -1);
            updateSelectedResult(results);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
                selectSearchResult(results[selectedResultIndex]);
            }
        } else if (e.key === 'Escape') {
            hideSearchResults();
            searchInput.blur();
        }
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container') && !e.target.closest('.unified-top-widget .search-controls')) {
            hideSearchResults();
        }
    });
    
    function performSearch(query = '') {
        if (!query || query.length < 2) {
            hideSearchResults();
            return;
        }
        
        showSearchLoading();
        
        // Use our local API instead of direct Nominatim calls
        var searchUrl = `/api/location/search?q=${encodeURIComponent(query)}&limit=5`;
        
        fetch(searchUrl)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Search API response was not ok');
            }
            return response.json();
        })
        .then(function(results) {
            // Convert our API response format to match the expected format
            var convertedResults = results.map(function(result) {
                return {
                    display_name: result.displayName,
                    lat: result.latitude.toString(),
                    lon: result.longitude.toString(),
                    address: result.address ? {
                        house_number: result.address.houseNumber,
                        road: result.address.road,
                        neighbourhood: result.address.neighbourhood,
                        city: result.address.city,
                        postcode: result.address.postcode,
                        state: result.address.state,
                        country: result.address.country
                    } : {}
                };
            });
            displaySearchResults(convertedResults);
        })
        .catch(function(error) {
            console.error('Search error:', error);
            showSearchError();
            if (window.Toast) {
                window.Toast.error('Hiba történt a keresés során');
            }
        });
    }
    
    function showSearchLoading() {
        searchResults.innerHTML = '<div class="search-loading"><i class="bi bi-arrow-clockwise spin"></i> Keresés...</div>';
        searchResults.style.display = 'block';
        searchInputGroup.classList.add('results-visible');
        
        // Add show class for animation after a brief delay
        setTimeout(function() {
            searchResults.classList.add('show');
        }, 10);
        selectedResultIndex = -1;
    }
    
    function showSearchError() {
        searchResults.innerHTML = '<div class="search-no-results">Hiba történt a keresés során</div>';
        searchResults.style.display = 'block';
        searchInputGroup.classList.add('results-visible');
        
        setTimeout(function() {
            searchResults.classList.add('show');
        }, 10);
        selectedResultIndex = -1;
    }
    
    function displaySearchResults(results) {
        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Nincs találat</div>';
            searchResults.style.display = 'block';
            searchInputGroup.classList.add('results-visible');
            
            setTimeout(function() {
                searchResults.classList.add('show');
            }, 10);
            selectedResultIndex = -1;
            return;
        }
        
        var html = '';
        results.forEach(function(result, index) {
            var title = getLocationTitle(result);
            var address = getLocationAddress(result);
            
            html += `<div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}" data-index="${index}">`;
            html += `<div class="search-result-title">${escapeHtml(title)}</div>`;
            html += `<div class="search-result-address">${escapeHtml(address)}</div>`;
            html += '</div>';
        });
        
        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
        searchInputGroup.classList.add('results-visible');
        
        // Add show class for container animation
        setTimeout(function() {
            searchResults.classList.add('show');
        }, 10);
        
        selectedResultIndex = -1;
        
        // Add click listeners to results
        searchResults.querySelectorAll('.search-result-item').forEach(function(item) {
            item.addEventListener('click', function() {
                selectSearchResult(this);
            });
        });
    }
    
    function getLocationTitle(result) {
        var address = result.address || {};
        
        // Try to get the most specific location name
        return address.house_number && address.road 
            ? `${address.road} ${address.house_number}`
            : address.road 
            || address.amenity 
            || address.shop 
            || address.tourism 
            || address.building 
            || address.neighbourhood 
            || address.suburb 
            || address.city 
            || address.town 
            || address.village 
            || result.display_name.split(',')[0] 
            || 'Helyszín';
    }
    
    function getLocationAddress(result) {
        var address = result.address || {};
        var parts = [];
        
        if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
        }
        
        if (address.state && address.state !== (address.city || address.town || address.village)) {
            parts.push(address.state);
        }
        
        if (address.country) {
            parts.push(address.country);
        }
        
        return parts.length > 0 ? parts.join(', ') : result.display_name;
    }
    
    function updateSelectedResult(results) {
        results.forEach(function(item, index) {
            if (index === selectedResultIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    function selectSearchResult(resultElement) {
        var lat = parseFloat(resultElement.dataset.lat);
        var lon = parseFloat(resultElement.dataset.lon);
        var title = resultElement.querySelector('.search-result-title').textContent;
        
        if (!map) {
            console.error('Map not available for search result selection');
            return;
        }
        
        // Clear previous search marker
        if (currentSearchMarker) {
            map.removeLayer(currentSearchMarker);
        }
        
        // Center map on selected location
        map.setView([lat, lon], 16);
        
        // Add marker for the selected location
        currentSearchMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'search-result-marker',
                html: '<div class="search-result-icon">📍</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map);
        
        // Query detailed location data and show popup
        queryLocationData(lat, lon).then(function(locationData) {
            showLocationPopup(locationData, currentSearchMarker);
        }).catch(function(error) {
            console.error('Error querying location details:', error);
            // Still show basic popup with title
            currentSearchMarker.bindPopup(`<strong>${escapeHtml(title)}</strong><br>Koordináták: ${lat.toFixed(6)}, ${lon.toFixed(6)}`).openPopup();
        });
        
        // Clear search input after selection
        searchInput.value = '';
        hideSearchResults();
        hideClearButton();
    }
    
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
                    var locationData = {
                        coordinates: {
                            lat: lat,
                            lng: lng,
                            formatted: lat.toFixed(6) + ', ' + lng.toFixed(6)
                        },
                        elevation: result.elevation,
                        address: {
                            display_name: result.displayName || 'Ismeretlen helyszín',
                            house_number: result.address?.houseNumber || '',
                            road: result.address?.road || '',
                            neighbourhood: result.address?.neighbourhood || '',
                            city: result.address?.city || '',
                            postcode: result.address?.postcode || '',
                            state: result.address?.state || '',
                            country: result.address?.country || ''
                        },
                        details: {}
                    };
                    
                    resolve(locationData);
                })
                .catch(function(error) {
                    reject(error);
                });
        });
    }
    
    function formatLocationData(osmData, lat, lng, elevation) {
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

        if (osmData.address) {
            var addr = osmData.address;
            formatted.address = {
                display_name: osmData.display_name || 'Ismeretlen helyszín',
                house_number: addr.house_number || '',
                road: addr.road || addr.street || '',
                neighbourhood: addr.neighbourhood || addr.suburb || '',
                city: addr.city || addr.town || addr.village || '',
                postcode: addr.postcode || '',
                state: addr.state || '',
                country: addr.country || ''
            };
        }

        return formatted;
    }
    
    function showLocationPopup(locationData, marker) {
        var popupContent = createLocationPopupContent(locationData);
        
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'location-info-popup'
        }).openPopup();
    }
    
    function createLocationPopupContent(data) {
        var html = '<div class="location-info">';
        html += '<div class="location-info-header">';
        html += '<h4 class="location-title">📍 Keresett helyszín</h4>';
        html += '</div>';

        html += '<div class="location-info-content">';
        
        if (data.address && data.address.display_name) {
            html += '<div class="location-section">';
            html += '<strong>Cím:</strong><br>';
            html += '<span class="address-text">' + escapeHtml(data.address.display_name) + '</span>';
            html += '</div>';
        }

        html += '<div class="location-section">';
        html += '<strong>Koordináták:</strong><br>';
        html += '<code class="coordinates">' + data.coordinates.formatted + '</code>';
        html += '</div>';

        if (data.elevation !== null && data.elevation !== undefined) {
            html += '<div class="location-section">';
            html += '<strong>Magasság:</strong><br>';
            html += '<span class="elevation-text">' + Math.round(data.elevation) + ' méter</span>';
            html += '</div>';
        }

        html += '</div>';
        
        // Navigation actions with proper UTF-8 encoding
        html += '<div class="location-actions">';
        html += '<button type="button" class="navigate-btn" onclick="handleSearchNavigation(' + data.coordinates.lat + ', ' + data.coordinates.lng + ', \'' + escapeHtml(data.address?.display_name || 'Keresett helyszín') + '\')">';
        html += '<i class="bi bi-signpost-2 btn-icon"></i> Navigálás ide';
        html += '</button>';
        html += '</div>';
        
        html += '</div>';

        return html;
    }
    
    function clearSearch() {
        searchInput.value = '';
        hideSearchResults();
        hideClearButton();
        
        // Remove search marker
        if (currentSearchMarker && map) {
            map.removeLayer(currentSearchMarker);
            currentSearchMarker = null;
        }
        
        // Clear any pending search timeouts
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
    }
    
    function hideSearchResults() {
        searchResults.classList.remove('show');
        searchInputGroup.classList.remove('results-visible');
        // Hide after animation completes
        setTimeout(function() {
            searchResults.style.display = 'none';
        }, 300);
        selectedResultIndex = -1;
    }
    
    function showClearButton() {
        clearButton.style.display = 'block';
    }
    
    function hideClearButton() {
        clearButton.style.display = 'none';
    }
    
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
    
    // Navigation handler function for search results
    window.handleSearchNavigation = function(lat, lng, locationName) {
        console.log('[search] Navigation requested to:', lat, lng, locationName);
        
        // Close the popup and remove search marker
        if (currentSearchMarker) {
            if (currentSearchMarker._popup && currentSearchMarker._popup.isOpen()) {
                currentSearchMarker.closePopup();
            }
            // Remove the search marker after a short delay
            setTimeout(function() {
                if (map.hasLayer(currentSearchMarker)) {
                    map.removeLayer(currentSearchMarker);
                    currentSearchMarker = null;
                }
            }, 500); // Small delay to let user see the navigation started
        }
        
        if (window.NavigationManager) {
            window.NavigationManager.navigateToLocation(lat, lng, locationName)
                .then(function() {
                    console.log('[search] Navigation started successfully');
                    if (window.Toast) {
                        window.Toast.success('Navigáció elindítva');
                    }
                })
                .catch(function(error) {
                    console.error('[search] Navigation failed:', error);
                    if (window.Toast) {
                        window.Toast.error('Navigáció sikertelen');
                    }
                });
        } else {
            console.error('[search] NavigationManager not available');
            if (window.Toast) {
                window.Toast.error('A navigációs szolgáltatás nem érhető el. Kérjük, frissítse az oldalt.');
            }
        }
    };
});