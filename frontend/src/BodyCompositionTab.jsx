import { useState } from "react";
import { api } from "./api";
import { Card, Field, Btn, ErrorBox, BLUE, BLUE_LIGHT, GREEN, ORANGE, RED } from "./ui";
import PhotoCapture from "./PhotoCapture";

// ── Graphique donut SVG pour la composition corporelle ────────
function DonutChart({ grasse, musculaire, osseuse, eau }) {
  const data = [
    { label: "Masse grasse", value: grasse || 0, color: ORANGE },
    { label: "Masse musculaire", value: musculaire || 0, color: GREEN },
    { label: "Masse osseuse", value: osseuse || 0, color: "#374151" },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 60, cy = 60, r = 44, innerR = 30;

  // Calcul des arcs SVG (path) — beaucoup plus fiable que strokeDasharray
  function polarToCartesian(angle, radius) {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function arcPath(startAngle, endAngle, radius, inner) {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const startInner = polarToCartesian(startAngle, inner);
    const endInner = polarToCartesian(endAngle, inner);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
      'Z'
    ].join(' ');
  }

  let currentAngle = 0;
  const slices = data.map(d => {
    const angle = (d.value / total) * 360;
    const path = arcPath(currentAngle, currentAngle + angle - 0.5, r, innerR);
    currentAngle += angle;
    return { ...d, path };
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: eau ? 10 : 0 }}>
        <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="#F0F2FF" />
          <circle cx={cx} cy={cy} r={innerR} fill="white" />
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} />
          ))}
        </svg>
        <div>
          {data.map(d => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#555" }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
      {eau > 0 && (
        <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
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
