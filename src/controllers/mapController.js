// Tymczasowa tablica w pamięci RAM serwera zastępująca bazę danych na czas testów
let temporaryWaypoints = [];

// Obsługa zapisu punktów wysłanych z przeglądarki
exports.saveWaypoints = (req, res) => {
    const { points } = req.body;

    if (!points || !Array.isArray(points) || points.length === 0) {
        return res.status(400).json({ success: false, error: 'Brak punktów lub nieprawidłowy format danych.' });
    }

    // Zapisujemy przesłane punkty w pamięci serwera
    temporaryWaypoints = points;

    console.log('\n=======================================');
    console.log(`[SERWER] Zapisano nową trasę (${points.length} punktów) oczekującą na urządzenie:`);
    console.log(temporaryWaypoints);
    console.log('=======================================');

    return res.status(200).json({ 
        success: true, 
        message: `Pomyślnie wysłano ${points.length} punktów na serwer.` 
    });
};

// Obsługa odpytywania (Polling) przez urządzenie GPS
exports.getPendingWaypoints = (req, res) => {
    // Zwracamy urządzeniu aktualną listę punktów trasy
    res.status(200).json({
        success: true,
        points: temporaryWaypoints
    });

    // Opcjonalnie: Jeśli chcesz, aby punkty znikały z serwera po ich odebraniu przez tracker,
    // odkomentuj poniższą linijkę:
    // temporaryWaypoints = [];
};