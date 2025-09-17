// Search functionality for location search
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('locationSearch');
    var clearButton = document.getElementById('clearSearch');
    var searchResults = document.getElementById('searchResults');
    var searchInputGroup = document.querySelector('.search-input-group');
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
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
    
    function performSearch(query) {
        if (!query || query.length < 2) {
            hideSearchResults();
            return;
        }
        
        showSearchLoading();
        
        // Use Nominatim API for geocoding
        var nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=HU&addressdetails=1&extratags=1&namedetails=1&accept-language=hu,en`;
        
        fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'DriveWise/1.0'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Search API response was not ok');
            }
            return response.json();
        })
        .then(function(results) {
            displaySearchResults(results);
        })
        .catch(function(error) {
            console.error('Search error:', error);
            showSearchError();
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
            // Use the same location query function as in map.js
            var nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=hu,en`;
            
            var nominatimPromise = fetch(nominatimUrl, {
                headers: {
                    'User-Agent': 'DriveWise/1.0'
                }
            }).then(function(response) {
                if (!response.ok) {
                    throw new Error('Nominatim API response was not ok');
                }
                return response.json();
            });

            var elevationUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
            var elevationPromise = fetch(elevationUrl)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Elevation API response was not ok');
                    }
                    return response.json();
                })
                .catch(function() {
                    return { results: [{ elevation: null }] };
                });

            Promise.all([nominatimPromise, elevationPromise])
                .then(function(results) {
                    var locationData = results[0];
                    var elevationData = results[1];
                    
                    if (locationData.error) {
                        throw new Error(locationData.error);
                    }
                    
                    var elevation = null;
                    if (elevationData && elevationData.results && elevationData.results[0]) {
                        elevation = elevationData.results[0].elevation;
                    }
                    
                    resolve(formatLocationData(locationData, lat, lng, elevation));
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
});