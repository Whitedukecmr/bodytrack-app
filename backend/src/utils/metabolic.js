function calcBMR({ sexe, poids_kg, taille_cm, age }) {
  const p = Number(poids_kg);
  const t = Number(taille_cm);
  const a = Number(age);
  const base = 10 * p + 6.25 * t - 5 * a;
  return Math.round(sexe === 'femme' ? base - 161 : base + 5);
}

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

function estimateWeeksToGoal(poidsActuel, poidsObjectif, deficitMoyenJournalier) {
  if (deficitMoyenJournalier <= 0) return null;
  const kgARestants = poidsActuel - poidsObjectif;
  if (kgARestants <= 0) return 0;
  const caloriesTotales = kgARestants * 7700;
  const jours = caloriesTotales / deficitMoyenJournalier;
  return Math.ceil(jours / 7);
}

// Objectif protéines par défaut si non personnalisé : ~1.8g/kg de poids (recomposition corporelle standard)
function defaultProteinGoal(poids_kg) {
  return Math.round(Number(poids_kg) * 1.8);
}

module.exports = { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal, defaultProteinGoal, ACTIVITY_FACTORS };
