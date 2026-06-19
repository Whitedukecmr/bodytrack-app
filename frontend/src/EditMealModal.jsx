import { useState } from "react";
import { Field, Select, Btn, ErrorBox, BLUE, RED } from "./ui";

const MOMENTS = [
  { value: "matin", label: "🌅 Matin" },
  { value: "midi", label: "☀️ Midi" },
  { value: "collation", label: "🍎 Collation" },
  { value: "soir", label: "🌙 Soir" },
];

export default function EditMealModal({ meal, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    nom_repas: meal.nom_repas,
    moment: meal.moment,
    calories: meal.calories,
    proteines_g: meal.proteines_g,
    glucides_g: meal.glucides_g,
    lipides_g: meal.lipides_g,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        calories: Number(form.calories),
        proteines_g: Number(form.proteines_g),
        glucides_g: Number(form.glucides_g),
        lipides_g: Number(form.lipides_g),
      };
      await onSaved(meal.id, payload);
      onClose();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function confirmAndDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setError(null);
    try {
      await onDeleted(meal.id);
      onClose();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
        width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>Modifier le repas</h2>
          <div onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", background: "#F0F2FF",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#888"
          }}>✕</div>
        </div>

        <ErrorBox>{error}</ErrorBox>

        <Field label="Nom du repas" value={form.nom_repas} onChange={set("nom_repas")} />
        <Select label="Moment de la journée" value={form.moment} onChange={set("moment")} options={MOMENTS} />
        <Field label="Calories" value={form.calories} onChange={set("calories")} type="number" unit="kcal" />
        <Field label="Protéines" value={form.proteines_g} onChange={set("proteines_g")} type="number" unit="g" />
        <Field label="Glucides" value={form.glucides_g} onChange={set("glucides_g")} type="number" unit="g" />
        <Field label="Lipides" value={form.lipides_g} onChange={set("lipides_g")} type="number" unit="g" />

        <div style={{ marginTop: 8 }}>
          <Btn onClick={save} disabled={loading || deleting}>{loading ? "..." : "Enregistrer"}</Btn>
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={confirmAndDelete} disabled={loading || deleting} style={{
            width: "100%", padding: 13, borderRadius: 14, border: "none", cursor: "pointer",
            background: confirmDelete ? RED : "#FEE2E2", color: confirmDelete ? "white" : RED,
            fontWeight: 700, fontSize: 14
          }}>
            {deleting ? "Suppression..." : confirmDelete ? "Confirmer la suppression ?" : "🗑️ Supprimer ce repas"}
          </button>
        </div>
      </div>
    </div>
  );
}
