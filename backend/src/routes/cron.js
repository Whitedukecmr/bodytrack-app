const express = require('express');
const pool = require('../db/pool');
const { sendEmail, reminderEmail } = require('../utils/email');

const router = express.Router();

// Clé secrète partagée avec le cron, différente du JWT utilisateur
const CRON_SECRET = process.env.CRON_SECRET;

function requireCronSecret(req, res, next) {
  const provided = req.headers['x-cron-secret'];
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

// Appelée par cron à 10h (matin), 14h (midi), 20h (soir) heure de Paris
// ?moment=matin|midi|soir
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
