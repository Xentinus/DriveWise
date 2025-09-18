/**
 * Global Storage Manager
 * Provides centralized localStorage operations that can be used across all components
 */
window.StorageManager = (function() {
    'use strict';

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
            // Special handling for theme - store as plain string to be compatible with ThemeManager
            if (key === 'theme') {
                localStorage.setItem(key, value);
                console.log('[StorageManager] write theme as plain string', key, value);
            } else {
                const jsonValue = JSON.stringify(value);
                localStorage.setItem(key, jsonValue);
                console.log('[StorageManager] write as JSON', key, typeof value === 'object' ? jsonValue : value);
            }
            return true;
        } catch (e) {
            console.warn('[StorageManager] writeStored failed for key:', key, e);
            return false;
        }
    }

    function removeStored(key) {
        try {
            localStorage.removeItem(key);
            console.log('[StorageManager] removed', key);
            return true;
        } catch (e) {
            console.warn('[StorageManager] removeStored failed for key:', key, e);
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
                
                return true;
            } catch (error) {
                console.error('[StorageManager] Data clearing failed:', error);
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
            return this.addToArray('vehicles', vehicle);
        },

        updateVehicle: function(index, vehicle) {
            return this.updateInArray('vehicles', index, vehicle);
        },

        deleteVehicle: function(index) {
            return this.removeFromArray('vehicles', index);
        },

        // Event dispatching for storage changes
        dispatchStorageChange: function(key, value, operation = 'set') {
            try {
                window.dispatchEvent(new CustomEvent('storageChanged', { 
                    detail: { 
                        key, 
                        value, 
                        operation 
                    } 
                }));
            } catch (e) {
                console.warn('[StorageManager] dispatch storageChanged failed', e);
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
                    el.addEventListener('change', () => {
                        const val = el.checked;
                        this.set(key, val);
                        this.dispatchStorageChange(key, val);
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
                    el.addEventListener('change', () => {
                        const val = el.value;
                        this.set(key, val);
                        this.dispatchStorageChange(key, val);
                    });
                }
            });
        }
    };
})();