const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal, calcObjectifsJournaliers } = require('../utils/metabolic');
const { analyzeBilan } = require('../utils/coach');

const router = express.Router();
router.use(requireAuth);

router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, prenom, nom, sexe, age, taille_cm, poids_initial_kg, poids_objectif_kg,
              niveau_activite, objectif_proteines_g, objectif_glucides_g, objectif_lipides_g
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', async (req, res) => {
  try {
    const {
      prenom, nom, sexe, age, taille_cm, poids_objectif_kg, niveau_activite,
      objectif_proteines_g, objectif_glucides_g, objectif_lipides_g
    } = req.body;

    const niveauxValides = ['sedentaire', 'leger', 'modere', 'actif', 'tres_actif'];
    if (niveau_activite && !niveauxValides.includes(niveau_activite)) {
      return res.status(400).json({ error: 'Niveau d\'activité invalide' });
    }
    if (sexe && !['homme', 'femme'].includes(sexe)) {
      return res.status(400).json({ error: 'Sexe invalide' });
    }

    const result = await pool.query(
      `UPDATE users SET
        prenom = COALESCE($1, prenom),
        nom = COALESCE($2, nom),
        sexe = COALESCE($3, sexe),
        age = COALESCE($4, age),
        taille_cm = COALESCE($5, taille_cm),
        poids_objectif_kg = COALESCE($6, poids_objectif_kg),
        niveau_activite = COALESCE($7, niveau_activite),
        objectif_proteines_g = $8,
        objectif_glucides_g = $9,
        objectif_lipides_g = $10
      WHERE id = $11
      RETURNING id, email, prenom, nom, sexe, age, taille_cm, poids_initial_kg, poids_objectif_kg,
                niveau_activite, objectif_proteines_g, objectif_glucides_g, objectif_lipides_g`,
      [prenom, nom, sexe, age, taille_cm, poids_objectif_kg, niveau_activite,
       objectif_proteines_g ?? null, objectif_glucides_g ?? null, objectif_lipides_g ?? null, req.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update profil:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/today', async (req, res) => {
  try {
    const targetDate = req.query.date || null;

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const bodyResult = await pool.query(
      targetDate
        ? `SELECT * FROM body_composition WHERE user_id = $1 AND logged_at::date <= $2 ORDER BY logged_at DESC LIMIT 1`
        : `SELECT * FROM body_composition WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1`,
      targetDate ? [req.userId, targetDate] : [req.userId]
    );
    const dernierPoids = Number(bodyResult.rows[0]?.poids_kg ?? user.poids_initial_kg);

    const bmr = calcBMR({ sexe: user.sexe, age: user.age, taille_cm: user.taille_cm, poids_kg: dernierPoids });
    const tdee = calcTDEE(bmr, user.niveau_activite);

    const mealsResult = await pool.query(
      targetDate
        ? `SELECT * FROM meals WHERE user_id = $1 AND logged_at::date = $2 ORDER BY logged_at ASC`
        : `SELECT * FROM meals WHERE user_id = $1 AND logged_at::date = CURRENT_DATE ORDER BY logged_at ASC`,
      targetDate ? [req.userId, targetDate] : [req.userId]
    );
    const activitiesResult = await pool.query(
      targetDate
        ? `SELECT * FROM activities WHERE user_id = $1 AND logged_at::date = $2 ORDER BY logged_at ASC`
        : `SELECT * FROM activities WHERE user_id = $1 AND logged_at::date = CURRENT_DATE ORDER BY logged_at ASC`,
      targetDate ? [req.userId, targetDate] : [req.userId]
    );

    const caloriesIngerees = mealsResult.rows.reduce((sum, m) => sum + (m.calories || 0), 0);
    const caloriesActivite = activitiesResult.rows.reduce((sum, a) => sum + (a.calories_brulees || 0), 0);
    const proteinesTotales = mealsResult.rows.reduce((sum, m) => sum + Number(m.proteines_g || 0), 0);
    const glucidesTotales = mealsResult.rows.reduce((sum, m) => sum + Number(m.glucides_g || 0), 0);
    const lipidesTotales = mealsResult.rows.reduce((sum, m) => sum + Number(m.lipides_g || 0), 0);
    const fibresTotales = mealsResult.rows.reduce((sum, m) => sum + Number(m.fibres_g || 0), 0);

    const depenseDuJour = tdee + caloriesActivite;
    const deficitNet = depenseDuJour - caloriesIngerees;
    const bmi = calcBMI(dernierPoids, user.taille_cm);

    const analyseCoach = analyzeBilan({
      deficitNet, caloriesIngerees, proteinesTotales, glucidesTotales, lipidesTotales,
      nbRepas: mealsResult.rows.length,
      joursAvecDonnees: caloriesIngerees > 0 ? 1 : 0,
    });

    // Objectifs journaliers selon la méthode de la vidéo
    const objAuto = calcObjectifsJournaliers({
      sexe: user.sexe,
      poids_kg: dernierPoids,
      poids_objectif_kg: user.poids_objectif_kg,
    });

    const objectifs = {
      calories_cible: objAuto.calories,
      proteines_g: user.objectif_proteines_g != null ? Number(user.objectif_proteines_g) : objAuto.proteines,
      glucides_g: user.objectif_glucides_g != null ? Number(user.objectif_glucides_g) : objAuto.glucides,
      lipides_g: user.objectif_lipides_g != null ? Number(user.objectif_lipides_g) : objAuto.lipides,
      fibres_g: objAuto.fibres,
      proteines_personnalise: user.objectif_proteines_g != null,
      lipides_personnalise: user.objectif_lipides_g != null,
    };

    res.json({
      date: targetDate || new Date().toISOString().slice(0, 10),
      bmr, tdee, caloriesIngerees, caloriesActivite, depenseDuJour, deficitNet, bmi,
      poidsActuel: dernierPoids,
      poidsObjectif: user.poids_objectif_kg,
      repas: mealsResult.rows,
      activites: activitiesResult.rows,
      objectifs,
      bilan: {
        proteinesTotales: +proteinesTotales.toFixed(1),
        glucidesTotales: +glucidesTotales.toFixed(1),
        lipidesTotales: +lipidesTotales.toFixed(1),
        fibresTotales: +fibresTotales.toFixed(1),
        caloriesIngerees, bmr, caloriesActivite, depenseDuJour, deficitNet, analyseCoach,
      },
    });
  } catch (err) {
    console.error('Erreur dashboard:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/range', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const result = await pool.query(
      `WITH jours AS (
        SELECT generate_series($2::date - ($3::int - 1), $2::date, '1 day')::date AS jour
      ),
      repas_jour AS (
        SELECT logged_at::date AS jour, COALESCE(SUM(calories), 0) AS calories_ingerees, COUNT(*) AS nb_repas,
               COALESCE(SUM(proteines_g), 0) AS proteines, COALESCE(SUM(glucides_g), 0) AS glucides, COALESCE(SUM(lipides_g), 0) AS lipides
        FROM meals
        WHERE user_id = $1
        GROUP BY logged_at::date
      ),
      activite_jour AS (
        SELECT logged_at::date AS jour, COALESCE(SUM(calories_brulees), 0) AS calories_activite
        FROM activities
        WHERE user_id = $1
        GROUP BY logged_at::date
      )
      SELECT
        jours.jour,
        COALESCE(repas_jour.calories_ingerees, 0) AS calories_ingerees,
        COALESCE(repas_jour.nb_repas, 0) AS nb_repas,
        COALESCE(repas_jour.proteines, 0) AS proteines,
        COALESCE(repas_jour.glucides, 0) AS glucides,
        COALESCE(repas_jour.lipides, 0) AS lipides,
        COALESCE(activite_jour.calories_activite, 0) AS calories_activite
      FROM jours
      LEFT JOIN repas_jour ON repas_jour.jour = jours.jour
      LEFT JOIN activite_jour ON activite_jour.jour = jours.jour
      ORDER BY jours.jour ASC`,
      [req.userId, endDate, days]
    );

    const bodyResult = await pool.query(
      `SELECT * FROM body_composition WHERE user_id = $1 AND logged_at::date <= $2 ORDER BY logged_at DESC LIMIT 1`,
      [req.userId, endDate]
    );
    const poidsRef = Number(bodyResult.rows[0]?.poids_kg ?? user.poids_initial_kg);
    const bmr = calcBMR({ sexe: user.sexe, age: user.age, taille_cm: user.taille_cm, poids_kg: poidsRef });
    const tdee = calcTDEE(bmr, user.niveau_activite);

    const jours = result.rows.map(r => {
      const depenseDuJour = tdee + Number(r.calories_activite);
      const deficitNet = depenseDuJour - Number(r.calories_ingerees);
      return {
        date: r.jour.toISOString().slice(0, 10),
        caloriesIngerees: Number(r.calories_ingerees),
        caloriesActivite: Number(r.calories_activite),
        depenseDuJour, deficitNet,
        nbRepas: Number(r.nb_repas),
      };
    });

    const deficitMoyen = jours.reduce((sum, j) => sum + j.deficitNet, 0) / jours.length;

    const caloriesIngereesTotal = result.rows.reduce((sum, r) => sum + Number(r.calories_ingerees), 0);
    const proteinesTotales = result.rows.reduce((sum, r) => sum + Number(r.proteines), 0);
    const glucidesTotales = result.rows.reduce((sum, r) => sum + Number(r.glucides), 0);
    const lipidesTotales = result.rows.reduce((sum, r) => sum + Number(r.lipides), 0);
    const caloriesActiviteTotal = result.rows.reduce((sum, r) => sum + Number(r.calories_activite), 0);
    const joursAvecDonnees = result.rows.filter(r => Number(r.nb_repas) > 0).length;
    const depenseTotale = (tdee * days) + caloriesActiviteTotal;
    const deficitNetTotal = Math.round(depenseTotale - caloriesIngereesTotal);

    const analyseCoach = analyzeBilan({
      deficitNet: deficitNetTotal, caloriesIngerees: caloriesIngereesTotal,
      proteinesTotales, glucidesTotales, lipidesTotales,
      nbRepas: result.rows.reduce((sum, r) => sum + Number(r.nb_repas), 0),
      joursAvecDonnees,
    });

    res.json({
      days, tdee, deficitMoyen: Math.round(deficitMoyen), jours,
      bilan: {
        proteinesTotales: +proteinesTotales.toFixed(1),
        glucidesTotales: +glucidesTotales.toFixed(1),
        lipidesTotales: +lipidesTotales.toFixed(1),
        caloriesIngerees: caloriesIngereesTotal, bmr,
        caloriesActivite: caloriesActiviteTotal,
        depenseDuJour: Math.round(depenseTotale),
        deficitNet: deficitNetTotal, joursAvecDonnees, analyseCoach,
      },
    });
  } catch (err) {
    console.error('Erreur dashboard/range:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/progress', async (req, res) => {
  try {
    const bodyResult = await pool.query(
      `SELECT * FROM body_composition WHERE user_id = $1 ORDER BY logged_at ASC`,
      [req.userId]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const history = bodyResult.rows;
    const poidsActuel = Number(history.length > 0 ? history[history.length - 1].poids_kg : user.poids_initial_kg);

    const deficitSemaineResult = await pool.query(
      `SELECT COALESCE(SUM(m.calories), 0) as total_ingere
       FROM meals m WHERE m.user_id = $1 AND m.logged_at > NOW() - INTERVAL '7 days'`,
      [req.userId]
    );

    const bmr = calcBMR({ sexe: user.sexe, age: user.age, taille_cm: user.taille_cm, poids_kg: poidsActuel });
    const tdee = calcTDEE(bmr, user.niveau_activite);
    const totalIngereSemaine = +deficitSemaineResult.rows[0].total_ingere;
    const deficitMoyenJournalier = tdee - (totalIngereSemaine / 7);

    const semainesRestantes = estimateWeeksToGoal(poidsActuel, user.poids_objectif_kg, deficitMoyenJournalier);

    const debut30j = new Date();
    debut30j.setDate(debut30j.getDate() - 30);
    const debut30jStr = debut30j.toISOString().slice(0, 10);

    const recapResult = await pool.query(
      `SELECT COALESCE(SUM(m.calories), 0) AS total_ingere_30j, COUNT(DISTINCT m.logged_at::date) AS jours_actifs
       FROM meals m WHERE m.user_id = $1 AND m.logged_at >= $2`,
      [req.userId, debut30jStr]
    );
    const activite30jResult = await pool.query(
      `SELECT COALESCE(SUM(calories_brulees), 0) AS total_activite_30j
       FROM activities WHERE user_id = $1 AND logged_at >= $2`,
      [req.userId, debut30jStr]
    );

    const joursActifs30j = Number(recapResult.rows[0].jours_actifs);
    const totalIngere30j = Number(recapResult.rows[0].total_ingere_30j);
    const totalActivite30j = Number(activite30jResult.rows[0].total_activite_30j);
    const depenseEstimee30j = (tdee * joursActifs30j) + totalActivite30j;
    const deficitCumule30j = Math.round(depenseEstimee30j - totalIngere30j);

    const poidsIl30jResult = await pool.query(
      `SELECT poids_kg FROM body_composition WHERE user_id = $1 AND logged_at >= $2 ORDER BY logged_at ASC LIMIT 1`,
      [req.userId, debut30jStr]
    );
    const poidsDebutPeriode = Number(poidsIl30jResult.rows[0]?.poids_kg ?? user.poids_initial_kg);
    const poidsPerduReel = +(poidsDebutPeriode - poidsActuel).toFixed(1);

    const perteGrasEstimeeKg = +(deficitCumule30j / 7700).toFixed(1);

    const totalARestant = +(poidsActuel - user.poids_objectif_kg).toFixed(1);
    const progressionPct = user.poids_initial_kg > user.poids_objectif_kg
      ? Math.min(100, Math.round(((user.poids_initial_kg - poidsActuel) / (user.poids_initial_kg - user.poids_objectif_kg)) * 100))
      : 0;

    res.json({
      history,
      poidsActuel,
      poidsObjectif: user.poids_objectif_kg,
      poidsInitial: user.poids_initial_kg,
      deficitMoyenJournalier: Math.round(deficitMoyenJournalier),
      semainesRestantes,
      recapMensuel: {
        joursActifs30j, deficitCumule30j, poidsPerduReel, perteGrasEstimeeKg, totalARestant, progressionPct,
      },
    });
  } catch (err) {
    console.error('Erreur progress:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
