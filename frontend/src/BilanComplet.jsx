import { Card, BLUE, BLUE_LIGHT, GREEN, ORANGE, RED } from "./ui";

export default function BilanComplet({ bilan, periodeLabel }) {
  if (!bilan) return null;

  const deficitColor = bilan.deficitNet >= 0 ? GREEN : RED;

  return (
    <Card style={{ marginBottom: 12 }}>
      <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 16 }}>
        📋 Bilan complet {periodeLabel}
      </p>

      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#888" }}>Totaux ingérés</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: "#F7F8FF", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: BLUE }}>{bilan.proteinesTotales}g</div>
          <div style={{ fontSize: 10, color: "#888" }}>Protéines</div>
        </div>
        <div style={{ background: "#F7F8FF", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: ORANGE }}>{bilan.glucidesTotales}g</div>
          <div style={{ fontSize: 10, color: "#888" }}>Glucides</div>
        </div>
        <div style={{ background: "#F7F8FF", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: BLUE }}>{bilan.caloriesIngerees}</div>
          <div style={{ fontSize: 10, color: "#888" }}>Calories</div>
        </div>
      </div>

      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13, color: "#888" }}>Calcul du déficit net</p>
      <div style={{ background: "#F7F8FF", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "#666" }}>Métabolisme de base</span>
          <span style={{ fontWeight: 600 }}>{bilan.bmr} kcal</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "#666" }}>Calories actives (activité)</span>
          <span style={{ fontWeight: 600 }}>+{bilan.caloriesActivite} kcal</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 4px", borderTop: "1px solid #E0E6FF", marginTop: 4, fontSize: 13 }}>
          <span style={{ color: "#666", fontWeight: 700 }}>Dépense totale</span>
          <span style={{ fontWeight: 700 }}>{bilan.depenseDuJour} kcal</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
          <span style={{ color: "#666" }}>Apports cumulés</span>
          <span style={{ fontWeight: 600 }}>−{bilan.caloriesIngerees} kcal</span>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`, borderRadius: 14, padding: 16, textAlign: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>🎯 Déficit calorique net final</p>
        <p style={{ margin: "4px 0 0", color: "white", fontWeight: 900, fontSize: 30 }}>
          {bilan.deficitNet >= 0 ? "−" : "+"}{Math.abs(bilan.deficitNet)} kcal
        </p>
      </div>

      {bilan.analyseCoach && (
        <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 14 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: "#2742d4" }}>🧠 L'analyse du coach</p>
          <p style={{ margin: 0, fontSize: 13, color: "#2742d4", lineHeight: 1.5 }}>{bilan.analyseCoach}</p>
        </div>
      )}
    </Card>
  );
}
