// Inicjalizacja mapy - domyślnie wyśrodkowana na współrzędne Polski z zoomem 6
const map = L.map('map').setView([52.237, 21.017], 6);

// Załadowanie kafelków OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Tablica w której przechowujemy współrzędne punktów [{lat: X, lng: Y}, ...]
let selectedWaypoints = [];

// Grupa warstw dla łatwego usuwania markerów z mapy
let markersLayer = L.layerGroup().addTo(map);

// Nasłuchiwanie na kliknięcie w mapę
map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Dodaj współrzędne do tablicy
    selectedWaypoints.push({ lat, lng });

    // Stwórz marker z numerem punktu
    const pointNumber = selectedWaypoints.length;
    const marker = L.marker([lat, lng])
        .bindPopup(`<b>Punkt ${pointNumber}</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`);
    
    // Dodaj do grupy warstw i od razu otwórz popup informacyjny
    markersLayer.addLayer(marker);
    marker.openPopup();
});

// Obsługa kliknięcia "Wyślij punkty do urządzenia"
document.getElementById('send-btn').addEventListener('click', async () => {
    if (selectedWaypoints.length === 0) {
        alert('Najpierw wybierz co najmniej jeden punkt na mapie!');
        return;
    }

    try {
        // Wysłanie danych POST typu JSON do naszego serwera Node.js
        const response = await fetch('/api/device/waypoints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points: selectedWaypoints })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
        } else {
            alert('Wystąpił błąd: ' + (result.error || 'Nieznany błąd serwera.'));
        }

    } catch (error) {
        console.error('Błąd podczas komunikacji z serwerem:', error);
        alert('Błąd sieci. Serwer nie odpowiada.');
    }
});

// Obsługa przycisku resetowania punktów trasy
document.getElementById('clear-btn').addEventListener('click', () => {
    selectedWaypoints = [];
    markersLayer.clearLayers();
});