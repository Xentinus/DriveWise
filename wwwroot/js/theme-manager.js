/**
 * Theme Manager - handles light/dark theme switching
 */
(function() {
    'use strict';

    const THEME_KEY = 'theme';
    const DEFAULT_THEME = 'light';

    function init() {
        console.log('[theme] Theme manager initializing');
        
        // Apply saved theme or default
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
        
        // Listen for theme changes from settings
        window.addEventListener('themeChanged', handleThemeChanged);
        
        // Listen for setting changed events to sync theme
        window.addEventListener('settingChanged', handleSettingChanged);
    }

    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            return saved && (saved === 'light' || saved === 'dark') ? saved : DEFAULT_THEME;
        } catch (e) {
            console.warn('[theme] Failed to read saved theme', e);
            return DEFAULT_THEME;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
            console.log('[theme] Theme saved:', theme);
        } catch (e) {
            console.warn('[theme] Failed to save theme', e);
        }
    }

    function applyTheme(theme) {
        console.log('[theme] Applying theme:', theme);
        
        // Apply to document root
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update map tiles for dark theme
        updateMapTheme(theme);
        
        // Save theme
        saveTheme(theme);
    }

    function updateMapTheme(theme) {
        // Dispatch event to map to change tiles if needed
        try {
            window.dispatchEvent(new CustomEvent('mapThemeChanged', { 
                detail: { theme: theme } 
            }));
        } catch (e) {
            console.warn('[theme] Failed to dispatch map theme change', e);
        }
    }

    function handleThemeChanged(event) {
        if (event.detail && event.detail.theme) {
            applyTheme(event.detail.theme);
        }
    }

    function handleSettingChanged(event) {
        if (event.detail && event.detail.key === 'theme') {
            applyTheme(event.detail.value);
        }
    }

    // Public API
    window.ThemeManager = {
        getCurrentTheme: function() {
            return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
        },
        setTheme: function(theme) {
            if (theme === 'light' || theme === 'dark') {
                applyTheme(theme);
            }
        },
        toggleTheme: function() {
            const current = this.getCurrentTheme();
            const newTheme = current === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();