// Plan Card JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize PlanCard functionality when elements are available
    initializePlanCard();
});

// Function to initialize PlanCard - can be called multiple times safely
function initializePlanCard() {
    // Check if elements exist (they might not be loaded yet if modal is not shown)
    const originInput = document.getElementById('originLocation');
    const destinationInput = document.getElementById('destinationLocation');
    const originResults = document.getElementById('originResults');
    const destinationResults = document.getElementById('destinationResults');
    const vehicleSelect = document.getElementById('vehicleSelect');
    const planRouteBtn = document.getElementById('planRouteBtn');
    
    // If elements don't exist, return (modal not loaded yet)
    if (!originInput || !destinationInput || !vehicleSelect || !planRouteBtn) {
        console.log('[PlanCard] Elements not found, waiting for modal to load...');
        return;
    }
    
    console.log('[PlanCard] Elements found, initializing...');
    
    // Store selected locations
    let selectedOrigin = null;
    let selectedDestination = null;
    
    // Search timeout for debouncing
    let searchTimeout = null;
    
    // Initialize functionality
    init();
    
    function init() {
        console.log('[PlanCard] Initializing plan card functionality');
        
        // Check if all required elements exist
        if (!originInput) {
            console.error('[PlanCard] Origin input not found!');
            return;
        }
        if (!destinationInput) {
            console.error('[PlanCard] Destination input not found!');
            return;
        }
        if (!vehicleSelect) {
            console.error('[PlanCard] Vehicle select not found!');
            return;
        }
        if (!planRouteBtn) {
            console.error('[PlanCard] Plan route button not found!');
            return;
        }
        
        console.log('[PlanCard] All required elements found');
        
        // Load available vehicles
        loadVehicles();
        
        // Setup location input event listeners
        setupLocationInputs();
        
        // Setup route planning button
        setupRoutePlanning();
        
        // Update button state
        updatePlanButtonState();
        
        console.log('[PlanCard] Initialization complete');
    }
    
    function loadVehicles() {
        try {
            // Show loading state for vehicle select
            showVehicleSelectLoading();
            
            // Check if StorageManager is available
            if (typeof window.StorageManager === 'undefined') {
                console.warn('[PlanCard] StorageManager not yet available, retrying...');
                setTimeout(loadVehicles, 100);
                return;
            }
            
            const vehicles = StorageManager.getVehicles();
            console.log('[PlanCard] Loaded vehicles:', vehicles);
            
            // Simulate loading delay to show skeleton
            setTimeout(() => {
                // Hide loading state
                hideVehicleSelectLoading();
                
                // Clear existing options (keep default option)
                vehicleSelect.innerHTML = '<option value="">Alapértelmezett jármű használata</option>';
                
                // Add vehicles to select
                vehicles.forEach(vehicle => {
                    const option = document.createElement('option');
                    option.value = vehicle.id;
                    
                    // Format: Name (Brand Model) [License Plate] or Name (Brand Model) if no license plate
                    let displayText = `${vehicle.name} (${vehicle.brand} ${vehicle.model})`;
                    if (vehicle.licensePlate && vehicle.licensePlate.trim() !== '') {
                        displayText += ` [${vehicle.licensePlate}]`;
                    }
                    option.textContent = displayText;
                    
                    if (vehicle.isDefault) {
                        option.selected = true;
                    }
                    
                    vehicleSelect.appendChild(option);
                });
                
                console.log('[PlanCard] Vehicle dropdown populated with', vehicles.length, 'vehicles');
            }, 300); // Short delay to show loading state
        } catch (error) {
            console.error('[PlanCard] Error loading vehicles:', error);
            hideVehicleSelectLoading();
        }
    }
    
    function showVehicleSelectLoading() {
        console.log('[PlanCard] Showing vehicle select loading state');
        const vehicleGroup = document.querySelector('.vehicle-selection-group');
        if (vehicleGroup) {
            vehicleGroup.classList.add('loading');
        }
        
        // Set loading text in select
        vehicleSelect.innerHTML = '<option value="">Járművek betöltése...</option>';
        vehicleSelect.disabled = true;
    }
    
    function hideVehicleSelectLoading() {
        console.log('[PlanCard] Hiding vehicle select loading state');
        const vehicleGroup = document.querySelector('.vehicle-selection-group');
        if (vehicleGroup) {
            vehicleGroup.classList.remove('loading');
        }
        
        vehicleSelect.disabled = false;
    }
    
    function setupLocationInputs() {
        // Origin input
        originInput.addEventListener('input', function() {
            const query = this.value.trim();
            handleLocationInput(query, originResults, 'origin');
        });
        
        originInput.addEventListener('blur', function() {
            // Delay hiding results to allow clicking
            setTimeout(() => hideResults(originResults), 200);
        });
        
        // Destination input
        destinationInput.addEventListener('input', function() {
            const query = this.value.trim();
            handleLocationInput(query, destinationResults, 'destination');
        });
        
        destinationInput.addEventListener('blur', function() {
            // Delay hiding results to allow clicking
            setTimeout(() => hideResults(destinationResults), 200);
        });
        
        // Click outside to close results
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.location-search-container')) {
                hideResults(originResults);
                hideResults(destinationResults);
            }
        });
    }
    
    function handleLocationInput(query, resultsContainer, type) {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length === 0) {
            hideResults(resultsContainer);
            if (type === 'origin') {
                selectedOrigin = null;
            } else {
                selectedDestination = null;
            }
            updatePlanButtonState();
            return;
        }
        
        if (query.length < 3) {
            hideResults(resultsContainer);
            return;
        }
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            searchLocation(query, resultsContainer, type);
        }, 300);
    }
    
    async function searchLocation(query, resultsContainer, type) {
        try {
            console.log(`[PlanCard] Searching for ${type}:`, query);
            
            const response = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            const results = await response.json();
            console.log(`[PlanCard] Search results for ${type}:`, results);
            
            displaySearchResults(results, resultsContainer, type);
        } catch (error) {
            console.error(`[PlanCard] Error searching for ${type}:`, error);
            hideResults(resultsContainer);
        }
    }
    
    function displaySearchResults(results, resultsContainer, type) {
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'location-result-item';
            noResults.innerHTML = '<div class="result-name">Nincs találat</div>';
            resultsContainer.appendChild(noResults);
        } else {
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'location-result-item';
                item.innerHTML = `
                    <div class="result-name">${result.displayName}</div>
                    <div class="result-address">${formatAddress(result.address)}</div>
                `;
                
                item.addEventListener('click', () => {
                    selectLocation(result, type);
                    hideResults(resultsContainer);
                });
                
                resultsContainer.appendChild(item);
            });
        }
        
        showResults(resultsContainer);
    }
    
    function formatAddress(address) {
        if (!address) return '';
        
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.city) parts.push(address.city);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ');
    }
    
    function selectLocation(location, type) {
        console.log(`[PlanCard] Selected ${type}:`, location);
        
        if (type === 'origin') {
            selectedOrigin = location;
            originInput.value = location.displayName;
            console.log('[PlanCard] Origin set to:', selectedOrigin);
        } else {
            selectedDestination = location;
            destinationInput.value = location.displayName;
            console.log('[PlanCard] Destination set to:', selectedDestination);
        }
        
        updatePlanButtonState();
    }
    
    function showResults(resultsContainer) {
        resultsContainer.classList.add('show');
    }
    
    function hideResults(resultsContainer) {
        resultsContainer.classList.remove('show');
    }
    
    function updatePlanButtonState() {
        const hasOrigin = selectedOrigin !== null;
        const hasDestination = selectedDestination !== null;
        
        console.log('[PlanCard] Updating button state - origin:', hasOrigin, 'destination:', hasDestination);
        
        planRouteBtn.disabled = !(hasOrigin && hasDestination);
        
        if (hasOrigin && hasDestination) {
            planRouteBtn.innerHTML = '<i class="bi bi-signpost"></i> Útvonal megtervezése';
            console.log('[PlanCard] Button enabled for route planning');
        } else {
            planRouteBtn.innerHTML = '<i class="bi bi-geo-alt"></i> Válasszon helyszíneket';
            console.log('[PlanCard] Button disabled - waiting for locations');
        }
    }
    
    function setupRoutePlanning() {
        planRouteBtn.addEventListener('click', async function() {
            if (!selectedOrigin || !selectedDestination) {
                return;
            }
            
            await planRoute();
        });
    }
    
    async function planRoute() {
        try {
            console.log('[PlanCard] Planning route...');
            
            // Dispatch route calculation started event
            console.log('[PlanCard] Dispatching routeCalculationStarted event');
            window.dispatchEvent(new CustomEvent('routeCalculationStarted', {
                detail: JSON.stringify({ 
                    origin: selectedOrigin.displayName,
                    destination: selectedDestination.displayName 
                })
            }));
            
            // Show loading state on button
            planRouteBtn.disabled = true;
            planRouteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Tervezés...';
            
            // Get selected vehicle
            const selectedVehicleId = vehicleSelect.value;
            let selectedVehicle = null;
            
            if (selectedVehicleId) {
                const vehicles = StorageManager.getVehicles();
                selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
                console.log('[PlanCard] Using vehicle:', selectedVehicle);
            } else {
                console.log('[PlanCard] Using default vehicle');
            }
            
            // Prepare route request
            const routeRequest = {
                fromLat: selectedOrigin.latitude,
                fromLon: selectedOrigin.longitude,
                toLat: selectedDestination.latitude,
                toLon: selectedDestination.longitude,
                vehicle: selectedVehicle
            };
            
            console.log('[PlanCard] Route request:', routeRequest);
            
            // Call routing API
            const response = await fetch('/api/routing/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(routeRequest)
            });
            
            if (!response.ok) {
                throw new Error(`Route calculation failed: ${response.status}`);
            }
            
            const route = await response.json();
            console.log('[PlanCard] Route calculated:', route);
            
            // Use NavigationManager to display route like "Navigate Here"
            if (window.NavigationManager && window.NavigationManager.displayRoute) {
                // Create destination name from selected destination
                const destinationName = selectedDestination.displayName;
                
                console.log('[PlanCard] Using NavigationManager to display route');
                window.NavigationManager.displayRoute(route, destinationName);
                
                // Close the modal after route is planned
                if (window.ModalManager && window.ModalManager.closeModal) {
                    console.log('[PlanCard] Closing modal after route display');
                    window.ModalManager.closeModal();
                } else {
                    console.warn('[PlanCard] ModalManager.closeModal not available');
                }
            } else {
                console.warn('[PlanCard] NavigationManager not available');
                alert('NavigationManager nem elérhető');
            }
            
        } catch (error) {
            console.error('[PlanCard] Error planning route:', error);
            alert('Hiba történt az útvonal tervezése során. Kérjük, próbálja újra.');
        } finally {
            // Reset button state
            planRouteBtn.disabled = false;
            planRouteBtn.innerHTML = '<i class="bi bi-signpost"></i> Útvonal megtervezése';
        }
    }
    
    console.log('[PlanCard] Plan card functionality initialized');
    
    // Export functions for external use and testing
    window.PlanCard = {
        loadVehicles: loadVehicles,
        showVehicleSelectLoading: showVehicleSelectLoading,
        hideVehicleSelectLoading: hideVehicleSelectLoading,
        refreshVehicles: function() {
            console.log('[PlanCard] Refreshing vehicles with loading state');
            loadVehicles();
        },
        debug: function() {
            console.log('[PlanCard] Debug info:');
            console.log('  Selected origin:', selectedOrigin);
            console.log('  Selected destination:', selectedDestination);
            console.log('  Button disabled:', planRouteBtn ? planRouteBtn.disabled : 'Button not found');
            console.log('  StorageManager available:', typeof window.StorageManager !== 'undefined');
            console.log('  Vehicle select loading:', document.querySelector('.vehicle-selection-group')?.classList.contains('loading'));
            console.log('  Elements found:');
            console.log('    originInput:', !!originInput);
            console.log('    destinationInput:', !!destinationInput);
            console.log('    vehicleSelect:', !!vehicleSelect);
            console.log('    planRouteBtn:', !!planRouteBtn);
            if (typeof window.StorageManager !== 'undefined') {
                console.log('  Vehicles:', window.StorageManager.getVehicles());
            }
        },
        test: function() {
            console.log('[PlanCard] Testing location selection...');
            const testOrigin = {
                displayName: "Test Origin",
                latitude: 47.4979,
                longitude: 19.0402,
                address: { city: "Budapest", country: "Hungary" }
            };
            const testDestination = {
                displayName: "Test Destination", 
                latitude: 47.5636,
                longitude: 19.0947,
                address: { city: "Budapest", country: "Hungary" }
            };
            selectLocation(testOrigin, 'origin');
            selectLocation(testDestination, 'destination');
        }
    };
}

