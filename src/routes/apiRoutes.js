const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const deviceController = require('../controllers/deviceController');

// --- ENDPOINTY DLA STRONY WWW (FRONTEND) ---
// Odbieranie punktów trasy klikniętych przez użytkownika na mapie
router.post('/device/waypoints', mapController.saveWaypoints);


// --- ENDPOINTY DLA URZĄDZENIA (TRACKERA GPS) ---
// Metoda Polling: Urządzenie pyta, czy są dla niego jakieś punkty nawigacji
router.get('/device/pending-waypoints', mapController.getPendingWaypoints);

// Odbieranie danych telemetrycznych (gdzie tracker jest w tym momencie)
router.post('/device/telemetry', deviceController.receiveTelemetry);

module.exports = router;