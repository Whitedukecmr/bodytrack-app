function calcBMR({ sexe, poids_kg, taille_cm, age }) {
  const p = Number(poids_kg);
  const t = Number(taille_cm);
  const a = Number(age);
  const base = 10 * p + 6.25 * t - 5 * a;
  return Math.round(sexe === 'femme' ? base - 161 : base + 5);
}

const ACTIVITY_FACTORS = {
  bmr_pur: 1.0,
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

// ── Objectifs journaliers selon le type d'objectif ───────────────────────────
//
// SÈCHE (perte de gras, formules de la vidéo aminecoachsportif) :
//   Calories   : poids × 26 (H) / × 24 (F)
//   Protéines  : poids CIBLE × 2 (H) / × 1.8 (F)
//   Lipides    : poids × 1 (H) / × 0.8 (F)
//   Glucides   : (calories - proteines×4 - lipides×9) ÷ 4  (résiduel réel)
//   Fibres     : (calories ÷ 1000) × 14
//
// PRISE DE MASSE :
//   Calories   : poids × 36 (H) / × 34 (F)
//   Protéines  : poids × 2.2 (H) / × 2 (F)
//   Lipides    : poids × 1.2 (H) / × 1 (F)
//   Glucides   : (calories - proteines×4 - lipides×9) ÷ 4  (résiduel réel)
//   Fibres     : (calories ÷ 1000) × 14

function calcObjectifsJournaliers({ sexe, poids_kg, poids_objectif_kg, objectif_type }) {
  const p = Number(poids_kg);
  const pCible = Number(poids_objectif_kg);
  const homme = sexe !== 'femme';
  const seche = objectif_type !== 'prise_de_masse';

  let calories, proteines, lipides;

  if (seche) {
    calories  = Math.round(p * (homme ? 26 : 24));
    proteines = Math.round(pCible * (homme ? 2 : 1.8));
    lipides   = Math.round(p * (homme ? 1 : 0.8));
  } else {
    // Prise de masse
    calories  = Math.round(p * (homme ? 36 : 34));
    proteines = Math.round(p * (homme ? 2.2 : 2));
    lipides   = Math.round(p * (homme ? 1.2 : 1));
  }

  // Glucides résiduels réels (après allocation proteines + lipides)
  const caloriesRestantes = calories - (proteines * 4) - (lipides * 9);
  const glucides = Math.max(0, Math.round(caloriesRestantes / 4));
  const fibres   = Math.round((calories / 1000) * 14);

  return { calories, proteines, lipides, glucides, fibres, type: seche ? 'seche' : 'prise_de_masse' };
}

module.exports = { calcBMR, calcTDEE, calcBMI, estimateWeeksToGoal, calcObjectifsJournaliers, ACTIVITY_FACTORS };
