import { useState } from "react";
import { api } from "./api";
import { Card, Field, Btn, ErrorBox, BLUE, BLUE_LIGHT, GREEN, ORANGE, RED } from "./ui";
import PhotoCapture from "./PhotoCapture";

// ── Graphique donut SVG pour la composition corporelle ────────
function DonutChart({ grasse, musculaire, osseuse, eau }) {
  const segments = [
    { label: "Masse grasse", value: grasse || 0, color: "#f59e0b", bg: "#FFF7ED" },
    { label: "Masse musculaire", value: musculaire || 0, color: "#22c55e", bg: "#F0FFF4" },
    { label: "Masse osseuse", value: osseuse || 0, color: "#374151", bg: "#F9FAFB" },
  ].filter(d => d.value > 0);

  if (segments.length === 0) return null;

  return (
    <div>
      {segments.map(s => (
        <div key={s.label} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 13, color: "#555" }}>{s.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}%</span>
          </div>
          <div style={{ background: s.bg, borderRadius: 99, height: 10, overflow: "hidden" }}>
            <div style={{
              background: s.color, height: "100%", borderRadius: 99,
              width: `${s.value}%`, transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      ))}
      {eau > 0 && (
        <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60a5fa" }} />
            <span style={{ fontSize: 12, color: "#555" }}>Eau corporelle</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>{eau}%</span>
        </div>
      )}
    </div>
  );
}

