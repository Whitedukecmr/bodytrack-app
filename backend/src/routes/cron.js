const express = require('express');
const pool = require('../db/pool');
const { sendEmail, reminderEmail } = require('../utils/email');

const router = express.Router();

const CRON_SECRET = process.env.CRON_SECRET;

function requireCronSecret(req, res, next) {
  const provided = req.headers['x-cron-secret'];
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

// ── Import historique pesées ───────────────────────────────────
// Endpoint temporaire protégé par CRON_SECRET
router.post('/import-weight-history', requireCronSecret, async (req, res) => {
  try {
    const { user_id, entries } = req.body;
    if (!user_id || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'user_id et entries[] requis' });
    }

    // Vérifie que l'utilisateur existe
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: `Utilisateur ${user_id} introuvable` });
    }

    let inserted = 0;
    const results = [];

    for (const entry of entries) {
      const { poids_kg, date } = entry;
      if (!poids_kg || !date) continue;

      // Vérifie si une pesée existe déjà à cette date pour éviter les doublons
      const existing = await pool.query(
        `SELECT id FROM body_composition WHERE user_id = $1 AND logged_at::date = $2::date LIMIT 1`,
        [user_id, date]
      );

      if (existing.rows.length > 0) {
        results.push({ date, status: 'skipped (déjà existant)' });
        continue;
      }

      await pool.query(
        `INSERT INTO body_composition (user_id, poids_kg, logged_at) VALUES ($1, $2, $3::date + TIME '08:00:00')`,
        [user_id, poids_kg, date]
      );
      inserted++;
      results.push({ date, poids_kg, status: 'inserted' });
    }

    res.json({
      user: userCheck.rows[0].email,
      inserted,
      total: entries.length,
      results
    });
  } catch (err) {
    console.error('Erreur import-weight-history:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/check-reminders', requireCronSecret, async (req, res) => {
  const moment = req.query.moment;
  if (!['matin', 'midi', 'soir'].includes(moment)) {
    return res.status(400).json({ error: 'Paramètre moment invalide (matin/midi/soir)' });
  }

  try {
    const usersResult = await pool.query('SELECT id, email, prenom FROM users');
    let sent = 0;

    for (const user of usersResult.rows) {
      const mealResult = await pool.query(
        `SELECT id FROM meals WHERE user_id = $1 AND moment = $2 AND logged_at::date = CURRENT_DATE LIMIT 1`,
        [user.id, moment]
      );

      if (mealResult.rows.length === 0) {
        const { subject, html } = reminderEmail(user.prenom, moment);
        await sendEmail({ to: user.email, subject, html });
        sent++;
      }
    }

    res.json({ moment, usersChecked: usersResult.rows.length, remindersSent: sent });
  } catch (err) {
    console.error('Erreur check-reminders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

  const moment = req.query.moment;
  if (!['matin', 'midi', 'soir'].includes(moment)) {
    return res.status(400).json({ error: 'Paramètre moment invalide (matin/midi/soir)' });
  }

  try {
    const usersResult = await pool.query('SELECT id, email, prenom FROM users');
    let sent = 0;

    for (const user of usersResult.rows) {
      const mealResult = await pool.query(
        `SELECT id FROM meals WHERE user_id = $1 AND moment = $2 AND logged_at::date = CURRENT_DATE LIMIT 1`,
        [user.id, moment]
      );

      if (mealResult.rows.length === 0) {
        const { subject, html } = reminderEmail(user.prenom, moment);
        await sendEmail({ to: user.email, subject, html });
        sent++;
      }
    }

    res.json({ moment, usersChecked: usersResult.rows.length, remindersSent: sent });
  } catch (err) {
    console.error('Erreur check-reminders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
