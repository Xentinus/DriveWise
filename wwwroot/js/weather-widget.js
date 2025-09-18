// Weather Widget JavaScript
class WeatherWidget {
    constructor() {
        this.currentPosition = null;
        this.weatherData = null;
        this.updateInterval = null;
        this.updateIntervalMs = 10 * 60 * 1000; // 10 minutes
        this.isVisible = false;
        
        this.init();
    }

    init() {
        this.createWidget();
        this.hideWidget(); // Initially hidden
        this.getCurrentLocation();
    }

    createWidget() {
        // Find the existing weather widget container in the unified widget
        const weatherContainer = document.getElementById('weatherWidget');
        if (!weatherContainer) {
            console.error('Weather widget container not found');
            return;
        }
        
        weatherContainer.innerHTML = `
            <div class="weather-container">
                <div class="weather-loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Helyszín keresése...</span>
                    </div>
                    <span>GPS...</span>
                </div>
            </div>
        `;
        
        this.widgetElement = weatherContainer;
        this.weatherControlsElement = document.querySelector('.weather-controls');
    }

    hideWidget() {
        if (this.weatherControlsElement) {
            this.weatherControlsElement.classList.remove('visible');
            this.weatherControlsElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    showWidget() {
        if (this.weatherControlsElement) {
            this.weatherControlsElement.style.display = 'block';
            this.weatherControlsElement.classList.add('visible');
            this.isVisible = true;
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            console.log('GPS not supported - weather widget will remain hidden');
            this.hideWidget();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.showWidget();
                this.fetchWeather(this.currentPosition.lat, this.currentPosition.lng);
                
                // Start the update interval only after successful GPS
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
                this.updateInterval = setInterval(() => {
                    if (this.currentPosition && this.isVisible) {
                        this.fetchWeather(this.currentPosition.lat, this.currentPosition.lng);
                    }
                }, this.updateIntervalMs);
            },
            (error) => {
                console.log('GPS error - weather widget will remain hidden:', error);
                this.hideWidget();
                // Clear any existing position and interval
                this.currentPosition = null;
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 5 * 60 * 1000 // 5 minutes
            }
        );
    }

    async fetchWeather(lat, lng) {
        if (!this.isVisible) return;

        try {
            const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const weatherData = await response.json();
            
            // Only update if we got valid weather data
            if (weatherData && weatherData.temperature !== undefined) {
                this.weatherData = weatherData;
                this.updateWidget();
            } else {
                // Hide widget if no valid data
                this.hideWidget();
            }
            
        } catch (error) {
            console.error('Időjárás API hiba:', error);
            // Hide widget on API error instead of showing error message
            this.hideWidget();
        }
    }

    updateWidget() {
        if (!this.weatherData || !this.isVisible) return;

        const container = this.widgetElement.querySelector('.weather-container');
        const iconClass = this.getWeatherIcon(this.weatherData.condition);
        
        container.innerHTML = `
            <div class="weather-main">
                <i class="bi ${iconClass} weather-icon ${this.weatherData.condition.toLowerCase()}"></i>
                <div class="weather-temp">${Math.round(this.weatherData.temperature)}°C</div>
            </div>
        `;
    }

    getWeatherIcon(condition) {
        const iconMap = {
            'Clear': 'bi-sun-fill',
            'Clouds': 'bi-cloud-fill',
            'Rain': 'bi-cloud-rain-fill',
            'Drizzle': 'bi-cloud-drizzle-fill',
            'Thunderstorm': 'bi-cloud-lightning-fill',
            'Snow': 'bi-cloud-snow-fill',
            'Mist': 'bi-cloud-fog-fill',
            'Fog': 'bi-cloud-fog-fill',
            'Haze': 'bi-cloud-haze-fill'
        };
        
        return iconMap[condition] || 'bi-question-circle-fill';
    }

    // Update position when map center changes (optional integration)
    updatePosition(lat, lng) {
        if (!this.isVisible) return;
        
        this.currentPosition = { lat, lng };
        this.fetchWeather(lat, lng);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.hideWidget();
    }
}

// Initialize weather widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.weatherWidget = new WeatherWidget();
});

// Optional: Update weather when map view changes significantly
// This can be integrated with the map's moveend event if desired
window.updateWeatherLocation = function(lat, lng) {
    if (window.weatherWidget && window.weatherWidget.isVisible) {
        window.weatherWidget.updatePosition(lat, lng);
    }
};