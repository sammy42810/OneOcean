import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function validateCoords(coordinate, fieldName) {
        let coordinateSanatized;
        if (!coordinate)
        {
            throw `${fieldName} must be provided`;
        }
        if (typeof coordinate !== 'number')
        {
            if (typeof coordinate === 'string')
            {
                coordinateSanatized = +(coordinate.trim());
                if (Number.isNaN(coordinateSanatized))
                {
                    throw `if ${fieldName} is a string it must be in number form`;
                }
            }
            else
            {
                throw `${fieldName} must be a number or string in number form`;
            }
        }
        else 
        {
            coordinateSanatized = coordinate;
        }
        return coordinateSanatized;
}

function convertGeoObjectToMarker(geoObject) {
        if (!geoObject || typeof geoObject !== 'object' )
        {
            throw `geoObject must be provided and a object ${geoObject}`;
        }
        if (!geoObject.type || !geoObject.coordinates)
        {
            throw 'geoObject must contain attributes: type and coordinates'
        }

        let markerLat = validateCoords(geoObject.coordinates[1], 'markerLat');
        let markerLon = validateCoords(geoObject.coordinates[0], 'markerLon');
        let marker = L.marker([markerLat, markerLon]);
        return marker;
}

function convertBeachToMarker(beachObject) {
        if (!beachObject || typeof beachObject !== 'object')
        {
            throw `beachObject must be provided and a valid beach object with a geoObject property ${beachObject}`;
        }
        if (typeof beachObject._id === 'object')
        {
            beachObject._id = beachObject._id.toString();
        }
        let marker = convertGeoObjectToMarker(beachObject.geoObject);
        marker.bindPopup(`<b>${beachObject.beachName}</b><br>
                            Location: ${beachObject.city}, ${beachObject.county}<br>
                            Length: ${beachObject.beachLength} miles<br>
                            Water Quality Rating: ${beachObject.waterQuality}<br>
                            User Rating: ${beachObject.userRating}<br>
                            Auto Rating: ${beachObject.autoRating ?? 'N/A'}<br>
                            Status: ${beachObject.status}<br>
                            <a href="/beaches/${beachObject._id}">View Details</a>`);
        return marker;
    }
    
function initializeMap(divId, defaultViewCoords, zoomLevel) {
        if (!divId) {
            throw 'divId must be provided';
        }
        if (!defaultViewCoords) {
            defaultViewCoords = [37.76440868707054, -122.50798339662812];
        }
        if (!zoomLevel) {
            zoomLevel = 10;
        }
        if (typeof divId !== 'string') {
            throw 'divId must be a string';
        }
        if (typeof defaultViewCoords !== 'object') {
            throw 'defaultViewCoords must be a latLng object or an array of length 2';
        }
        if (typeof zoomLevel !== 'number') {
            throw 'zoomLevel must be a number';
        }

        let map = L.map(divId).setView(defaultViewCoords, zoomLevel);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        return map;
}

function createProximityCircle(center, radius) {
    let circle = L.circle(center, {
        radius: Number(radius) * 1609.34,
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.4
    })
    return circle
}

try {
    let beachData = document.getElementById('beach-data');
    let filterForm = document.getElementById('beach-filters');
    let distanceLabel = document.getElementById('distance-label');
    let distanceRadius = document.getElementById('filter-distance-radius');
    let distanceCenter = document.getElementById('filter-distance-center');

    let currentPoint = null;
    let currentPointCoords = null;

    if (distanceCenter.value) {
        currentPointCoords = L.latLng(distanceCenter.value.split(',').reverse());
        distanceLabel.innerHTML = "Distance: " + distanceRadius.value + " miles";
    
    }
    else {
        currentPointCoords = L.latLng([37.76440868707054, -122.50798339662812]);
    }

    const map = initializeMap("map", currentPointCoords);

    currentPoint = createProximityCircle(currentPointCoords, distanceRadius.value).addTo(map);
    
    distanceRadius.addEventListener('input', function() {
        distanceLabel.innerHTML = "Distance: " + this.value + " miles";
        if (currentPoint !== null && currentPointCoords !== null) {
            map.removeLayer(currentPoint);
            currentPoint = createProximityCircle(currentPointCoords, this.value).addTo(map);
        }
        if (this.value === "0" && currentPoint !== null) {
            map.removeLayer(currentPoint);
        }
    });

    map.on('click', function(e) {
        if (currentPoint !== null && distanceRadius.value !== "0") {
            map.removeLayer(currentPoint);
            currentPoint = createProximityCircle(e.latlng, distanceRadius.value).addTo(map);
        }
        else if (distanceRadius.value !== "0") {
            currentPoint = createProximityCircle(e.latlng, distanceRadius.value).addTo(map);
        }
        currentPointCoords = e.latlng
    });

    if (!beachData) {
        throw 'No data for beaches found'
    }
    beachData = JSON.parse(beachData.innerText);
    if (Array.isArray(beachData)) {
        for (const beach of beachData) {
            convertBeachToMarker(beach).addTo(map);
        }
    }   
    else if (typeof beachData === 'object') {
        convertBeachToMarker(beachData).addTo(map);
    }
    else {
        throw 'invalid beachData provided';
    }

    filterForm.addEventListener('submit', function () {
        if (distanceRadius && distanceRadius.value && distanceRadius.value !== "0" && currentPointCoords !== null) { 
            distanceCenter.value = [currentPointCoords.lng, currentPointCoords.lat];
        }
        else {
            distanceCenter.value = '';
        }
    });

} catch (e) {
    console.log(e);
}