// Listen for modal content changes to reinitialize PlanCard
document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize immediately
    initializePlanCard();
    
    // Also listen for modal events
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.querySelector && node.querySelector('#originLocation')) {
                    console.log('[PlanCard] Detected PlanCard elements in DOM, initializing...');
                    initializePlanCard();
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Listen for vehicle changes to update dropdown
document.addEventListener('vehiclesUpdated', function() {
    console.log('[PlanCard] Vehicles updated, reloading dropdown with loading state');
    if (window.PlanCard && window.PlanCard.refreshVehicles) {
        window.PlanCard.refreshVehicles();
    } else if (window.PlanCard && window.PlanCard.loadVehicles) {
        window.PlanCard.loadVehicles();
    }
});

// Global functions for testing and debugging
window.testPlanCard = function() {
    console.log('[PlanCard] === TESTING PLAN CARD ===');
    
    // Try to initialize first
    initializePlanCard();
    
    if (!window.PlanCard) {
        console.error('[PlanCard] PlanCard not initialized!');
        return;
    }
    
    // Create a test vehicle if none exist
    if (typeof window.StorageManager !== 'undefined') {
        const vehicles = window.StorageManager.getVehicles();
        if (vehicles.length === 0) {
            console.log('[PlanCard] No vehicles found, creating test vehicle...');
            const testVehicle = {
                name: 'Test Autó',
                brand: 'Test Brand',
                model: 'Test Model',
                fuelType: 'benzin',
                consumption: 8.5,
                year: 2020,
                licensePlate: 'ABC-123',
                isDefault: true
            };
            console.log('[PlanCard] Creating test vehicle:', testVehicle);
            window.StorageManager.saveVehicle(testVehicle);
            console.log('[PlanCard] Test vehicle saved, reloading vehicles...');
            window.PlanCard.loadVehicles();
        }
    }
    
    console.log('[PlanCard] Testing location selection...');
    window.PlanCard.test();
};

window.debugPlanCard = function() {
    console.log('[PlanCard] === DEBUG PLAN CARD ===');
    
    // Check if elements exist
    const elements = {
        originInput: document.getElementById('originLocation'),
        destinationInput: document.getElementById('destinationLocation'),
        vehicleSelect: document.getElementById('vehicleSelect'),
        planRouteBtn: document.getElementById('planRouteBtn')
    };
    
    console.log('[PlanCard] DOM Elements:', elements);
    console.log('[PlanCard] StorageManager available:', typeof window.StorageManager !== 'undefined');
    console.log('[PlanCard] NavigationManager available:', typeof window.NavigationManager !== 'undefined');
    
    if (window.PlanCard) {
        window.PlanCard.debug();
    } else {
        console.log('[PlanCard] PlanCard not initialized!');
    }
    
    console.log('[PlanCard] === END DEBUG ===');
};