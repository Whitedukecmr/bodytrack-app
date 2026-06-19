const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── REPAS ──────────────────────────────────────────────────────
router.put('/meals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_repas, moment, calories, proteines_g, glucides_g, lipides_g } = req.body;

    const result = await pool.query(
      `UPDATE meals SET
        nom_repas = COALESCE($1, nom_repas),
        moment = COALESCE($2, moment),
        calories = COALESCE($3, calories),
        proteines_g = COALESCE($4, proteines_g),
        glucides_g = COALESCE($5, glucides_g),
        lipides_g = COALESCE($6, lipides_g)
      WHERE id = $7 AND user_id = $8
      RETURNING *`,
      [nom_repas, moment, calories, proteines_g, glucides_g, lipides_g, id, req.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Repas introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update meal:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/meals/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Repas introuvable' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Erreur delete meal:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ACTIVITÉS ──────────────────────────────────────────────────
router.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type_activite, pas, distance_km, duree_min, frequence_cardiaque_moy, calories_brulees } = req.body;

    const result = await pool.query(
      `UPDATE activities SET
        type_activite = COALESCE($1, type_activite),
        pas = COALESCE($2, pas),
        distance_km = COALESCE($3, distance_km),
        duree_min = COALESCE($4, duree_min),
        frequence_cardiaque_moy = COALESCE($5, frequence_cardiaque_moy),
        calories_brulees = COALESCE($6, calories_brulees)
      WHERE id = $7 AND user_id = $8
      RETURNING *`,
      [type_activite, pas, distance_km, duree_min, frequence_cardiaque_moy, calories_brulees, id, req.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Activité introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur update activity:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/activities/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Activité introuvable' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Erreur delete activity:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── COMPOSITION CORPORELLE (pesées) ───────────────────────────
router.delete('/body-composition/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM body_composition WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pesée introuvable' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Erreur delete body-composition:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
