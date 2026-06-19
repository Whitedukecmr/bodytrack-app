// ── Analyse "coach" générée localement à partir des chiffres ──
// Pas d'appel IA : règles simples mais cohérentes sur déficit, macros et régularité.

function analyzeBilan({ deficitNet, caloriesIngerees, proteinesTotales, glucidesTotales, lipidesTotales, nbRepas, joursAvecDonnees }) {
  const phrases = [];

  // ── Sur le déficit/surplus ──
  if (caloriesIngerees === 0) {
    phrases.push("Aucun repas loggé sur cette période : le déficit affiché reflète uniquement ta dépense théorique, pas un vrai résultat. Pense à photographier tes repas pour un bilan fiable.");
  } else if (deficitNet > 1000) {
    phrases.push("Le déficit est très élevé, potentiellement irréaliste si maintenu durablement : vérifie que tous tes repas de la période ont bien été loggés avant de t'en féliciter.");
  } else if (deficitNet > 300) {
    phrases.push("Déficit calorique solide et cohérent avec un objectif de perte de poids progressive et durable.");
  } else if (deficitNet >= 0) {
    phrases.push("Déficit léger : la perte de poids sera lente mais cela reste tenable sur la durée.");
  } else if (deficitNet >= -300) {
    phrases.push("Léger surplus calorique. Rien d'alarmant ponctuellement, mais à surveiller si ça se répète.");
  } else {
    phrases.push("Surplus calorique marqué sur cette période, à l'opposé de l'objectif de perte de poids.");
  }

  // ── Sur l'équilibre des macros (seulement si données présentes) ──
  if (caloriesIngerees > 0 && proteinesTotales != null) {
    const calProt = proteinesTotales * 4;
    const calGluc = glucidesTotales * 4;
    const calLip = lipidesTotales * 9;
    const total = calProt + calGluc + calLip;
    if (total > 0) {
      const pctProt = (calProt / total) * 100;
      if (pctProt < 15) {
        phrases.push("Apport en protéines plutôt faible par rapport au reste : pense à en ajouter pour mieux préserver ta masse musculaire pendant la perte de poids.");
      } else if (pctProt >= 25) {
        phrases.push("Bon apport en protéines, ce qui aide à préserver la masse musculaire pendant le déficit.");
      }
    }
  }

  // ── Sur la régularité du logging ──
  if (joursAvecDonnees != null && joursAvecDonnees > 1) {
    phrases.push(`${joursAvecDonnees} jour${joursAvecDonnees > 1 ? "s" : ""} avec des repas loggés sur la période : continue sur cette régularité, c'est ce qui rend les estimations fiables.`);
  }

  return phrases.join(' ');
}

module.exports = { analyzeBilan };
