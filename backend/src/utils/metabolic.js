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

// ── Objectifs journaliers selon la méthode de la vidéo ────────────────────────
// Calories : poids actuel × 26 (homme) ou × 24 (femme)
// Protéines : poids CIBLE × 2 (homme) ou × 1.8 (femme)
// Lipides : poids actuel × 1 (homme) ou × 0.8 (femme)
// Fibres : (objectif calories ÷ 1000) × 14
function calcObjectifsJournaliers({ sexe, poids_kg, poids_objectif_kg }) {
  const p = Number(poids_kg);
  const pCible = Number(poids_objectif_kg);
  const homme = sexe !== 'femme';

  const calories = Math.round(p * (homme ? 26 : 24));
  const proteines = Math.round(pCible * (homme ? 2 : 1.8));
  const lipides = Math.round(p * (homme ? 1 : 0.8));
  const glucides = Math.round(calories / 2 / 4);
  const fibres = Math.round((calories / 1000) * 14);

  return { calories, proteines, lipides, glucides, fibres };
}

module.exports = { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal, calcObjectifsJournaliers, ACTIVITY_FACTORS };
