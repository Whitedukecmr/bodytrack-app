import { useState, useEffect } from "react";
import { api } from "./api";
import { BLUE, BLUE_LIGHT, GREEN, GREEN_LIGHT, ORANGE, ORANGE_LIGHT, RED, RED_LIGHT, TEXT, TEXT_MUTED } from "./ui";

// Guide nutritionnel par défaut (pré-rempli avec les préférences de Fred)
const DEFAULT_GUIDE = {
  regles_or: [
    "🎨 Le repas doit être un plaisir visuel ET gustatif — pas de plats fades",
    "🥦 Brocoli à éviter — préférer des légumes colorés et savoureux",
    "🌈 Assiettes colorées, bien présentées, riches en goût",
    "🧂 Épices, herbes fraîches et sauces légères systématiquement",
  ],
  repas_base: [
    {
      titre: "Base dépannage / Sur le pouce",
      composition: "3 œufs durs + 1 tranche blanc de poulet + 1 tranche pain complet",
      diagnostic: "✅ Excellente base protéines + bons lipides. ⚠️ Manque volume/fibres.",
      optimisations: [
        "Tomates cerises poêlées, concombre, salade (volume coloré)",
        "Avocat ou filet d'huile d'olive (bons lipides gourmands)",
        "Présentation : Avocado Toast ou Club Sandwich avec moutarde à l'ancienne",
      ]
    }
  ],
  glucides_complexes: {
    cereales: ["Avoine", "Riz complet/basmati", "Quinoa", "Sarrasin", "Pâtes complètes", "Pain complet/seigle/levain"],
    legumineuses: ["Lentilles vertes", "Lentilles corail", "Pois chiches", "Haricots rouges", "Haricots noirs"],
    tubercules: ["Patate douce (frites four paprika+ail)", "Potimarron", "Butternut", "Pomme de terre vapeur avec peau"],
  },
  assaisonnements: {
    epices: ["Paprika fumé", "Ail en poudre", "Curry", "Piment d'Espelette"],
    sauces: ["Jus de citron", "Sauce soja", "Moutarde à l'ancienne", "Crème de vinaigre balsamique"],
    herbes: ["Ciboulette", "Coriandre", "Persil"],
  }
};

function Section({ title, color, bg, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={() => setOpen(!open)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: bg, borderRadius: 12, padding: "10px 14px", cursor: "pointer",
        marginBottom: open ? 8 : 0
      }}>
        <span style={{ fontWeight: 800, fontSize: 14, color }}>{title}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && children}
    </div>
  );
}

function Pill({ text, color, bg }) {
  return (
    <span style={{
      display: "inline-block", background: bg, color, borderRadius: 99,
      padding: "3px 10px", fontSize: 12, fontWeight: 600, margin: "3px 3px 3px 0"
    }}>{text}</span>
  );
}

export default function NutritionGuide() {
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !guide) loadGuide();
  }, [open]);

  async function loadGuide() {
    setLoading(true);
    try {
      const data = await api.getGuide();
      setGuide(data.guide || DEFAULT_GUIDE);
    } catch (e) {
      setGuide(DEFAULT_GUIDE);
    }
    setLoading(false);
  }

  async function initDefault() {
    try {
      await api.saveGuide(DEFAULT_GUIDE);
      setGuide(DEFAULT_GUIDE);
    } catch (e) {}
  }

  // Auto-init le guide par défaut si vide
  useEffect(() => {
    if (guide === null && open === false) {
      api.getGuide().then(data => {
        if (!data.guide) initDefault();
      }).catch(() => {});
    }
  }, []);

  const g = guide || DEFAULT_GUIDE;

  return (
    <>
      {/* Bouton flottant */}
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 20, left: 16, zIndex: 40,
        width: 52, height: 52, borderRadius: "50%",
        background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`,
        border: "none", cursor: "pointer", fontSize: 22,
        boxShadow: "0 4px 20px rgba(59,91,252,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s",
      }} title="Mon guide nutritionnel">
        📖
      </button>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(10,10,30,0.5)",
          zIndex: 50, backdropFilter: "blur(2px)"
        }} />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51,
        maxHeight: "88vh", overflowY: "auto",
        background: "#F8F9FF",
        borderRadius: "24px 24px 0 0",
        padding: "0 0 32px",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 -8px 40px rgba(59,91,252,0.15)"
      }}>
        {/* Handle + header */}
        <div style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`,
          padding: "14px 20px 18px", borderRadius: "24px 24px 0 0"
        }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.4)", borderRadius: 99, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mes préférences</p>
              <h2 style={{ margin: "2px 0 0", color: "white", fontWeight: 800, fontSize: 20 }}>📖 Mon Guide Nutritionnel</h2>
            </div>
            <button onClick={() => setOpen(false)} style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)", border: "none",
              color: "white", fontSize: 16, cursor: "pointer"
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          {loading && <p style={{ textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>Chargement...</p>}

          {!loading && (
            <>
              {/* Règles d'or */}
              <Section title="✨ Règles d'or" color="#7C3AED" bg="#F3F0FF">
                {g.regles_or.map((r, i) => (
                  <div key={i} style={{
                    background: "white", borderRadius: 10, padding: "9px 12px",
                    marginBottom: 6, fontSize: 13, color: TEXT, lineHeight: 1.4,
                    borderLeft: "3px solid #7C3AED"
                  }}>{r}</div>
                ))}
              </Section>

              {/* Repas de base */}
              <Section title="🍳 Repas de base validés" color={BLUE} bg={BLUE_LIGHT}>
                {g.repas_base.map((r, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 13, color: BLUE }}>{r.titre}</p>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: TEXT, background: "#F8F9FF", borderRadius: 8, padding: "6px 10px" }}>
                      🥘 {r.composition}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: TEXT_MUTED }}>{r.diagnostic}</p>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 11, color: GREEN }}>✅ Optimisations :</p>
                    {r.optimisations.map((o, j) => (
                      <p key={j} style={{ margin: "2px 0", fontSize: 12, color: TEXT, paddingLeft: 10 }}>• {o}</p>
                    ))}
                  </div>
                ))}
              </Section>

              {/* Glucides complexes */}
              <Section title="🌾 Glucides complexes (IG bas)" color="#166534" bg={GREEN_LIGHT}>
                <div style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🌾 Céréales</p>
                  <div>{g.glucides_complexes.cereales.map(c => <Pill key={c} text={c} color="#166534" bg={GREEN_LIGHT} />)}</div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🫘 Légumineuses</p>
                  <div>{g.glucides_complexes.legumineuses.map(c => <Pill key={c} text={c} color="#166534" bg={GREEN_LIGHT} />)}</div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🍠 Tubercules gourmands</p>
                  <div>{g.glucides_complexes.tubercules.map(c => <Pill key={c} text={c} color="#166534" bg={GREEN_LIGHT} />)}</div>
                </div>
              </Section>

              {/* Assaisonnements */}
              <Section title="🧂 Assaisonnements validés" color={ORANGE} bg={ORANGE_LIGHT}>
                <div style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🌶️ Épices</p>
                  <div>{g.assaisonnements.epices.map(c => <Pill key={c} text={c} color={ORANGE} bg={ORANGE_LIGHT} />)}</div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🫙 Sauces & condiments</p>
                  <div>{g.assaisonnements.sauces.map(c => <Pill key={c} text={c} color={ORANGE} bg={ORANGE_LIGHT} />)}</div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 12, color: TEXT }}>🌿 Herbes fraîches</p>
                  <div>{g.assaisonnements.herbes.map(c => <Pill key={c} text={c} color={ORANGE} bg={ORANGE_LIGHT} />)}</div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
