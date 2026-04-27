// Center coordinates for Banda Aceh
const BANDA_ACEH_COORDS = [5.5483, 95.3238];

// Initialize map with a slightly higher zoom for city focus
const map = L.map('map', {
    zoomControl: false // We'll add it to the top-right later
}).setView(BANDA_ACEH_COORDS, 14);

// Add custom zoom control
L.control.zoom({ position: 'topright' }).addTo(map);

// Use a high-quality dark tile layer for the premium aesthetic
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Function to create a custom marker icon (optional, but let's keep it simple with default first)
// Or just style the popup nicely.

function createPlaceMarker(name, description, lat, lng, addedAt, isSaved = false) {
    const marker = L.marker([lat, lng]).addTo(map);
    
    const popupContent = `
        <div class="popup-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0;">${name}</h3>
                <span style="font-size: 0.7rem; color: #94a3b8; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${addedAt || 'Baru'}</span>
            </div>
            <p>${description}</p>
            <div style="margin-top: 8px; font-size: 0.75rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        className: 'custom-popup'
    });
    
    return marker;
}

// Load existing places from location.json
fetch('location.json')
    .then(res => res.json())
    .then(places => {
        places.forEach(p => {
            createPlaceMarker(p.name, p.description, p.lat, p.lng, p.addedAt, true);
        });
    })
    .catch(err => console.error('Gagal memuat data tempat:', err));

// Helper function to get current time in WIB format
function getWIBTime() {
    const now = new Date();
    // Using Intl to ensure format is consistent
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
    
    // Add a temporary "target" marker to show where they clicked
    if (window.tempMarker) map.removeLayer(window.tempMarker);
    window.tempMarker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#0ea5e9",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
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
