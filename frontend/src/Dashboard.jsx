import { useState, useEffect } from "react";
import { api, clearToken } from "./api";
import {
  Card, GradientCard, Btn, BLUE, BLUE_LIGHT, BLUE_DARK, GREEN, GREEN_LIGHT,
  ORANGE, ORANGE_LIGHT, RED, RED_LIGHT, PURPLE, BG, TEXT, TEXT_MUTED,
  GRADIENT_HEADER, Select, StatCard, ProgressBar, SectionTitle, Badge
} from "./ui";
import PhotoCapture from "./PhotoCapture";
import DeficitChart from "./DeficitChart";
import WeightChart from "./WeightChart";
import EditProfile from "./EditProfile";
import EditMealModal from "./EditMealModal";
import BilanComplet from "./BilanComplet";
import MealChat from "./MealChat";
import BodyCompositionTab from "./BodyCompositionTab";

const MOMENTS = [
  { value: "matin", label: "🌅 Matin" },
  { value: "midi", label: "☀️ Midi" },
  { value: "collation", label: "🍎 Collation" },
  { value: "soir", label: "🌙 Soir" },
];

const ACTIVITY_TYPES = [
  { value: "marche", label: "🚶 Marche / Tapis" },
  { value: "musculation", label: "🏋️ Musculation" },
  { value: "rameur", label: "🚣 Rameur" },
  { value: "natation", label: "🏊 Natation" },
  { value: "course", label: "🏃 Course" },
  { value: "autre", label: "⚡ Autre" },
];

