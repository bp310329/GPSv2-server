exports.receiveTelemetry = (req, res) => {
    // Przykładowa struktura danych wysyłanych przez tracker GPS
    const { deviceId, lat, lng, speed, satellites } = req.body;

    if (!deviceId || !lat || !lng) {
        return res.status(400).json({ success: false, error: 'Niekompletne dane telemetryczne.' });
    }

    console.log(`\n[TELEMETRIA URZĄDZENIA ${deviceId}]`);
    console.log(`Pozycja: ${lat}, ${lng} | Prędkość: ${speed || 0} km/h | Satelity: ${satellites || 0}`);

    // TUTAJ w przyszłości dodasz kod zapisu do bazy (np. do rysowania historycznej ścieżki)

    res.status(200).json({ success: true, message: 'Dane pozycji odebrane przez serwer.' });
};