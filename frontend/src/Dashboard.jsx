import { useState, useEffect } from "react";
import { api, clearToken } from "./api";
import { Card, Btn, BLUE, BLUE_LIGHT, GREEN, ORANGE, RED, Select } from "./ui";
import PhotoCapture from "./PhotoCapture";
import DeficitChart from "./DeficitChart";

const MOMENTS = [
  { value: "matin", label: "🌅 Matin" },
  { value: "midi", label: "☀️ Midi" },
  { value: "collation", label: "🍎 Collation" },
  { value: "soir", label: "🌙 Soir" },
];

const ACTIVITY_TYPES = [
  { value: "marche", label: "🚶 Marche sur tapis" },
  { value: "musculation", label: "🏋️ Musculation" },
  { value: "rameur", label: "🚣 Rameur" },
  { value: "natation", label: "🏊 Natation" },
  { value: "course", label: "🏃 Course" },
  { value: "autre", label: "⚡ Autre" },
];

function scoreColor(s) { return s >= 7 ? GREEN : s >= 4 ? ORANGE : RED; }
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

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("journal");
  const [journalView, setJournalView] = useState("jour");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [today, setToday] = useState(null);
  const [range, setRange] = useState(null);
  const [progress, setProgress] = useState(null);
  const [moment, setMoment] = useState("midi");
  const [activityType, setActivityType] = useState("marche");
  const [showDatePicker, setShowDatePicker] = useState(false);

  async function loadDay(date) {
    try {
      const t = await api.dashboardToday(date === todayStr() ? null : date);
      setToday(t);
    } catch (e) { console.error(e); }
  }

  async function loadRange(days) {
    try {
      const r = await api.dashboardRange(days);
      setRange(r);
    } catch (e) { console.error(e); }
  }

  async function loadProgress() {
    try {
      const p = await api.dashboardProgress();
      setProgress(p);
    } catch (e) { console.error(e); }
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

  function logout() { clearToken(); onLogout(); }

  function goToDay(date) {
    setSelectedDate(date);
    setJournalView("jour");
    setTab("journal");
  }

  if (!today) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Chargement...</div>;

  const grouped = MOMENTS.map(m => ({ ...m, repas: today.repas.filter(r => r.moment === m.value) }));
  const isToday = selectedDate === todayStr();

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FF", fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`, padding: "20px 20px 26px", borderRadius: "0 0 28px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Bonjour</p>
            <h2 style={{ margin: "2px 0 0", color: "white", fontWeight: 800, fontSize: 22 }}>{user.prenom} {user.nom}</h2>
          </div>
          <div onClick={logout} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>🚪</div>
        </div>

        <div style={{ marginTop: 18, background: "rgba(255,255,255,0.15)", borderRadius: 18, padding: 16, textAlign: "center" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
            Déficit calorique net {isToday ? "du jour" : `du ${formatDateLabel(selectedDate).toLowerCase()}`}
          </p>
          <p style={{ margin: "4px 0 0", color: "white", fontWeight: 900, fontSize: 36 }}>
            {today.deficitNet > 0 ? "−" : "+"}{Math.abs(today.deficitNet)} kcal
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
            Dépense {today.depenseDuJour} kcal · Ingéré {today.caloriesIngerees} kcal
          </p>
        </div>
      </div>

      <div style={{ display: "flex", margin: "16px 16px 0", background: "white", borderRadius: 12, padding: 4, gap: 3, overflowX: "auto" }}>
        {[["journal", "📓 Journal"], ["repas", "🍽️ Repas"], ["activite", "🏃 Activité"], ["progres", "📊 Progrès"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "9px 4px", borderRadius: 9, border: "none", whiteSpace: "nowrap",
            background: tab === key ? BLUE : "transparent", color: tab === key ? "white" : "#777",
            fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "14px 16px 80px" }}>

        {tab === "journal" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["jour", "Jour"], ["semaine", "Semaine"], ["mois", "Mois"]].map(([key, label]) => (
                <button key={key} onClick={() => setJournalView(key)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, border: journalView === key ? `2px solid ${BLUE}` : "2px solid #E0E6FF",
                  background: journalView === key ? BLUE_LIGHT : "white", color: journalView === key ? BLUE : "#888",
                  fontWeight: 700, fontSize: 12, cursor: "pointer"
                }}>{label}</button>
              ))}
            </div>

            {journalView === "jour" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={{
                    width: 38, height: 38, borderRadius: 12, border: "none", background: "white",
                    fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(59,91,252,0.1)"
                  }}>←</button>

                  <div onClick={() => setShowDatePicker(!showDatePicker)} style={{ textAlign: "center", cursor: "pointer", flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                      📅 {formatDateLabel(selectedDate)}
                    </p>
                  </div>

                  <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} disabled={isToday} style={{
                    width: 38, height: 38, borderRadius: 12, border: "none",
                    background: isToday ? "#F0F2FF" : "white", color: isToday ? "#ccc" : "#1a1a2e",
                    fontSize: 16, cursor: isToday ? "default" : "pointer", boxShadow: isToday ? "none" : "0 2px 8px rgba(59,91,252,0.1)"
                  }}>→</button>
                </div>

                {showDatePicker && (
                  <Card style={{ marginBottom: 12 }}>
                    <input
                      type="date"
                      value={selectedDate}
                      max={todayStr()}
                      onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false); }}
                      style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid #E0E6FF", fontSize: 16 }}
                    />
                  </Card>
                )}

                {grouped.map(g => (
                  <Card key={g.value} style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>{g.label}</p>
                    {g.repas.length === 0 && <p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>Aucun repas loggé</p>}
                    {g.repas.map(r => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{r.nom_repas}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{r.proteines_g}g P · {r.glucides_g}g G · {r.lipides_g}g L</p>
                        </div>
                        <div style={{ fontWeight: 800, color: BLUE, fontSize: 15 }}>{r.calories} kcal</div>
                      </div>
                    ))}
                  </Card>
                ))}

                {today.activites.length > 0 && (
                  <Card>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>🏃 Activités</p>
                    {today.activites.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{a.type_activite}</p>
                        <p style={{ margin: 0, fontSize: 13, color: GREEN, fontWeight: 700 }}>−{a.calories_brulees} kcal</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {(journalView === "semaine" || journalView === "mois") && range && (
              <div>
                <Card style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>
                    {journalView === "semaine" ? "7 derniers jours" : "30 derniers jours"}
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "#888" }}>
                    Déficit moyen : <span style={{ color: range.deficitMoyen >= 0 ? GREEN : RED, fontWeight: 700 }}>
                      {range.deficitMoyen >= 0 ? "−" : "+"}{Math.abs(range.deficitMoyen)} kcal/j
                    </span>
                  </p>
                  <DeficitChart jours={range.jours} onDayClick={goToDay} selectedDate={selectedDate} />
                  <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "#888" }}>
                    <span><span style={{ color: GREEN }}>■</span> Déficit</span>
                    <span><span style={{ color: RED }}>■</span> Surplus</span>
                  </div>
                </Card>

                <Card>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>Détail par jour</p>
                  {range.jours.slice().reverse().map(j => (
                    <div key={j.date} onClick={() => goToDay(j.date)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0", borderTop: "1px solid #F0F2FF", cursor: "pointer"
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{formatDateLabel(j.date)}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{j.nbRepas} repas loggé{j.nbRepas !== 1 ? "s" : ""}</p>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: j.deficitNet >= 0 ? GREEN : RED }}>
                        {j.deficitNet >= 0 ? "−" : "+"}{Math.abs(j.deficitNet)} kcal
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}

        {tab === "repas" && (
          <PhotoCapture
            title="Analyse ton repas"
            description="Prends ou importe une photo pour obtenir les valeurs nutritionnelles."
            icon="🍽️"
            extraControls={<Select label="Moment de la journée" value={moment} onChange={setMoment} options={MOMENTS} />}
            onAnalyze={async (b64) => { const r = await api.analyzeMeal(b64, moment); await refresh(); return r; }}
            renderResult={(r) => (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{r.nom_repas}</h3>
                  <div style={{ background: scoreColor(r.score_sante), color: "white", borderRadius: 99, padding: "4px 12px", fontWeight: 700, fontSize: 13 }}>{r.score_sante}/10</div>
                </div>
                <div style={{ background: BLUE_LIGHT, borderRadius: 14, padding: 14, textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: BLUE }}>{r.calories}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>calories</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[["Protéines", r.proteines_g, BLUE], ["Glucides", r.glucides_g, ORANGE], ["Lipides", r.lipides_g, RED]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "#F7F8FF", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: c }}>{v}g</div>
                      <div style={{ fontSize: 10, color: "#888" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F0FFF4", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>{r.avis_sante}</p>
                </div>
                <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#2742d4" }}>{r.conseil}</p>
                </div>
              </Card>
            )}
          />
        )}

        {tab === "activite" && (
          <PhotoCapture
            title="Capture ton activité"
            description="Capture d'écran de tes anneaux d'activité, montre connectée ou écran de fin de séance."
            icon="🏃"
            extraControls={<Select label="Type d'activité" value={activityType} onChange={setActivityType} options={ACTIVITY_TYPES} />}
            onAnalyze={async (b64) => { const r = await api.analyzeActivity(b64, activityType); await refresh(); return r; }}
            renderResult={(r) => (
              <Card>
                <h3 style={{ fontWeight: 800, fontSize: 17, margin: "0 0 14px", textTransform: "capitalize" }}>{r.type_activite}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["👟 Pas", r.pas], ["📍 Distance", r.distance_km ? `${r.distance_km} km` : "—"],
                    ["⏱️ Durée", r.duree_min ? `${r.duree_min} min` : "—"], ["❤️ FC moy.", r.frequence_cardiaque_moy ? `${r.frequence_cardiaque_moy} bpm` : "—"]].map(([l, v]) => (
                    <div key={l} style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{l}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: BLUE }}>{v ?? "—"}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, background: "#F0FFF4", borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: GREEN }}>−{r.calories_brulees || 0} kcal</span>
                  <span style={{ fontSize: 12, color: "#666" }}> brûlées</span>
                </div>
              </Card>
            )}
          />
        )}

        {tab === "progres" && progress && (
          <div>
            <Card style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15 }}>📊 Vue d'ensemble</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#888" }}>Poids actuel</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: BLUE }}>{progress.poidsActuel} kg</div>
                </div>
                <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#888" }}>Objectif</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: BLUE }}>{progress.poidsObjectif} kg</div>
                </div>
              </div>
              {progress.semainesRestantes !== null && (
                <div style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`, borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Estimation au rythme actuel</p>
                  <p style={{ margin: "4px 0 0", color: "white", fontWeight: 900, fontSize: 24 }}>{progress.semainesRestantes} semaines</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Déficit moyen : {progress.deficitMoyenJournalier} kcal/j</p>
                </div>
              )}
            </Card>

            {progress.recapMensuel && (
              <Card style={{ marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15 }}>🗓️ Récapitulatif des 30 derniers jours</p>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "#888" }}>
                  {progress.recapMensuel.joursActifs30j} jour{progress.recapMensuel.joursActifs30j !== 1 ? "s" : ""} avec repas loggé{progress.recapMensuel.joursActifs30j !== 1 ? "s" : ""}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "#F0FFF4", borderRadius: 12, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#888" }}>Déficit cumulé</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: progress.recapMensuel.deficitCumule30j >= 0 ? GREEN : RED }}>
                      {progress.recapMensuel.deficitCumule30j >= 0 ? "−" : "+"}{Math.abs(progress.recapMensuel.deficitCumule30j).toLocaleString('fr-FR')} kcal
                    </div>
                  </div>
                  <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#888" }}>Perte de gras estimée</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: ORANGE }}>
                      {progress.recapMensuel.perteGrasEstimeeKg >= 0 ? "" : "+"}{Math.abs(progress.recapMensuel.perteGrasEstimeeKg)} kg
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>Poids perdu réel (mesuré)</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {progress.recapMensuel.poidsPerduReel > 0 ? "" : ""}{progress.recapMensuel.poidsPerduReel} kg
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>Reste à perdre pour l'objectif</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{progress.recapMensuel.totalARestant} kg</span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#888" }}>Progression vers l'objectif</span>
                    <span style={{ fontSize: 11, color: BLUE, fontWeight: 700 }}>{progress.recapMensuel.progressionPct}%</span>
                  </div>
                  <div style={{ background: "#F0F2FF", borderRadius: 99, height: 10, overflow: "hidden" }}>
                    <div style={{ background: BLUE, height: "100%", width: `${progress.recapMensuel.progressionPct}%`, borderRadius: 99, transition: "width 0.3s" }} />
                  </div>
                </div>

                <p style={{ margin: "12px 0 0", fontSize: 11, color: "#aaa" }}>
                  Estimation théorique basée sur 7700 kcal ≈ 1 kg de masse grasse. Le poids mesuré peut différer (eau, glycogène, masse musculaire).
                </p>
              </Card>
            )}

            <Card style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15 }}>📈 Historique du poids</p>
              {progress.history.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>Aucune donnée encore. Ajoute ta première pesée ci-dessous.</p>}
              {progress.history.slice().reverse().slice(0, 5).map(h => (
                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #F0F2FF" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>{new Date(h.logged_at).toLocaleDateString('fr-FR')}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{h.poids_kg} kg</span>
                  {h.masse_grasse_pct && <span style={{ fontSize: 12, color: ORANGE }}>{h.masse_grasse_pct}% MG</span>}
                </div>
              ))}
            </Card>

            <PhotoCapture
              title="Ajouter une pesée"
              description="Capture d'écran de ta balance connectée (impédancemétrie)."
              icon="⚖️"
              onAnalyze={async (b64) => { const r = await api.analyzeBodyComposition(b64); await refresh(); return r; }}
              renderResult={(r) => (
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: BLUE_LIGHT, borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#888" }}>Poids</div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: BLUE }}>{r.poids_kg} kg</div>
                    </div>
                    {r.masse_grasse_pct && (
                      <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#888" }}>Masse grasse</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: ORANGE }}>{r.masse_grasse_pct}%</div>
                      </div>
                    )}
                    {r.masse_musculaire_pct && (
                      <div style={{ background: "#F0FFF4", borderRadius: 12, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#888" }}>Muscle</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: GREEN }}>{r.masse_musculaire_pct}%</div>
                      </div>
                    )}
                    {r.eau_pct && (
                      <div style={{ background: "#EFF6FF", borderRadius: 12, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#888" }}>Eau</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#3b82f6" }}>{r.eau_pct}%</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
