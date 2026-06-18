// src/controllers/deviceController.js
const { getDB } = require('../config/db');

// Pobieranie całej historii przejechanej trasy dla frontendu
exports.getHistory = async (req, res) => {
    try {
        const db = getDB();
        // Pobieramy punkty posortowane od najstarszego do najnowszego
        const rows = await db.all("SELECT latitude as lat, longitude as lng, timestamp FROM gps_data ORDER BY id ASC");
        
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Błąd pobierania historii trasy:', error);
        res.status(500).json({ success: false, error: 'Błąd bazy danych.' });
    }
};

exports.receiveTelemetry = async (req, res) => {
    const { deviceId, lat, lng } = req.body;

    if (!deviceId || !lat || !lng) {
        return res.status(400).json({ success: false, error: 'Niekompletne dane telemetryczne.' });
    }

    try {
        const db = getDB();
        const currentTimestamp = new Date().toISOString(); // Generowanie ISO timestamp w Node.js

        // Wstawienie danych pozycji do tabeli gps_data
        await db.run(
            "INSERT INTO gps_data (device_id, timestamp, latitude, longitude) VALUES (?, ?, ?, ?)",
            [deviceId, currentTimestamp, lat, lng]
        );

        console.log(`[SQLITE] Zapisano pozycję trackera ${deviceId}: [${lat}, ${lng}]`);
        return res.status(200).json({ success: true, message: 'Pozycja GPS zapisana w bazie danych.' });

    } catch (error) {
        console.error('Błąd zapisu telemetrii do SQLite:', error);
        return res.status(500).json({ success: false, error: 'Błąd serwera przy zapisie pozycji.' });
    }
};

// NOWOŚĆ: Czyszczenie całej tabeli gps_data w SQLite
exports.clearHistory = async (req, res) => {
    try {
        const db = getDB();
        
        // Wykonanie polecenia SQL usuwającego wszystkie wiersze z tabeli
        await db.run("DELETE FROM gps_data");
        
        console.log('[SQLITE] Cała historia pozycji GPS została trwale usunięta.');
        
        return res.status(200).json({ 
            success: true, 
            message: 'Historia tras została pomyślnie usunięta z bazy danych.' 
        });
    } catch (error) {
        console.error('Błąd podczas czyszczenia historii w SQLite:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Błąd bazy danych podczas próby usunięcia historii.' 
        });
    }
};