// ── Calculs métaboliques ──────────────────────────────────────

// Formule de Mifflin-St Jeor (la plus précise et utilisée cliniquement)
function calcBMR({ sexe, poids_kg, taille_cm, age }) {
  const p = Number(poids_kg);
  const t = Number(taille_cm);
  const a = Number(age);
  const base = 10 * p + 6.25 * t - 5 * a;
  return Math.round(sexe === 'femme' ? base - 161 : base + 5);
}

// Facteurs d'activité (NEAT inclus dans le multiplicateur de base)
const ACTIVITY_FACTORS = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

function calcTDEE(bmr, niveau_activite) {
  const factor = ACTIVITY_FACTORS[niveau_activite] || 1.55;
  return Math.round(bmr * factor);
}

function calcBMI(poids_kg, taille_cm) {
  const h = taille_cm / 100;
  return +(poids_kg / (h * h)).toFixed(1);
}

// Estimation du temps restant pour atteindre l'objectif
// Hypothèse : 1kg de masse grasse ≈ 7700 kcal
function estimateWeeksToGoal(poidsActuel, poidsObjectif, deficitMoyenJournalier) {
  if (deficitMoyenJournalier <= 0) return null;
  const kgARestants = poidsActuel - poidsObjectif;
  if (kgARestants <= 0) return 0;
  const caloriesTotales = kgARestants * 7700;
  const jours = caloriesTotales / deficitMoyenJournalier;
  return Math.ceil(jours / 7);
}

module.exports = { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal, ACTIVITY_FACTORS };
