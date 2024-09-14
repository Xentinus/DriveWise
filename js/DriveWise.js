let map;
let startMarker;
let endMarker;
let routingControl;
let isMetric = true;

function initMap() {
    map = L.map('map').setView([47.497, 19.040], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function toggleUnits() {
    isMetric = !isMetric;
    calculateDistance();
}

function calculateDistance() {
    const start = document.getElementById('start').value.trim();
    const end = document.getElementById('end').value.trim();
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
    const fuelPrice = parseFloat(document.getElementById('fuelPrice').value);
    const currency = document.getElementById('currency').value;

    if (!start || !end || isNaN(fuelConsumption) || fuelConsumption <= 0 || isNaN(fuelPrice) || fuelPrice <= 0) {
        document.getElementById('output').innerHTML = `<div class="alert alert-danger">Please fill in all fields correctly.</div>`;
        return;
    }

    document.getElementById('output').innerHTML = '';
    showLoading(true);

    let startLatLng, endLatLng;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${start}`)
        .then(response => response.json())
        .then(data => {
            if (!data.length) throw new Error('Start location not found');
            startLatLng = [data[0].lat, data[0].lon];
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker(startLatLng).addTo(map).bindPopup('Start').openPopup();

            return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${end}`);
        })
        .then(response => response.json())
        .then(data => {
            if (!data.length) throw new Error('End location not found');
            endLatLng = [data[0].lat, data[0].lon];
            if (endMarker) map.removeLayer(endMarker);
            endMarker = L.marker(endLatLng).addTo(map).bindPopup('End').openPopup();

            if (routingControl) map.removeControl(routingControl);
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(startLatLng[0], startLatLng[1]),
                    L.latLng(endLatLng[0], endLatLng[1])
                ],
                routeWhileDragging: true
            }).addTo(map);

            return fetch(`https://router.project-osrm.org/route/v1/driving/${startLatLng[1]},${startLatLng[0]};${endLatLng[1]},${endLatLng[0]}?overview=false`);
        })
        .then(response => response.json())
        .then(data => {
            const distance = data.routes[0].distance / 1000; // distance in km
            const duration = data.routes[0].duration / 3600; // duration in hours
            const fuelNeeded = (distance * fuelConsumption) / 100; // fuel consumption per 100 km
            const fuelCost = fuelNeeded * fuelPrice;

            const distanceText = isMetric ? `${distance.toFixed(2)} km` : `${(distance * 0.621371).toFixed(2)} miles`;
            const fuelNeededText = isMetric ? `${fuelNeeded.toFixed(2)} liters` : `${(fuelNeeded * 0.264172).toFixed(2)} gallons`;
            const fuelCostText = `${fuelCost.toFixed(2)} ${currency}`;
            const durationHours = Math.floor(duration);
            const durationMinutes = Math.round((duration - durationHours) * 60);
            const durationText = `${durationHours} hours ${durationMinutes} minutes`;

            document.getElementById('output').innerHTML = `
                Distance: ${distanceText}<br>
                Duration: ${durationText}<br>
                Fuel Needed: ${fuelNeededText}<br>
                Fuel Cost: ${fuelCostText}
            `;

            showLoading(false);
        })
        .catch(error => {
            document.getElementById('output').innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            showLoading(false);
        });
}

window.onload = initMap;
