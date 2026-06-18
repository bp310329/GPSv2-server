// public/js/map.js
const map = L.map('map').setView([52.237, 21.017], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Zmienne stanu aplikacji na frontendzie
let currentMode = 'history'; 
let selectedWaypoints = [];

// Osobne grupy warstw (layer groups) dla porządku na mapie
const historyLayer = L.layerGroup().addTo(map);
const waypointsLayer = L.layerGroup().addTo(map);

// --- OBSŁUGA TRYBÓW ---

// Funkcja synchronizująca widok strony z aktualnym trybem
function updateUI() {
    const badge = document.getElementById('mode-badge');
    const planningControls = document.getElementById('planning-controls');
    const historyControls = document.getElementById('history-controls');

    // Czyszczenie obu warstw przy zmianie trybu
    historyLayer.clearLayers();
    waypointsLayer.clearLayers();
    selectedWaypoints = []; // resetuj zaplanowane punkty

    if (currentMode === 'history') {
        badge.innerText = "Tryb Historii";
        badge.className = "badge status-history";
        planningControls.style.display = 'none';
        historyControls.style.display = 'block';
        loadRouteHistory(); // Załaduj ścieżkę z bazy danych
    } else {
        badge.innerText = "Planowanie Trasy";
        badge.className = "badge status-planning";
        planningControls.style.display = 'block';
        historyControls.style.display = 'none';
    }
}

// Pobranie aktualnego trybu z serwera przy ładowaniu strony
async function fetchCurrentMode() {
    try {
        const response = await fetch('/api/device/mode');
        const data = await response.json();
        if (data.success) {
            currentMode = data.mode;
            updateUI();
        }
    } catch (err) {
        console.error('Błąd pobierania trybu z serwera:', err);
    }
}

// Zmiana trybu po kliknięciu przycisku
document.getElementById('toggle-mode-btn').addEventListener('click', async () => {
    const nextMode = currentMode === 'history' ? 'planning' : 'history';
    
    try {
        const response = await fetch('/api/web/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: nextMode })
        });
        const data = await response.json();
        if (data.success) {
            currentMode = data.mode;
            updateUI();
        }
    } catch (err) {
        alert('Nie udało się zmienić trybu pracy serwera.');
    }
});

// --- TRYB HISTORII: Rysowanie ścieżki z SQLite ---
async function loadRouteHistory() {
    try {
        const response = await fetch('/api/web/history');
        const result = await response.json();

        if (!result.success || result.data.length === 0) {
            console.log('Brak danych historycznych w bazie.');
            return;
        }

        // Mapowanie punktów z bazy do formatu akceptowanego przez Leaflet [[lat, lng], [lat, lng]...]
        const latLngs = result.data.map(row => [row.lat, row.lng]);

        // 1. Rysowanie linii ciągłej (przebytej trasy)
        const polyline = L.polyline(latLngs, {
            color: '#007bff', 
            weight: 4, 
            opacity: 0.8,
            dashArray: '5, 10' // Linia kreskowana dla ładniejszego efektu trasy
        }).addTo(historyLayer);

        // 2. Opcjonalnie: Postawienie specjalnego markera w ostatniej znanej pozycji
        const lastPoint = result.data[result.data.length - 1];
        const lastMarker = L.circleMarker([lastPoint.lat, lastPoint.lng], {
            radius: 8,
            fillColor: '#ff2e63',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
        }).bindPopup(`<b>Ostatnia pozycja urządzenia</b><br>Czas: ${lastPoint.timestamp}`).addTo(historyLayer);

        // Automatyczne dopasowanie widoku mapy, aby cała trasa była widoczna
        map.fitBounds(polyline.getBounds());

    } catch (err) {
        console.error('Błąd ładowania historii:', err);
    }
}

// --- TRYB PLANOWANIA: Klikanie na mapie ---
map.on('click', function(e) {
    // BLOKADA: Jeśli nie jesteśmy w trybie planowania, kliknięcie nic nie robi
    if (currentMode !== 'planning') return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    selectedWaypoints.push({ lat, lng });

    const marker = L.marker([lat, lng])
        .bindPopup(`<b>Punkt ${selectedWaypoints.length}</b>`);
    
    waypointsLayer.addLayer(marker);
});

// Obsługa przycisków wysyłania i czyszczenia (Zostają z poprzedniego kodu, zmieniamy tylko warstwę czyszczącą)
document.getElementById('send-btn').addEventListener('click', async () => {
    if (selectedWaypoints.length === 0) return alert('Wybierz punkty!');
    try {
        const response = await fetch('/api/device/waypoints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: selectedWaypoints })
        });
        const result = await response.json();
        if (response.ok && result.success) alert(result.message);
    } catch (error) {
        alert('Błąd sieci.');
    }
});

document.getElementById('clear-btn').addEventListener('click', () => {
    selectedWaypoints = [];
    waypointsLayer.clearLayers();
});

// Uruchomienie synchronizacji przy startowym wejściu na stronę
fetchCurrentMode();

// NOWOŚĆ: Obsługa przycisku usuwania historii z bazy danych
document.getElementById('clear-history-btn').addEventListener('click', async () => {
    // Bezpieczeństwo: Potwierdzenie decyzji przez użytkownika
    const confirmation = confirm('Czy na pewno chcesz BEZPOWROTNIE usunąć całą historię tras z bazy danych?');
    if (!confirmation) return; // Jeśli użytkownik kliknie "Anuluj", nic się nie dzieje

    try {
        // Wysłanie zapytania DELETE do serwera
        const response = await fetch('/api/web/history', {
            method: 'DELETE'
        });
        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            // Wyczyszczenie rysunku ścieżki i markerów bezpośrednio z mapy bez przeładowania strony
            historyLayer.clearLayers(); 
        } else {
            alert('Wystąpił błąd: ' + (result.error || 'Nieznany błąd serwera.'));
        }
    } catch (error) {
        console.error('Błąd komunikacji z serwerem:', error);
        alert('Błąd sieci. Serwer nie odpowiada.');
    }
});