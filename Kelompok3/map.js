// Center coordinates for Banda Aceh
const BANDA_ACEH_COORDS = [5.5483, 95.3238];

// Defined Tile Layers
const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
});

const layers = {
    'dark': darkLayer,
    'light': lightLayer,
    'satellite': satelliteLayer
};

// Initialize map with Dark Mode by default
const map = L.map('map', {
    zoomControl: false,
    fadeAnimation: true,
    markerZoomAnimation: true,
    layers: [darkLayer]
}).setView(BANDA_ACEH_COORDS, 14);

// Add custom zoom control to bottom left
L.control.zoom({ position: 'bottomleft' }).addTo(map);

// Modern Layer Switcher Logic
function switchLayer(layerKey) {
    // Remove all layers first
    Object.values(layers).forEach(layer => map.removeLayer(layer));
    // Add the selected one
    map.addLayer(layers[layerKey]);
    
    // Update UI active state
    document.querySelectorAll('.map-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === layerKey);
    });
}

document.querySelectorAll('.map-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLayer(btn.dataset.type));
});

function addToList(name, description, lat, lng, marker) {
    const list = document.getElementById('places-list');
    const item = document.createElement('div');
    item.className = 'place-item';
    item.innerHTML = `
        <h4>${name}</h4>
        <p>${description}</p>
    `;
    
    item.onclick = () => {
        map.flyTo([lat, lng], 16, { duration: 1.5 });
        marker.openPopup();
    };
    
    list.prepend(item);
}

function createPlaceMarker(name, description, lat, lng, addedAt) {
    const marker = L.marker([lat, lng]).addTo(map);
    
    const popupContent = `
        <div class="popup-content">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <h3 style="margin: 0;">${name}</h3>
                <span style="font-size: 0.65rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 20px; white-space: nowrap;">
                    ${addedAt || 'Baru'}
                </span>
            </div>
            <p>${description}</p>
            <div style="font-size: 0.7rem; color: #475569; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; display: flex; gap: 8px;">
                <span>📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        className: 'custom-popup',
        offset: [0, -10]
    });
    
    // Smoothly focus on marker when clicked
    marker.on('click', () => {
        map.flyTo([lat, lng], 16, { duration: 1.2 });
    });
    
    // Add to the list on the left
    addToList(name, description, lat, lng, marker);
    
    return marker;
}

// Load existing places from location.json
fetch('location.json')
    .then(res => res.json())
    .then(places => {
        // Reverse to show the list in correct order if prepending
        places.reverse().forEach(p => {
            createPlaceMarker(p.name, p.description, p.lat, p.lng, p.addedAt);
        });
    })
    .catch(err => console.error('Gagal memuat data tempat:', err));

// Helper function to get current time in WIB format
function getWIBTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta' 
    };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(now);
    
    const d = parts.find(p => p.type === 'day').value;
    const m = parts.find(p => p.type === 'month').value;
    const y = parts.find(p => p.type === 'year').value;
    const hh = parts.find(p => p.type === 'hour').value;
    const mm = parts.find(p => p.type === 'minute').value;
    
    return `${y}-${m}-${d} ${hh}:${mm} WIB`;
}

// Auto-fill coordinates on map click
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    document.getElementById('place-lat').value = lat.toFixed(6);
    document.getElementById('place-lng').value = lng.toFixed(6);
    
    // Smoothly pan to the clicked location
    map.panTo([lat, lng]);

    // Visual feedback for selected point
    if (window.tempMarker) map.removeLayer(window.tempMarker);
    window.tempMarker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: "#0ea5e9",
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.6
    }).addTo(map);
});

// Handle Form Submission
document.getElementById('add-place-btn').addEventListener('click', () => {
    const name = document.getElementById('place-name').value;
    const desc = document.getElementById('place-desc').value;
    const lat = parseFloat(document.getElementById('place-lat').value);
    const lng = parseFloat(document.getElementById('place-lng').value);
    const addedAt = getWIBTime();

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert('Harap isi nama tempat dan koordinat yang valid.');
        return;
    }

    // Add marker and fly to it
    const marker = createPlaceMarker(name, desc || 'Tempat yang ditambahkan oleh pengguna', lat, lng, addedAt);
    map.flyTo([lat, lng], 16, {
        duration: 1.5
    });
    
    setTimeout(() => marker.openPopup(), 1600);

    // Clear UI
    if (window.tempMarker) map.removeLayer(window.tempMarker);
    document.getElementById('place-name').value = '';
    document.getElementById('place-desc').value = '';
    document.getElementById('place-lat').value = '';
    document.getElementById('place-lng').value = '';
});
