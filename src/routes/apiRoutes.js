const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const deviceController = require('../controllers/deviceController');

// --- ENDPOINTY DLA URZĄDZENIA (TRACKERA) ---
// NOWOŚĆ: Urządzenie odpytuje o aktualny tryb pracy ('history' lub 'planning')
router.get('/device/mode', mapController.getCurrentMode);
router.get('/device/pending-waypoints', mapController.getPendingWaypoints);
router.post('/device/telemetry', deviceController.receiveTelemetry);

// --- ENDPOINTY DLA STRONY WWW (FRONTEND) ---
// NOWOŚĆ: Zmiana trybu pracy przez użytkownika na stronie
router.post('/web/mode', mapController.setMode);
// NOWOŚĆ: Pobranie historii współrzędnych z tabeli `gps_data` w celu narysowania trasy
router.get('/web/history', deviceController.getHistory);
router.delete('/web/history', deviceController.clearHistory);

router.post('/device/waypoints', mapController.saveWaypoints);

module.exports = router;