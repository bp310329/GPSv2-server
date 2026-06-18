// src/config/db.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbConnection = null;

async function initDB() {
    // Otwarcie połączenia z plikiem bazy danych
    dbConnection = await open({
        filename: path.join(__dirname, '../../database.sqlite'),
        driver: sqlite3.Database
    });

    // 1. Tabela telemetryczna (dokładnie taka jak w Twoim kodzie we Flasku)
    await dbConnection.exec(`
        CREATE TABLE IF NOT EXISTS gps_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            timestamp TEXT,
            latitude REAL,
            longitude REAL
        )
    `);

    // 2. NOWA Tabela na punkty wyznaczane na mapie (Waypoints)
    await dbConnection.exec(`
        CREATE TABLE IF NOT EXISTS waypoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'pending', -- 'pending' lub 'sent'
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('[Baza Danych] SQLite została pomyślnie zainicjalizowana.');
    return dbConnection;
}

// Funkcja pomocnicza do pobierania aktywnego połączenia w kontrolerach
function getDB() {
    if (!dbConnection) {
        throw new Error('Baza danych nie została jeszcze zainicjalizowana!');
    }
    return dbConnection;
}

module.exports = { initDB, getDB };