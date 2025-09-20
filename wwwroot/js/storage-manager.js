/**
 * Global Storage Manager
 * Provides centralized localStorage operations that can be used across all components
 */
window.StorageManager = (function() {
    'use strict';

    // Storage change suppression flag to reduce extension conflicts
    let suppressStorageEvents = false;

    // Private methods
    function readStored(key) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return null;
            
            // Special handling for theme - it might be stored as plain string by ThemeManager
            if (key === 'theme' && (value === 'light' || value === 'dark')) {
                return value;
            }
            
            // Try to parse as JSON, fallback to plain string
            try {
                return JSON.parse(value);
            } catch (parseError) {
                // If JSON parsing fails, return the raw value
                console.log('[StorageManager] Using raw value for key:', key, 'value:', value);
                return value;
            }
        } catch (e) {
            console.warn('[StorageManager] readStored failed for key:', key, e);
            return null;
        }
    }

    function writeStored(key, value) {
        try {
            // Validate input
            if (typeof key !== 'string' || key.length === 0) {
                console.warn('[StorageManager] Invalid key provided:', key);
                return false;
            }
            
            // Temporarily suppress storage events to prevent extension conflicts
            suppressStorageEvents = true;
            
            // Special handling for theme - store as plain string to be compatible with ThemeManager
            if (key === 'theme') {
                const stringValue = String(value);
                localStorage.setItem(key, stringValue);
                console.log('[StorageManager] write theme as plain string', key, stringValue);
            } else {
                // Ensure value is serializable and safe
                let jsonValue;
                try {
                    // First check if value is already a string
                    if (typeof value === 'string') {
                        // Store string values as quoted JSON to ensure they can be parsed back
                        jsonValue = JSON.stringify(value);
                    } else {
                        jsonValue = JSON.stringify(value);
                    }
                } catch (stringifyError) {
                    console.warn('[StorageManager] Cannot stringify value for key:', key, 'value:', value, 'error:', stringifyError);
                    // Fallback to string conversion and then stringify
                    jsonValue = JSON.stringify(String(value));
                }
                
                localStorage.setItem(key, jsonValue);
                console.log('[StorageManager] write as JSON', key, typeof value === 'object' ? jsonValue : value);
            }
            
            // Re-enable storage events after a brief delay
            setTimeout(() => {
                suppressStorageEvents = false;
                // Dispatch storage change event for theme specifically
                if (key === 'theme') {
                    StorageManager.dispatchStorageChange(key, value, 'set');
                }
            }, 10);
            
            return true;
        } catch (e) {
            console.warn('[StorageManager] writeStored failed for key:', key, 'error:', e);
            suppressStorageEvents = false;
            return false;
        }
    }

    function removeStored(key) {
        try {
            suppressStorageEvents = true;
            localStorage.removeItem(key);
            console.log('[StorageManager] removed', key);
            setTimeout(() => {
                suppressStorageEvents = false;
            }, 10);
            return true;
        } catch (e) {
            console.warn('[StorageManager] removeStored failed for key:', key, e);
            suppressStorageEvents = false;
            return false;
        }
    }

    // Public API
    return {
        // Basic operations
        get: function(key, defaultValue = null) {
            const stored = readStored(key);
            return stored !== null ? stored : defaultValue;
        },

        set: function(key, value) {
            return writeStored(key, value);
        },

        remove: function(key) {
            return removeStored(key);
        },

        // Check if storage events are suppressed (for debugging)
        isStorageEventsSuppressed: function() {
            return suppressStorageEvents;
        },

        // Cache and data management
        clearCache: function() {
            console.log('[StorageManager] Clearing application cache...');
            
            // Clear all caches
            if ('caches' in window) {
                return caches.keys().then(function(cacheNames) {
                    return Promise.all(
                        cacheNames.map(function(cacheName) {
                            console.log('[StorageManager] Deleting cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                    );
                }).then(function() {
                    console.log('[StorageManager] All caches cleared successfully');
                    return true;
                }).catch(function(error) {
                    console.error('[StorageManager] Cache clearing failed:', error);
                    return false;
                });
            }
            
            return Promise.resolve(true);
        },

        clearAllData: function() {
            console.log('[StorageManager] Clearing all application data...');
            
            try {
                suppressStorageEvents = true;
                
                // Clear localStorage
                localStorage.clear();
                console.log('[StorageManager] localStorage cleared');
                
                // Clear sessionStorage
                sessionStorage.clear();
                console.log('[StorageManager] sessionStorage cleared');
                
                // Clear IndexedDB
                if ('indexedDB' in window) {
                    const dbNames = ['DriveWise', 'vehicles', 'settings', 'cache', 'weather'];
                    dbNames.forEach(dbName => {
                        const deleteReq = indexedDB.deleteDatabase(dbName);
                        deleteReq.onsuccess = () => console.log('[StorageManager] IndexedDB cleared:', dbName);
                        deleteReq.onerror = (e) => console.warn('[StorageManager] IndexedDB clear failed:', dbName, e);
                    });
                }
                
                // Clear caches
                this.clearCache();
                
                setTimeout(() => {
                    suppressStorageEvents = false;
                }, 100);
                
                return true;
            } catch (error) {
                console.error('[StorageManager] Data clearing failed:', error);
                suppressStorageEvents = false;
                return false;
            }
        },

        // Get storage usage info
        getStorageInfo: function() {
            const info = {
                localStorage: 0,
                sessionStorage: 0,
                keys: []
            };
            
            try {
                // Calculate localStorage usage
                let localStorageSize = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        localStorageSize += localStorage[key].length + key.length;
                        info.keys.push(key);
                    }
                }
                info.localStorage = localStorageSize;
                
                // Calculate sessionStorage usage
                let sessionStorageSize = 0;
                for (let key in sessionStorage) {
                    if (sessionStorage.hasOwnProperty(key)) {
                        sessionStorageSize += sessionStorage[key].length + key.length;
                    }
                }
                info.sessionStorage = sessionStorageSize;
                
                console.log('[StorageManager] Storage info:', info);
                return info;
            } catch (error) {
                console.warn('[StorageManager] Failed to get storage info:', error);
                return info;
            }
        },

        // Array operations (for managing lists like vehicles)
        getArray: function(key, defaultArray = []) {
            const stored = this.get(key, defaultArray);
            return Array.isArray(stored) ? stored : defaultArray;
        },

        addToArray: function(key, item) {
            const array = this.getArray(key);
            array.push(item);
            return this.set(key, array);
        },

        updateInArray: function(key, index, item) {
            const array = this.getArray(key);
            if (index >= 0 && index < array.length) {
                array[index] = item;
                return this.set(key, array);
            }
            return false;
        },

        removeFromArray: function(key, index) {
            const array = this.getArray(key);
            if (index >= 0 && index < array.length) {
                array.splice(index, 1);
                return this.set(key, array);
            }
            return false;
        },

        // Vehicle-specific operations
        getVehicles: function() {
            return this.getArray('vehicles', []);
        },

        saveVehicle: function(vehicle) {
            // Add unique ID if not present
            if (!vehicle.id) {
                vehicle.id = 'vehicle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // If this is the first vehicle, make it default
            const existingVehicles = this.getVehicles();
            if (existingVehicles.length === 0) {
                vehicle.isDefault = true;
            }
            
            const result = this.addToArray('vehicles', vehicle);
            if (result) {
                // If this is the first vehicle, set it as default
                if (existingVehicles.length === 0) {
                    this.set('defaultVehicleId', vehicle.id);
                    window.dispatchEvent(new CustomEvent('defaultVehicleChanged', {
                        detail: { vehicleId: vehicle.id }
                    }));
                }
                
                // Dispatch vehicles updated event
                window.dispatchEvent(new CustomEvent('vehiclesUpdated', {
                    detail: { action: 'add', vehicle: vehicle }
                }));
            }
            return result;
        },

        updateVehicle: function(index, vehicle) {
            const result = this.updateInArray('vehicles', index, vehicle);
            if (result) {
                // Dispatch vehicles updated event
                window.dispatchEvent(new CustomEvent('vehiclesUpdated', {
                    detail: { action: 'update', vehicle: vehicle, index: index }
                }));
            }
            return result;
        },

        deleteVehicle: function(index) {
            const vehicles = this.getVehicles();
            const deletedVehicle = vehicles[index];
            const result = this.removeFromArray('vehicles', index);
            if (result) {
                // Dispatch vehicles updated event
                window.dispatchEvent(new CustomEvent('vehiclesUpdated', {
                    detail: { action: 'delete', vehicle: deletedVehicle, index: index }
                }));
            }
            return result;
        },

        // Selected vehicle operations (kept for backward compatibility)
        getSelectedVehicle: function() {
            return this.getDefaultVehicle(); // Redirect to default vehicle
        },

        setSelectedVehicle: function(vehicleId) {
            return this.setDefaultVehicle(vehicleId); // Redirect to default vehicle
        },

        clearSelectedVehicle: function() {
            return this.clearDefaultVehicle(); // Redirect to default vehicle
        },

        // Default vehicle operations (new primary methods)
        getDefaultVehicle: function() {
            const defaultId = this.get('defaultVehicleId', null);
            if (!defaultId) {
                // Auto-set first vehicle as default if none is set
                const vehicles = this.getVehicles();
                if (vehicles.length > 0) {
                    this.setDefaultVehicle(vehicles[0].id);
                    return vehicles[0];
                }
                return null;
            }
            
            const vehicles = this.getVehicles();
            return vehicles.find(v => v.id === defaultId) || null;
        },

        setDefaultVehicle: function(vehicleId) {
            // First, clear any existing default flags in vehicle objects
            const vehicles = this.getVehicles();
            vehicles.forEach((vehicle, index) => {
                if (vehicle.isDefault) {
                    vehicle.isDefault = false;
                    this.updateVehicle(index, vehicle);
                }
            });
            
            // Set the new default vehicle
            const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
            if (vehicleIndex >= 0) {
                vehicles[vehicleIndex].isDefault = true;
                this.updateVehicle(vehicleIndex, vehicles[vehicleIndex]);
            }
            
            const result = this.set('defaultVehicleId', vehicleId);
            if (result) {
                this.dispatchStorageChange('defaultVehicleId', vehicleId);
                // Dispatch a default vehicle changed event
                window.dispatchEvent(new CustomEvent('defaultVehicleChanged', {
                    detail: { vehicleId: vehicleId }
                }));
                // Also dispatch legacy vehicle selection event for backward compatibility
                window.dispatchEvent(new CustomEvent('vehicleSelectionChanged', {
                    detail: { vehicleId: vehicleId }
                }));
            }
            return result;
        },

        clearDefaultVehicle: function() {
            // Clear default flags in vehicle objects
            const vehicles = this.getVehicles();
            vehicles.forEach((vehicle, index) => {
                if (vehicle.isDefault) {
                    vehicle.isDefault = false;
                    this.updateVehicle(index, vehicle);
                }
            });
            
            const result = this.remove('defaultVehicleId');
            if (result) {
                this.dispatchStorageChange('defaultVehicleId', null, 'remove');
                window.dispatchEvent(new CustomEvent('defaultVehicleChanged', {
                    detail: { vehicleId: null }
                }));
                window.dispatchEvent(new CustomEvent('vehicleSelectionChanged', {
                    detail: { vehicleId: null }
                }));
            }
            return result;
        },

        // Get the effective vehicle for fuel calculation (default or fallback)
        getEffectiveVehicle: function() {
            const defaultVehicle = this.getDefaultVehicle();
            if (defaultVehicle) return defaultVehicle;
            
            // Return default vehicle data if no vehicle is set as default
            return {
                id: 'default',
                name: 'Alapértelmezett jármű',
                consumption: 7.0,
                fuelType: 'petrol'
            };
        },

        // Event dispatching for storage changes - reduced frequency to avoid extension conflicts
        dispatchStorageChange: function(key, value, operation = 'set') {
            // Skip dispatching if we're in the middle of storage operations
            if (suppressStorageEvents) {
                console.log('[StorageManager] Skipping storage event dispatch due to suppression:', key);
                return;
            }
            
            try {
                // Ensure value is properly serializable
                let serializedValue = value;
                if (typeof value === 'object' && value !== null) {
                    try {
                        serializedValue = JSON.stringify(value);
                    } catch (stringifyError) {
                        console.warn('[StorageManager] Cannot stringify value for event dispatch:', key, value);
                        serializedValue = String(value);
                    }
                } else if (typeof value === 'function') {
                    console.warn('[StorageManager] Cannot dispatch function value:', key);
                    return;
                }
                
                // Use setTimeout to ensure async dispatch and reduce conflicts
                setTimeout(() => {
                    if (!suppressStorageEvents) {
                        window.dispatchEvent(new CustomEvent('storageChanged', { 
                            detail: { 
                                key, 
                                value: serializedValue, 
                                operation,
                                timestamp: Date.now(),
                                source: 'StorageManager'
                            } 
                        }));
                        console.log('[StorageManager] Dispatched storageChanged event for key:', key, 'value:', serializedValue);
                    }
                }, 5);
            } catch (e) {
                console.warn('[StorageManager] dispatch storageChanged failed for key:', key, 'error:', e);
            }
        },

        // Initialize storage for form elements (similar to SettingsCard)
        initFormStorage: function(container = document, defaults = {}) {
            const elems = container.querySelectorAll('[data-storage-key]');
            console.log('[StorageManager] initializing form storage for', elems.length, 'elements');

            elems.forEach(el => {
                const key = el.getAttribute('data-storage-key');
                if (!key) return;

                const stored = this.get(key);
                const defaultValue = defaults[key];
                
                console.log('[StorageManager] init form element key=', key, 'stored=', stored, 'default=', defaultValue, 'current value=', el.value || el.checked);

                // Initialize based on element type
                if (el.type === 'checkbox') {
                    if (stored !== null) {
                        el.checked = stored === true || stored === '1' || stored === 'true';
                        console.log('[StorageManager] loaded checkbox', key, '=', el.checked);
                    } else if (defaultValue !== undefined) {
                        // Use provided default
                        el.checked = defaultValue;
                        this.set(key, defaultValue);
                        console.log('[StorageManager] set checkbox default', key, '=', defaultValue);
                    } else {
                        // Use element's current state as default
                        this.set(key, el.checked);
                        console.log('[StorageManager] saved checkbox current state as default', key, '=', el.checked);
                    }
                    
                    // Debounced event handler to reduce noise
                    let changeTimeout;
                    el.addEventListener('change', () => {
                        clearTimeout(changeTimeout);
                        changeTimeout = setTimeout(() => {
                            const val = el.checked;
                            this.set(key, val);
                            this.dispatchStorageChange(key, val);
                        }, 100);
                    });

                } else if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (stored !== null) {
                        try { 
                            el.value = stored; 
                            console.log('[StorageManager] loaded select/input', key, '=', stored);
                        } catch (e) { 
                            console.warn('[StorageManager] set form value failed', key, stored); 
                        }
                    } else if (defaultValue !== undefined) {
                        // Use provided default
                        el.value = defaultValue;
                        this.set(key, defaultValue);
                        console.log('[StorageManager] set select/input default', key, '=', defaultValue);
                    } else {
                        // For selects, if no option is naturally selected, select the first one as default
                        if (el.tagName === 'SELECT' && el.selectedIndex === -1) {
                            el.selectedIndex = 0;
                        }
                        this.set(key, el.value);
                        console.log('[StorageManager] saved select/input current state as default', key, '=', el.value);
                    }
                    
                    // Debounced event handler to reduce noise
                    let changeTimeout;
                    el.addEventListener('change', () => {
                        clearTimeout(changeTimeout);
                        changeTimeout = setTimeout(() => {
                            const val = el.value;
                            this.set(key, val);
                            this.dispatchStorageChange(key, val);
                        }, 100);
                    });
                }
            });
        }
    };
})();