function scoreColor(s) { return s >= 7 ? GREEN : s >= 4 ? ORANGE : RED; }
function scoreBg(s) { return s >= 7 ? GREEN_LIGHT : s >= 4 ? ORANGE_LIGHT : RED_LIGHT; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const t = todayStr();
  if (dateStr === t) return "Aujourd'hui";
  if (dateStr === addDays(t, -1)) return "Hier";
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Macro bar dans le header ───────────────────────────────────
function MacroBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{value} / {max}{label === "Calories" ? "" : "g"}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 99, height: 5, overflow: "hidden" }}>
        <div style={{ background: color, height: "100%", borderRadius: 99, width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Card repas dans le journal ─────────────────────────────────
function MealGroup({ moment, repas, onEdit }) {
  const hasRepas = repas.length > 0;
  return (
    <div style={{
      background: "white", borderRadius: 18, padding: "14px 16px",
      marginBottom: 10, boxShadow: "0 2px 16px rgba(59,91,252,0.06)",
      border: "1px solid #F0F2FF"
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13, color: TEXT }}>{moment.label}</p>
      {!hasRepas && <p style={{ color: "#C5CDFF", fontSize: 13, margin: 0 }}>Aucun repas loggé</p>}
      {repas.map(r => (
        <div key={r.id} style={{ padding: "9px 0", borderTop: "1px solid #F4F6FF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: TEXT, wordBreak: "break-word" }}>{r.nom_repas}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, background: "#EEF1FF", color: BLUE, borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>P {r.proteines_g}g</span>
                <span style={{ fontSize: 10, background: ORANGE_LIGHT, color: ORANGE, borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>G {r.glucides_g}g</span>
                <span style={{ fontSize: 10, background: RED_LIGHT, color: RED, borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>L {r.lipides_g}g</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: BLUE }}>{r.calories} kcal</span>
              <button onClick={() => onEdit(r)} style={{
                padding: "4px 10px", borderRadius: 8, border: `1.5px solid #E0E6FF`,
                background: "#F8F9FF", color: BLUE, fontSize: 11, fontWeight: 700,
                cursor: "pointer"
              }}>✎ Modifier</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState("journal");
  const [journalView, setJournalView] = useState("jour");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [today, setToday] = useState(null);
  const [range, setRange] = useState(null);
  const [progress, setProgress] = useState(null);
  const [moment, setMoment] = useState("midi");
  const [activityType, setActivityType] = useState("marche");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [progresView, setProgresView] = useState("overview");

  async function loadDay(date) {
    try { setToday(await api.dashboardToday(date === todayStr() ? null : date)); }
    catch (e) { console.error(e); }
  }
  async function loadRange(days) {
    try { setRange(await api.dashboardRange(days)); }
    catch (e) { console.error(e); }
  }
  async function loadProgress() {
    try { setProgress(await api.dashboardProgress()); }
    catch (e) { console.error(e); }
  }
  async function refresh() {
    await loadDay(selectedDate);
    await loadProgress();
    if (journalView === "semaine") await loadRange(7);
    if (journalView === "mois") await loadRange(30);
  }

  useEffect(() => { loadDay(selectedDate); }, [selectedDate]);
  useEffect(() => { loadProgress(); }, []);
  useEffect(() => {
    if (journalView === "semaine") loadRange(7);
    if (journalView === "mois") loadRange(30);
  }, [journalView]);

  function goToDay(date) { setSelectedDate(date); setJournalView("jour"); setTab("journal"); }

  async function handleProfileUpdated(u) { setUser(u); await refresh(); }
  async function handleMealSaved(id, payload) { await api.updateMeal(id, payload); await refresh(); }
  async function handleMealDeleted(id) { await api.deleteMeal(id); await refresh(); }
  async function handleDeleteBodyComposition(id) { await api.deleteBodyComposition(id); await loadProgress(); await loadDay(selectedDate); }

  function renderMealResult(r) {
    return (
      <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 4px 20px rgba(59,91,252,0.1)", border: "1px solid #F0F2FF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: TEXT, flex: 1 }}>{r.nom_repas}</h3>
          <div style={{
            background: scoreBg(r.score_sante), color: scoreColor(r.score_sante),
            borderRadius: 99, padding: "4px 12px", fontWeight: 800, fontSize: 12, flexShrink: 0
          }}>{r.score_sante}/10</div>
        </div>

        <GradientCard style={{ marginBottom: 14, textAlign: "center", padding: "14px" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "white" }}>{r.calories}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>calories</div>
        </GradientCard>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[["Protéines", r.proteines_g, BLUE, "#EEF1FF"], ["Glucides", r.glucides_g, ORANGE, ORANGE_LIGHT], ["Lipides", r.lipides_g, RED, RED_LIGHT]].map(([l, v, c, bg]) => (
            <div key={l} style={{ background: bg, borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: c }}>{v}g</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: GREEN_LIGHT, borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `3px solid ${GREEN}` }}>
          <p style={{ margin: 0, fontSize: 13, color: "#166534", lineHeight: 1.5 }}>{r.avis_sante}</p>
        </div>
        <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, borderLeft: `3px solid ${BLUE}` }}>
          <p style={{ margin: 0, fontSize: 13, color: BLUE_DARK, lineHeight: 1.5 }}>{r.conseil}</p>
        </div>
      </div>
    );
  }

  if (!today) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
        <p style={{ color: TEXT_MUTED, fontSize: 14 }}>Chargement...</p>
      </div>
    </div>
  );

  const grouped = MOMENTS.map(m => ({ ...m, repas: today.repas.filter(r => r.moment === m.value) }));
  const isToday = selectedDate === todayStr();
  const objectifs = today.objectifs || {};

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        button { font-family: inherit; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        background: GRADIENT_HEADER,
        padding: "20px 20px 28px",
        borderRadius: "0 0 28px 28px",
        position: "relative", overflow: "hidden"
      }}>
        {/* Cercles décoratifs glassmorphism */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: 20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        {/* Nom + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Bonjour</p>
            <h2 style={{ margin: "3px 0 0", color: "white", fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>{user.prenom} {user.nom}</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["⚙️", () => setShowEditProfile(true)], ["🚪", () => { clearToken(); onLogout(); }]].map(([icon, fn], i) => (
              <button key={i} onClick={fn} style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 16, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>{icon}</button>
            ))}
          </div>
        </div>

        {/* Card déficit */}
        <div style={{
          marginTop: 16,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 20, padding: "16px 18px", textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, letterSpacing: "0.3px" }}>
            Déficit calorique net {isToday ? "du jour" : `du ${formatDateLabel(selectedDate).toLowerCase()}`}
          </p>
          <p style={{ margin: "6px 0 4px", color: "white", fontWeight: 900, fontSize: 38, lineHeight: 1, letterSpacing: "-1px" }}>
            {today.deficitNet > 0 ? "−" : "+"}{Math.abs(today.deficitNet).toLocaleString('fr-FR')} kcal
          </p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              {today.depenseDuJour} dépensé · {today.caloriesIngerees} ingéré
            </p>
            <span style={{
              background: objectifs.type === "prise_de_masse" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)",
              border: objectifs.type === "prise_de_masse" ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(239,68,68,0.35)",
              color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99
            }}>
              {objectifs.type === "prise_de_masse" ? "💪 Prise de masse" : "🔥 Sèche"}
            </span>
          </div>
        </div>

        {/* Barres macro */}
        {objectifs.proteines_g && (
          <div style={{
            marginTop: 12,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "12px 14px"
          }}>
            <MacroBar label="Calories" value={today.caloriesIngerees} max={objectifs.calories_cible} color="rgba(255,255,255,0.9)" />
            <MacroBar label="Protéines" value={today.bilan?.proteinesTotales ?? 0} max={objectifs.proteines_g} color="#93c5fd" />
            <MacroBar label="Glucides" value={today.bilan?.glucidesTotales ?? 0} max={objectifs.glucides_g} color="#fde68a" />
            <MacroBar label="Lipides" value={today.bilan?.lipidesTotales ?? 0} max={objectifs.lipides_g} color="#fca5a5" />
            <MacroBar label="Fibres" value={today.bilan?.fibresTotales ?? 0} max={objectifs.fibres_g} color="#86efac" />
          </div>
        )}
      </div>

      {/* ── NAVIGATION TABS ───────────────────────────────── */}
      <div style={{
        display: "flex", margin: "14px 16px 0",
        background: "white", borderRadius: 14, padding: 4, gap: 3,
        boxShadow: "0 2px 12px rgba(59,91,252,0.08)"
      }}>
        {[["journal", "📓", "Journal"], ["repas", "🍽️", "Repas"], ["activite", "🏃", "Activité"], ["progres", "📊", "Progrès"]].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "9px 4px", borderRadius: 10, border: "none",
            background: tab === key ? BLUE : "transparent",
            color: tab === key ? "white" : TEXT_MUTED,
            fontWeight: 700, fontSize: 11, cursor: "pointer",
            transition: "all 0.2s", whiteSpace: "nowrap",
            boxShadow: tab === key ? "0 2px 8px rgba(59,91,252,0.3)" : "none"
          }}>
            <span style={{ display: "block", fontSize: 14, marginBottom: 1 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── CONTENU ───────────────────────────────────────── */}
      <div style={{ padding: "14px 16px 80px" }}>

        {/* ── JOURNAL ─────────────────────────────────────── */}
        {tab === "journal" && (
          <div>
            {/* Sous-onglets Jour/Semaine/Mois */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["jour", "Jour"], ["semaine", "Semaine"], ["mois", "Mois"]].map(([key, label]) => (
                <button key={key} onClick={() => setJournalView(key)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                  border: journalView === key ? `2px solid ${BLUE}` : "2px solid #E0E6FF",
                  background: journalView === key ? BLUE_LIGHT : "white",
                  color: journalView === key ? BLUE : TEXT_MUTED,
                  fontWeight: 700, fontSize: 12, transition: "all 0.15s"
                }}>{label}</button>
              ))}
            </div>

            {/* Vue Jour */}
            {journalView === "jour" && (
              <div>
                {/* Navigation date */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={{
                    width: 36, height: 36, borderRadius: 11, border: "none",
                    background: "white", cursor: "pointer", fontSize: 16,
                    boxShadow: "0 2px 8px rgba(59,91,252,0.1)", color: BLUE, fontWeight: 700
                  }}>←</button>
                  <div onClick={() => setShowDatePicker(!showDatePicker)} style={{ textAlign: "center", cursor: "pointer", flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: TEXT }}>
                      📅 {formatDateLabel(selectedDate)}
                    </p>
                  </div>
                  <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={isToday} style={{
                    width: 36, height: 36, borderRadius: 11, border: "none",
                    background: isToday ? "#F4F6FF" : "white",
                    color: isToday ? "#D1D5DB" : BLUE,
                    cursor: isToday ? "default" : "pointer", fontSize: 16,
                    boxShadow: isToday ? "none" : "0 2px 8px rgba(59,91,252,0.1)", fontWeight: 700
                  }}>→</button>
                </div>

                {showDatePicker && (
                  <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "0 4px 20px rgba(59,91,252,0.1)" }}>
                    <input type="date" value={selectedDate} max={todayStr()}
                      onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
                      style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #E0E6FF", fontSize: 15, fontFamily: "inherit" }}
                    />
                  </div>
                )}

                {grouped.map(g => (
                  <MealGroup key={g.value} moment={g} repas={g.repas} onEdit={setEditingMeal} />
                ))}

                {today.activites.length > 0 && (
                  <div style={{ background: "white", borderRadius: 18, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 13, color: TEXT }}>🏃 Activités</p>
                    {today.activites.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid #F4F6FF" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, textTransform: "capitalize" }}>{a.type_activite}</span>
                        <span style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>−{a.calories_brulees} kcal</span>
                      </div>
                    ))}
                  </div>
                )}

                <BilanComplet bilan={today.bilan} periodeLabel={isToday ? "de la journée" : `du ${formatDateLabel(selectedDate).toLowerCase()}`} />
              </div>
            )}

            {/* Vue Semaine/Mois */}
            {(journalView === "semaine" || journalView === "mois") && range && (
              <div>
                <div style={{ background: "white", borderRadius: 18, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                  <SectionTitle>{journalView === "semaine" ? "7 derniers jours" : "30 derniers jours"}</SectionTitle>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: TEXT_MUTED }}>
                    Déficit moyen : <strong style={{ color: range.deficitMoyen >= 0 ? GREEN : RED }}>
                      {range.deficitMoyen >= 0 ? "−" : "+"}{Math.abs(range.deficitMoyen)} kcal/j
                    </strong>
                  </p>
                  <DeficitChart jours={range.jours} onDayClick={goToDay} selectedDate={selectedDate} />
                  <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: TEXT_MUTED }}>
                    <span><span style={{ color: GREEN }}>■</span> Déficit</span>
                    <span><span style={{ color: RED }}>■</span> Surplus</span>
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 18, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                  <SectionTitle>Détail par jour</SectionTitle>
                  {range.jours.slice().reverse().map(j => (
                    <div key={j.date} onClick={() => goToDay(j.date)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0", borderTop: "1px solid #F4F6FF", cursor: "pointer"
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: TEXT }}>{formatDateLabel(j.date)}</p>
                        <p style={{ margin: 0, fontSize: 11, color: TEXT_MUTED }}>{j.nbRepas} repas loggé{j.nbRepas !== 1 ? "s" : ""}</p>
                      </div>
                      <div style={{
                        fontWeight: 800, fontSize: 14,
                        color: j.deficitNet >= 0 ? GREEN : RED,
                        background: j.deficitNet >= 0 ? GREEN_LIGHT : RED_LIGHT,
                        padding: "4px 10px", borderRadius: 10
                      }}>
                        {j.deficitNet >= 0 ? "−" : "+"}{Math.abs(j.deficitNet)} kcal
                      </div>
                    </div>
                  ))}
                </div>

                <BilanComplet bilan={range.bilan} periodeLabel={journalView === "semaine" ? "des 7 derniers jours" : "des 30 derniers jours"} />
              </div>
            )}
          </div>
        )}

        {/* ── REPAS ───────────────────────────────────────── */}
        {tab === "repas" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <Select label="Moment de la journée" value={moment} onChange={setMoment} options={MOMENTS} />
            </div>
            <MealChat
              onAnalyzeText={async (desc) => { const r = await api.analyzeMealText(desc, moment); await refresh(); return r; }}
              onAnalyzeImage={async (b64) => { const r = await api.analyzeMeal(b64, moment); await refresh(); return r; }}
              onAnalyzeBoth={async (b64, desc) => { const r = await api.analyzeMealCombined(b64, desc, moment); await refresh(); return r; }}
              renderResult={renderMealResult}
            />
          </div>
        )}

        {/* ── ACTIVITÉ ────────────────────────────────────── */}
        {tab === "activite" && (
          <PhotoCapture
            title="Capture ton activité"
            description="Screenshot de tes anneaux, montre connectée ou écran de fin de séance."
            icon="🏃"
            extraControls={<Select label="Type d'activité" value={activityType} onChange={setActivityType} options={ACTIVITY_TYPES} />}
            onAnalyze={async (b64) => { const r = await api.analyzeActivity(b64, activityType); await refresh(); return r; }}
            renderResult={(r) => (
              <div style={{ background: "white", borderRadius: 18, padding: 16, boxShadow: "0 4px 20px rgba(59,91,252,0.1)", border: "1px solid #F0F2FF" }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, margin: "0 0 14px", textTransform: "capitalize", color: TEXT }}>{r.type_activite}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[["👟 Pas", r.pas ?? "—"], ["📍 Distance", r.distance_km ? `${r.distance_km} km` : "—"],
                    ["⏱️ Durée", r.duree_min ? `${r.duree_min} min` : "—"], ["❤️ FC moy.", r.frequence_cardiaque_moy ? `${r.frequence_cardiaque_moy} bpm` : "—"]].map(([l, v]) => (
                    <div key={l} style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: BLUE }}>{v}</div>
                    </div>
                  ))}
                </div>
                <GradientCard style={{ textAlign: "center" }}>
                  <span style={{ fontWeight: 900, fontSize: 22, color: "white" }}>−{r.calories_brulees || 0} kcal</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}> brûlées</span>
                </GradientCard>
              </div>
            )}
          />
        )}

        {/* ── PROGRÈS ─────────────────────────────────────── */}
        {tab === "progres" && progress && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["overview", "📊 Résumé"], ["composition", "🧬 Composition"]].map(([key, label]) => (
                <button key={key} onClick={() => setProgresView(key)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                  border: progresView === key ? `2px solid ${BLUE}` : "2px solid #E0E6FF",
                  background: progresView === key ? BLUE_LIGHT : "white",
                  color: progresView === key ? BLUE : TEXT_MUTED,
                  fontWeight: 700, fontSize: 12, transition: "all 0.15s"
                }}>{label}</button>
              ))}
            </div>

            {progresView === "composition" && (
              <BodyCompositionTab progress={progress} bmi={today?.bmi} onRefresh={refresh} />
            )}

            {progresView === "overview" && (
              <div>
                {/* Vue d'ensemble */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <StatCard label="Poids actuel" value={progress.poidsActuel} unit="kg" color={BLUE} icon="⚖️" />
                  <StatCard label="Objectif" value={progress.poidsObjectif} unit="kg" color={PURPLE} icon="🎯" />
                </div>

                {progress.semainesRestantes !== null && (
                  <GradientCard style={{ marginBottom: 12, textAlign: "center" }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600 }}>Estimation au rythme actuel</p>
                    <p style={{ margin: "6px 0 2px", color: "white", fontWeight: 900, fontSize: 28 }}>{progress.semainesRestantes} semaines</p>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Déficit moyen : {progress.deficitMoyenJournalier} kcal/j</p>
                  </GradientCard>
                )}

                {progress.recapMensuel && (
                  <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                    <SectionTitle>🗓️ 30 derniers jours</SectionTitle>
                    <p style={{ margin: "0 0 14px", fontSize: 12, color: TEXT_MUTED }}>
                      {progress.recapMensuel.joursActifs30j} jour{progress.recapMensuel.joursActifs30j !== 1 ? "s" : ""} avec repas loggé{progress.recapMensuel.joursActifs30j !== 1 ? "s" : ""}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <StatCard label="Déficit cumulé"
                        value={`${progress.recapMensuel.deficitCumule30j >= 0 ? "−" : "+"}${Math.abs(progress.recapMensuel.deficitCumule30j).toLocaleString('fr-FR')}`}
                        unit="kcal" color={progress.recapMensuel.deficitCumule30j >= 0 ? GREEN : RED} />
                      <StatCard label="Perte gras estimée"
                        value={`${Math.abs(progress.recapMensuel.perteGrasEstimeeKg)}`}
                        unit="kg" color={ORANGE} icon="🔥" />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F4F6FF" }}>
                      <span style={{ fontSize: 13, color: TEXT_MUTED }}>Poids perdu mesuré</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{progress.recapMensuel.poidsPerduReel} kg</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F4F6FF", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: TEXT_MUTED }}>Reste à perdre</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{progress.recapMensuel.totalARestant} kg</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: TEXT_MUTED }}>Progression vers l'objectif</span>
                      <span style={{ fontSize: 11, color: BLUE, fontWeight: 700 }}>{progress.recapMensuel.progressionPct}%</span>
                    </div>
                    <ProgressBar value={progress.recapMensuel.progressionPct} max={100} color={BLUE} height={10} />

                    <p style={{ margin: "10px 0 0", fontSize: 10, color: "#C5CDFF" }}>
                      Estimation théorique : 7700 kcal ≈ 1 kg de masse grasse.
                    </p>
                  </div>
                )}

                <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                  <SectionTitle>📈 Évolution du poids</SectionTitle>
                  {progress.history.length < 2
                    ? <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Ajoute au moins 2 pesées pour afficher la courbe.</p>
                    : <WeightChart history={progress.history} poidsObjectif={progress.poidsObjectif} />
                  }
                </div>

                <div style={{ background: "white", borderRadius: 18, padding: "16px", boxShadow: "0 2px 16px rgba(59,91,252,0.06)", border: "1px solid #F0F2FF" }}>
                  <SectionTitle>Historique des pesées</SectionTitle>
                  {progress.history.length === 0 && <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Aucune pesée enregistrée.</p>}
                  {progress.history.slice().reverse().map(h => (
                    <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #F4F6FF" }}>
                      <span style={{ fontSize: 13, color: TEXT_MUTED }}>{new Date(h.logged_at).toLocaleDateString('fr-FR')}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {h.masse_grasse_pct && <span style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>MG {h.masse_grasse_pct}%</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{h.poids_kg} kg</span>
                        <button onClick={() => handleDeleteBodyComposition(h.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#E5E7EB" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ──────────────────────────────────────────── */}
      {showEditProfile && (
        <EditProfile user={user} onClose={() => setShowEditProfile(false)} onUpdated={handleProfileUpdated} />
      )}
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onSaved={handleMealSaved}
          onDeleted={handleMealDeleted}
        />
      )}
    </div>
  );
}
