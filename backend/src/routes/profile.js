const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal } = require('../utils/metabolic');

const router = express.Router();
router.use(requireAuth);

router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, prenom, nom, sexe, age, taille_cm, poids_initial_kg, poids_objectif_kg, niveau_activite FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard du jour : déficit calorique net, repas du jour, activité du jour
router.get('/dashboard/today', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Dernière composition corporelle connue (sinon poids initial du profil)
    const bodyResult = await pool.query(
      `SELECT * FROM body_composition WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1`,
      [req.userId]
    );
    const dernierPoids = Number(bodyResult.rows[0]?.poids_kg ?? user.poids_initial_kg);

    const bmr = calcBMR({
      sexe: user.sexe,
      age: user.age,
      taille_cm: user.taille_cm,
      poids_kg: dernierPoids,
    });
    const tdee = calcTDEE(bmr, user.niveau_activite);

    const mealsResult = await pool.query(
      `SELECT * FROM meals WHERE user_id = $1 AND logged_at::date = CURRENT_DATE ORDER BY logged_at ASC`,
      [req.userId]
    );
    const activitiesResult = await pool.query(
      `SELECT * FROM activities WHERE user_id = $1 AND logged_at::date = CURRENT_DATE ORDER BY logged_at ASC`,
      [req.userId]
    );

    const caloriesIngerees = mealsResult.rows.reduce((sum, m) => sum + (m.calories || 0), 0);
    const caloriesActivite = activitiesResult.rows.reduce((sum, a) => sum + (a.calories_brulees || 0), 0);

    // Dépense du jour = TDEE (métabolisme de base + NEAT estimé) + activité spécifique loggée en plus
    const depenseDuJour = tdee + caloriesActivite;
    const deficitNet = depenseDuJour - caloriesIngerees;

    const bmi = calcBMI(dernierPoids, user.taille_cm);

    res.json({
      bmr,
      tdee,
      caloriesIngerees,
      caloriesActivite,
      depenseDuJour,
      deficitNet,
      bmi,
      poidsActuel: dernierPoids,
      poidsObjectif: user.poids_objectif_kg,
      repas: mealsResult.rows,
      activites: activitiesResult.rows,
    });
  } catch (err) {
    console.error('Erreur dashboard:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Historique de progression (poids + composition corporelle au fil du temps)
router.get('/dashboard/progress', async (req, res) => {
  try {
    const bodyResult = await pool.query(
      `SELECT * FROM body_composition WHERE user_id = $1 ORDER BY logged_at ASC`,
      [req.userId]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const history = bodyResult.rows;
    const poidsActuel = history.length > 0 ? history[history.length - 1].poids_kg : user.poids_initial_kg;

    // Déficit moyen sur les 7 derniers jours pour estimer le rythme
    const deficitResult = await pool.query(
      `SELECT
        COALESCE(SUM(m.calories), 0) as total_ingere
       FROM meals m
       WHERE m.user_id = $1 AND m.logged_at > NOW() - INTERVAL '7 days'`,
      [req.userId]
    );

    const bmr = calcBMR({
      sexe: user.sexe,
      age: user.age,
      taille_cm: user.taille_cm,
      poids_kg: poidsActuel,
    });
    const tdee = calcTDEE(bmr, user.niveau_activite);
    const totalIngereSemaine = +deficitResult.rows[0].total_ingere;
    const deficitMoyenJournalier = tdee - (totalIngereSemaine / 7);

    const semainesRestantes = estimateWeeksToGoal(poidsActuel, user.poids_objectif_kg, deficitMoyenJournalier);

    res.json({
      history,
      poidsActuel,
      poidsObjectif: user.poids_objectif_kg,
      poidsInitial: user.poids_initial_kg,
      deficitMoyenJournalier: Math.round(deficitMoyenJournalier),
      semainesRestantes,
    });
  } catch (err) {
    console.error('Erreur progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
