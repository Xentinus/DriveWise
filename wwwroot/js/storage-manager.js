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
                localStorage.setItem(key, JSON.stringify(value));
                console.log('[StorageManager] write as JSON', key, value);
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
                    detail: { key, value, operation } 
                }));
            } catch (e) {
                console.warn('[StorageManager] dispatch storageChanged failed', e);
            }
        },

        // Initialize storage for form elements (similar to SettingsCard)
        initFormStorage: function(container = document) {
            const elems = container.querySelectorAll('[data-storage-key]');
            console.log('[StorageManager] initializing form storage for', elems.length, 'elements');

            elems.forEach(el => {
                const key = el.getAttribute('data-storage-key');
                if (!key) return;

                const stored = this.get(key);
                console.log('[StorageManager] init form element key=', key, 'stored=', stored, 'current value=', el.value || el.checked);

                // Initialize based on element type
                if (el.type === 'checkbox') {
                    if (stored !== null) {
                        el.checked = stored === true || stored === '1' || stored === 'true';
                        console.log('[StorageManager] loaded checkbox', key, '=', el.checked);
                    } else {
                        // persist default state
                        this.set(key, el.checked);
                        console.log('[StorageManager] saved checkbox default', key, '=', el.checked);
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
                    } else {
                        // For selects, if no option is naturally selected, select the first one as default
                        if (el.tagName === 'SELECT' && el.selectedIndex === -1) {
                            el.selectedIndex = 0;
                        }
                        this.set(key, el.value);
                        console.log('[StorageManager] saved select/input default', key, '=', el.value);
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