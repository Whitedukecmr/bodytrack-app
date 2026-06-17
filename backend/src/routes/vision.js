const express = require('express');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const bedrock = new BedrockRuntimeClient({ region: 'eu-west-3' });
const MODEL_ID = 'eu.anthropic.claude-sonnet-4-20250514-v1:0';

function detectMediaType(base64) {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('R0lGO')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

async function askBedrockVision(imageBase64, prompt) {
  const mediaType = detectMediaType(imageBase64);
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: prompt }
      ]
    }]
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrock.send(command);
  const body = JSON.parse(Buffer.from(response.body).toString());
  const text = body.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ── Analyse d'un repas par photo ──────────────────────────────
router.post('/meal', async (req, res) => {
  try {
    const { imageBase64, moment } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image manquante' });

    const prompt = `Analyse ce repas et retourne UNIQUEMENT un JSON valide sans backticks avec ces champs exacts:
{
  "nom_repas": "nom du plat",
  "calories": nombre,
  "proteines_g": nombre,
  "glucides_g": nombre,
  "lipides_g": nombre,
  "fibres_g": nombre,
  "avis_sante": "commentaire nutritionnel court en francais",
  "conseil": "conseil de coach axe sur la recuperation, la gestion de l'insuline et la satiete, en francais",
  "score_sante": nombre entre 1 et 10
}`;

    const analysis = await askBedrockVision(imageBase64, prompt);

    const result = await pool.query(
      `INSERT INTO meals (user_id, moment, nom_repas, calories, proteines_g, glucides_g, lipides_g, fibres_g, avis_sante, conseil, score_sante)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [req.userId, moment || 'collation', analysis.nom_repas, analysis.calories, analysis.proteines_g,
       analysis.glucides_g, analysis.lipides_g, analysis.fibres_g, analysis.avis_sante, analysis.conseil, analysis.score_sante]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur analyse repas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Analyse d'une capture d'écran d'activité (Apple Health, etc.) ─
router.post('/activity', async (req, res) => {
  try {
    const { imageBase64, type_activite } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image manquante' });

    const prompt = `Cette image montre une capture d'écran d'une application de suivi de santé/fitness (Apple Health, Google Fit, montre connectée, ou écran de fin de séance). Extrais les données visibles et retourne UNIQUEMENT un JSON valide sans backticks avec ces champs exacts (mets null si une donnée n'est pas visible):
{
  "type_activite": "marche/musculation/rameur/natation/course/velo/autre",
  "pas": nombre ou null,
  "distance_km": nombre ou null,
  "duree_min": nombre ou null,
  "frequence_cardiaque_moy": nombre ou null,
  "calories_brulees": nombre ou null
}`;

    const analysis = await askBedrockVision(imageBase64, prompt);

    const result = await pool.query(
      `INSERT INTO activities (user_id, type_activite, pas, distance_km, duree_min, frequence_cardiaque_moy, calories_brulees)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.userId, type_activite || analysis.type_activite, analysis.pas, analysis.distance_km,
       analysis.duree_min, analysis.frequence_cardiaque_moy, analysis.calories_brulees]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur analyse activite:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Analyse d'une capture d'écran de balance connectée ────────
router.post('/body-composition', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image manquante' });

    const prompt = `Cette image montre une capture d'écran d'une balance connectée (impédancemétrie) ou d'une application de composition corporelle. Extrais les données visibles et retourne UNIQUEMENT un JSON valide sans backticks avec ces champs exacts (mets null si non visible):
{
  "poids_kg": nombre,
  "masse_grasse_pct": nombre ou null,
  "masse_musculaire_pct": nombre ou null,
  "eau_pct": nombre ou null
}`;

    const analysis = await askBedrockVision(imageBase64, prompt);

    if (!analysis.poids_kg) {
      return res.status(422).json({ error: 'Poids non détecté sur l\'image, réessaie avec une photo plus claire' });
    }

    const result = await pool.query(
      `INSERT INTO body_composition (user_id, poids_kg, masse_grasse_pct, masse_musculaire_pct, eau_pct)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [req.userId, analysis.poids_kg, analysis.masse_grasse_pct, analysis.masse_musculaire_pct, analysis.eau_pct]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur analyse composition:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
