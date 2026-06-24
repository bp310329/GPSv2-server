// src/controllers/mapController.js
const { json } = require('express');
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
        const BATCH_LIMIT = 5;

        // 1. Pobieramy max 5 punktów 'pending'
        const rows = await db.all(
            "SELECT id, latitude as lat, longitude as lng FROM waypoints WHERE status = 'pending' LIMIT ?", 
            [BATCH_LIMIT]
        );

        // 2. NAJPIERW aktualizujemy bazę danych i czekamy na zakończenie zapisu (await)
        if (rows.length > 0) {
            const ids = rows.map(r => r.id);
            const placeholders = ids.map(() => "?").join(", ");
            
            await db.run(`UPDATE waypoints SET status = 'sent' WHERE id IN (${placeholders})`, ids);
            console.log(`[SQLITE] Zablokowano i oznaczono paczkę ${rows.length} punktów jako wysłane.`);
        }

        const pointsToSend = rows.map(r => ({ lat: r.lat, lng: r.lng }));

        // 3. DOPIERO TERAZ, gdy baza jest bezpieczna, wysyłamy odpowiedź do ESP32
        return res.status(200).json({
            success: true,
            points: pointsToSend
        });

    } catch (error) {
        console.error('Błąd odczytu z SQLite:', error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, error: 'Błąd bazy danych.' });
        }
    }
};