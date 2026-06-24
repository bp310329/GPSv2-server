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
    if (!req.body) {
        return res.status(400).json({ success: false, error: 'Brak danych telemetrycznych.' });
    }

    const items = Array.isArray(req.body) ? req.body : [req.body];

    if (items.length === 0) {
        return res.status(400).json({ success: false, error: 'Przesłana paczka danych jest pusta.' });
    }

    for (const item of items) {
        if (!item || !item.device_id || item.lat === undefined || item.lon === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Niekompletne dane telemetryczne w jednym lub wielu wpisach.' 
            });
        }
    }

    try {
        const db = getDB();

        const placeholders = items.map(() => "(?, ?, ?, ?)" ).join(", ");
        const sql = `INSERT INTO gps_data (device_id, timestamp, latitude, longitude) VALUES ${placeholders}`;

        const params = [];
        for (const item of items) {
            const finalTimestamp = item.timestamp || new Date().toISOString();
            params.push(item.device_id, finalTimestamp, item.lat, item.lon);
        }

        await db.run(sql, params);
        
        if (items.length === 1) {
            console.log(`[SQLITE] Zapisano pozycję trackera ${items[0].device_id}: [${items[0].lat}, ${items[0].lon}]`);
        } else {
            console.log(`[SQLITE] Zapisano pomyślnie ${items.length} pozycji do bazy danych.`);
        }
        
        return res.status(200).json({ 
            success: true, 
            message: items.length === 1 
                ? 'Pozycja GPS zapisana w bazie danych.' 
                : `Zapisano batch zawierający ${items.length} pozycji GPS.` 
        });

    } catch (error) {
        console.error('Błąd zapisu telemetrii do SQLite:', error);
        return res.status(500).json({ success: false, error: 'Błąd serwera przy zapisie pozycji.' });
    }
};

exports.clearHistory = async (req, res) => {
    try {
        const db = getDB();
        
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