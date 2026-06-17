const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken } = require('../middleware/auth');
const { sendEmail, welcomeEmail } = require('../utils/email');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const {
      email, password, prenom, nom, sexe, age,
      taille_cm, poids_initial_kg, poids_objectif_kg, niveau_activite
    } = req.body;

    if (!email || !password || !prenom || !nom || !age || !taille_cm || !poids_initial_kg || !poids_objectif_kg) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, prenom, nom, sexe, age, taille_cm, poids_initial_kg, poids_objectif_kg, niveau_activite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, email, prenom, nom`,
      [email, password_hash, prenom, nom, sexe || 'homme', age, taille_cm, poids_initial_kg, poids_objectif_kg, niveau_activite || 'modere']
    );

    const user = result.rows[0];
    const token = signToken(user.id);

    const { subject, html } = welcomeEmail(user.prenom);
    sendEmail({ to: user.email, subject, html }).catch(err => console.error('Erreur email bienvenue:', err.message));

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Erreur register:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = signToken(user.id);
    delete user.password_hash;

    res.json({ token, user });
  } catch (err) {
    console.error('Erreur login:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

module.exports = router;
