const express = require('express');
const cors = require('cors');
const fs = require('fs');
const pool = require('./db/pool');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const visionRoutes = require('./routes/vision');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vision', visionRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Initialise le schéma DB au démarrage si besoin
async function initDb() {
  try {
    const schema = fs.readFileSync(__dirname + '/db/schema.sql', 'utf8');
    await pool.query(schema);
    console.log('Schéma PostgreSQL initialisé avec succès');
  } catch (err) {
    console.error('Erreur initialisation schéma:', err.message);
  }
}

const PORT = process.env.PORT || 3001;
initDb().then(() => {
  app.listen(PORT, () => console.log(`BodyTrack backend running on :${PORT}`));
});