// ── Curseur IMC ────────────────────────────────────────────────
function IMCScale({ bmi }) {
  if (!bmi) return null;

  const zones = [
    { label: "Insuffisance\npondérale", max: 18.5, color: "#60a5fa" },
    { label: "Corpulence\nnormale", max: 25, color: GREEN },
    { label: "Surpoids", max: 30, color: ORANGE },
    { label: "Obésité", max: 40, color: RED },
  ];

  const minBMI = 15, maxBMI = 40;
  const pct = Math.min(100, Math.max(0, ((bmi - minBMI) / (maxBMI - minBMI)) * 100));
  const zone = zones.find(z => bmi < z.max) || zones[zones.length - 1];
  const bmiColor = zone.color;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>IMC calculé</p>
          <p style={{ margin: 0, fontWeight: 900, fontSize: 28, color: bmiColor }}>{bmi}</p>
        </div>
        <span style={{ background: bmiColor + "22", color: bmiColor, fontWeight: 700, fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>
          {zone.label.replace("\n", " ")}
        </span>
      </div>

      <div style={{ position: "relative", height: 8, borderRadius: 99, background: `linear-gradient(to right, #60a5fa, ${GREEN}, ${ORANGE}, ${RED})`, marginBottom: 20 }}>
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)",
          width: 16, height: 16, borderRadius: "50%", background: bmiColor, border: "2px solid white",
          boxShadow: `0 0 0 2px ${bmiColor}`
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginTop: -14 }}>
        {zones.map(z => (
          <span key={z.label} style={{ textAlign: "center", flex: 1 }}>{z.label.split("\n")[0]}</span>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function BodyCompositionTab({ progress, bmi, onRefresh }) {
  const [mode, setMode] = useState("photo"); // photo / manuel
  const [manual, setManual] = useState({ poids_kg: "", masse_grasse_pct: "", masse_musculaire_pct: "", masse_osseuse_pct: "", eau_pct: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const last = progress?.history?.slice(-1)[0];

  const set = k => v => setManual(f => ({ ...f, [k]: v }));

  async function saveManual() {
    if (!manual.poids_kg) { setError("Le poids est obligatoire"); return; }
    setSaving(true);
    setError(null);
    try {
      await api.addBodyCompositionManual({
        poids_kg: Number(manual.poids_kg),
        masse_grasse_pct: manual.masse_grasse_pct ? Number(manual.masse_grasse_pct) : null,
        masse_musculaire_pct: manual.masse_musculaire_pct ? Number(manual.masse_musculaire_pct) : null,
        masse_osseuse_pct: manual.masse_osseuse_pct ? Number(manual.masse_osseuse_pct) : null,
        eau_pct: manual.eau_pct ? Number(manual.eau_pct) : null,
      });
      setManual({ poids_kg: "", masse_grasse_pct: "", masse_musculaire_pct: "", masse_osseuse_pct: "", eau_pct: "" });
      await onRefresh();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  function renderCompositionResult(r) {
    return (
      <Card>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 15 }}>✅ Pesée enregistrée</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Poids</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: BLUE }}>{r.poids_kg} kg</div>
          </div>
          {r.masse_grasse_pct && <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Masse grasse</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: ORANGE }}>{r.masse_grasse_pct}%</div>
          </div>}
          {r.masse_musculaire_pct && <div style={{ background: "#F0FFF4", borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Masse musculaire</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: GREEN }}>{r.masse_musculaire_pct}%</div>
          </div>}
          {r.masse_osseuse_pct && <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Masse osseuse</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#374151" }}>{r.masse_osseuse_pct}%</div>
          </div>}
          {r.eau_pct && <div style={{ background: "#EFF6FF", borderRadius: 12, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Eau</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#3b82f6" }}>{r.eau_pct}%</div>
          </div>}
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Dernière composition connue */}
      {last && (
        <Card style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>🧬 Dernière composition corporelle</p>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#888" }}>
            {new Date(last.logged_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          {(last.masse_grasse_pct || last.masse_musculaire_pct) && (
            <div style={{ marginBottom: 16 }}>
              <DonutChart
                grasse={last.masse_grasse_pct}
                musculaire={last.masse_musculaire_pct}
                osseuse={last.masse_osseuse_pct}
                eau={last.eau_pct}
              />
            </div>
          )}

          <IMCScale bmi={bmi} />
        </Card>
      )}

      {/* Ajouter une nouvelle pesée */}
      <Card style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 15 }}>⚖️ Ajouter une pesée</p>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["photo", "📷 Photo/Capture"], ["manuel", "✍️ Saisie manuelle"]].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, border: mode === key ? `2px solid ${BLUE}` : "2px solid #E0E6FF",
              background: mode === key ? BLUE_LIGHT : "white", color: mode === key ? BLUE : "#888",
              fontWeight: 700, fontSize: 12, cursor: "pointer"
            }}>{label}</button>
          ))}
        </div>

        {mode === "photo" && (
          <PhotoCapture
            title=""
            description="Balance connectée, app santé (Huawei, Withings, Garmin, Samsung, Apple Health...)"
            icon="📱"
            onAnalyze={async (b64) => { const r = await api.analyzeBodyComposition(b64); await onRefresh(); return r; }}
            renderResult={renderCompositionResult}
          />
        )}

        {mode === "manuel" && (
          <div>
            <ErrorBox>{error}</ErrorBox>
            <Field label="Poids *" value={manual.poids_kg} onChange={set("poids_kg")} type="number" unit="kg" placeholder="Ex: 112.1" />
            <Field label="Masse grasse" value={manual.masse_grasse_pct} onChange={set("masse_grasse_pct")} type="number" unit="%" placeholder="Ex: 23" />
            <Field label="Masse musculaire" value={manual.masse_musculaire_pct} onChange={set("masse_musculaire_pct")} type="number" unit="%" placeholder="Ex: 73" />
            <Field label="Masse osseuse" value={manual.masse_osseuse_pct} onChange={set("masse_osseuse_pct")} type="number" unit="%" placeholder="Ex: 4" />
            <Field label="Eau" value={manual.eau_pct} onChange={set("eau_pct")} type="number" unit="%" placeholder="Ex: 53" />
            <Btn onClick={saveManual} disabled={saving}>{saving ? "..." : "Enregistrer"}</Btn>
          </div>
        )}
      </Card>

      {/* Historique */}
      {progress?.history?.length > 0 && (
        <Card>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15 }}>📈 Historique des pesées</p>
          {progress.history.slice().reverse().slice(0, 8).map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
              <div>
                <span style={{ fontSize: 13, color: "#888" }}>{new Date(h.logged_at).toLocaleDateString('fr-FR')}</span>
                {h.masse_grasse_pct && <span style={{ fontSize: 11, color: ORANGE, marginLeft: 8 }}>MG {h.masse_grasse_pct}%</span>}
                {h.masse_musculaire_pct && <span style={{ fontSize: 11, color: GREEN, marginLeft: 6 }}>MM {h.masse_musculaire_pct}%</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{h.poids_kg} kg</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
