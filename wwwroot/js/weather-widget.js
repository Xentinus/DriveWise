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
        this.showWidget(); // Always show widget
        this.fetchFuelPrices(); // Fetch fuel prices once on load
        this.getCurrentLocation();
    }

    createWidget() {
        // Find the existing info widget container
        const infoContainer = document.getElementById('infoWidget');
        if (!infoContainer) {
            console.error('Info widget container not found');
            return;
        }
        
        infoContainer.innerHTML = `
            <div class="widget-container">
                <div class="widget-loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Adatok betöltése...</span>
                    </div>
                    <span>Betöltés...</span>
                </div>
            </div>
        `;
        
        this.widgetElement = infoContainer;
        this.infoWidgetElement = document.querySelector('.info-widget');
    }

    hideWidget() {
        if (this.infoWidgetElement) {
            this.infoWidgetElement.classList.remove('visible');
            this.infoWidgetElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    showWidget() {
        if (this.infoWidgetElement) {
            this.infoWidgetElement.style.display = 'block';
            this.infoWidgetElement.classList.add('visible');
            this.isVisible = true;
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            console.log('GPS not supported - showing fuel prices only');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
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
                console.log('GPS error - showing fuel prices only:', error);
                // Don't hide widget, just show fuel prices without weather
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
            // Fetch weather data
            const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
            
            if (!weatherResponse.ok) {
                throw new Error(`HTTP ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();
            
            // Only update if we got valid weather data
            if (weatherData && weatherData.temperature !== undefined) {
                this.weatherData = weatherData;
                this.updateWidget();
            } else {
                // Show fuel prices even without weather data
                console.log('No weather data available, showing fuel prices only');
            }
            
        } catch (error) {
            console.error('Időjárás API hiba:', error);
            // Keep widget visible with fuel prices only
            console.log('Weather API error, showing fuel prices only');
        }
    }
    
    async fetchFuelPrices() {
        try {
            const fuelResponse = await fetch('/api/FuelPrice');
            if (fuelResponse.ok) {
                this.fuelPrices = await fuelResponse.json();
                this.updateWidget();
            }
        } catch (error) {
            console.log('Üzemanyagár lekérési hiba:', error);
        }
    }

    updateWidget() {
        if (!this.isVisible) return;
        
        const container = this.widgetElement.querySelector('.widget-container');
        if (!container) return;
        
        // Build weather HTML if available
        let weatherHtml = '';
        if (this.weatherData) {
            const iconClass = this.getWeatherIcon(this.weatherData.condition);
            weatherHtml = `
                <div class="weather-main">
                    <i class="bi ${iconClass} weather-icon ${this.weatherData.condition.toLowerCase()}"></i>
                    <div class="weather-temp">${Math.round(this.weatherData.temperature)}°C</div>
                </div>
            `;
        }
        
        // Build fuel prices HTML if available
        let fuelPriceHtml = '';
        if (this.fuelPrices && (this.fuelPrices.prices || this.fuelPrices.Prices)) {
            const prices = this.fuelPrices.prices || this.fuelPrices.Prices;
            const benzinPrice = prices.benzin || prices.Benzin;
            const dieselPrice = prices.diesel || prices.Diesel;
            
            if (benzinPrice || dieselPrice) {
                fuelPriceHtml = '<div class="fuel-prices">';
                if (benzinPrice) {
                    fuelPriceHtml += `<div class="fuel-price-item"><i class="bi bi-fuel-pump-fill fuel-icon benzin-icon"></i><span class="fuel-label">95:</span> <span class="fuel-value">${Math.round(benzinPrice)} Ft/l</span></div>`;
                }
                if (dieselPrice) {
                    fuelPriceHtml += `<div class="fuel-price-item"><i class="bi bi-fuel-pump-fill fuel-icon diesel-icon"></i><span class="fuel-label">Dízel:</span> <span class="fuel-value">${Math.round(dieselPrice)} Ft/l</span></div>`;
                }
                fuelPriceHtml += '</div>';
            }
        }
        
        // Always update - show fuel prices even without weather
        if (weatherHtml || fuelPriceHtml) {
            container.innerHTML = weatherHtml + fuelPriceHtml;
        } else {
            // Show loading state if nothing is available yet
            container.innerHTML = `
                <div class="widget-loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Betöltés...</span>
                    </div>
                    <span>Adatok betöltése...</span>
                </div>
            `;
        }
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