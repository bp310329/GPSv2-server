const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware do automatycznego parsowania JSON w żądaniach
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serwowanie plików statycznych z folderu public (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Podpięcie wszystkich tras API z przedrostkiem /api
app.use('/api', apiRoutes);

// Domyślna ścieżka serwująca stronę główną z mapą
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Serwer GPS Tracker działa na http://localhost:${PORT}`);
});