// Weather Widget JavaScript
class WeatherWidget {
    constructor() {
        this.currentPosition = null;
        this.weatherData = null;
        this.updateInterval = null;
        this.updateIntervalMs = 10 * 60 * 1000; // 10 minutes
        
        this.init();
    }

    init() {
        this.createWidget();
        this.getCurrentLocation();
        
        // Update weather every 10 minutes
        this.updateInterval = setInterval(() => {
            if (this.currentPosition) {
                this.fetchWeather(this.currentPosition.lat, this.currentPosition.lng);
            }
        }, this.updateIntervalMs);
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
                        <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <span>Időjárás...</span>
                </div>
            </div>
        `;
        
        this.widgetElement = weatherContainer;
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('A GPS nem támogatott');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.fetchWeather(this.currentPosition.lat, this.currentPosition.lng);
            },
            (error) => {
                console.error('GPS hiba:', error);
                this.showError('GPS hiba');
                
                // Fallback: Use Budapest coordinates
                this.currentPosition = { lat: 47.4979, lng: 19.0402 };
                this.fetchWeather(this.currentPosition.lat, this.currentPosition.lng);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 5 * 60 * 1000 // 5 minutes
            }
        );
    }

    async fetchWeather(lat, lng) {
        try {
            const response = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const weatherData = await response.json();
            this.weatherData = weatherData;
            this.updateWidget();
            
        } catch (error) {
            console.error('Időjárás API hiba:', error);
            this.showError('Nincs adat');
        }
    }

    updateWidget() {
        if (!this.weatherData) return;

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

    showError(message) {
        const container = this.widgetElement.querySelector('.weather-container');
        container.innerHTML = `
            <div class="weather-error">
                <i class="bi bi-exclamation-triangle"></i>
                <div>${message}</div>
            </div>
        `;
    }

    // Update position when map center changes (optional integration)
    updatePosition(lat, lng) {
        this.currentPosition = { lat, lng };
        this.fetchWeather(lat, lng);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.widgetElement) {
            this.widgetElement.remove();
        }
    }
}

// Initialize weather widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.weatherWidget = new WeatherWidget();
});

// Optional: Update weather when map view changes significantly
// This can be integrated with the map's moveend event if desired
window.updateWeatherLocation = function(lat, lng) {
    if (window.weatherWidget) {
        window.weatherWidget.updatePosition(lat, lng);
    }
};