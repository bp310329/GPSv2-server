// src/controllers/mapController.js
const { getDB } = require('../config/db');

// Domyślny tryb serwera: 'history' (przeglądanie) lub 'planning' (planowanie trasy)
let currentMode = 'history';

// Zwraca obecny tryb (dla urządzenia i frontendu)
exports.getCurrentMode = (req, res) => {
    res.status(200).json({ success: true, mode: currentMode });
};

// Zmienia tryb na serwerze
exports.setMode = (req, res) => {
    const { mode } = req.body;
    if (mode === 'history' || mode === 'planning') {
        currentMode = mode;
        console.log(`[SERWER] Zmieniono tryb pracy na: ${currentMode.toUpperCase()}`);
        return res.status(200).json({ success: true, mode: currentMode });
    }
    return res.status(400).json({ success: false, error: 'Nieprawidłowy tryb.' });
};

// Zapis punktów wysłanych z przeglądarki do bazy danych
exports.saveWaypoints = async (req, res) => {
    const { points } = req.body;

    if (!points || !Array.isArray(points) || points.length === 0) {
        return res.status(400).json({ success: false, error: 'Brak punktów lub nieprawidłowy format.' });
    }

    try {
        const db = getDB();

        // Usuwamy stare, wciąż nieodebrane punkty (czyszczenie poprzedniej trasy)
        await db.run("DELETE FROM waypoints WHERE status = 'pending'");

        // Przygotowanie zapytania (Prepared Statement) dla wydajności i bezpieczeństwa przed SQL Injection
        const stmt = await db.prepare("INSERT INTO waypoints (latitude, longitude, status) VALUES (?, ?, 'pending')");
        
        // Zapis każdego punktu w pętli
        for (const point of points) {
            await stmt.run(point.lat, point.lng);
        }
        
        // Zamknięcie zapytania
        await stmt.finalize();

        console.log(`[SQLITE] Zapisano ${points.length} nowych punktów nawigacyjnych.`);
        return res.status(200).json({ success: true, message: 'Punkty trasy zapisane w bazie danych.' });

    } catch (error) {
        console.error('Błąd zapisu do SQLite:', error);
        return res.status(500).json({ success: false, error: 'Błąd bazy danych.' });
    }
};

// Urządzenie (tracker) odpytuje o nowe punkty
exports.getPendingWaypoints = async (req, res) => {
    try {
        const db = getDB();
        
        // Pobieramy punkty oznaczone jako oczekujące ('pending')
        // Używamy aliasu 'as lat/lng' aby zachować format JSON oczekiwany przez frontend/urządzenie
        const rows = await db.all("SELECT latitude as lat, longitude as lng FROM waypoints WHERE status = 'pending'");

        res.status(200).json({
            success: true,
            points: rows
        });

        // Opcjonalnie: po pobraniu punktów przez urządzenie oznaczamy je jako wysłane, 
        // dzięki czemu przy kolejnym odpytaniu urządzenie nie dostanie duplikatu trasy.
        if (rows.length > 0) {
            await db.run("UPDATE waypoints SET status = 'sent' WHERE status = 'pending'");
            console.log(`[SQLITE] Punkty trasy zostały przekazane urządzeniu i oznaczone jako wysłane.`);
        }

    } catch (error) {
        console.error('Błąd odczytu z SQLite:', error);
        res.status(500).json({ success: false, error: 'Błąd bazy danych.' });
    }
};