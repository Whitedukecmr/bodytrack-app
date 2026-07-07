import { useState } from "react";
import { api } from "./api";
import { Field, Select, Btn, ErrorBox, SuccessBox, BLUE, BLUE_LIGHT, GREEN, ORANGE, RED } from "./ui";

const NIVEAUX_ACTIVITE = [
  { value: "sedentaire", label: "Sédentaire (bureau, peu de sport)" },
  { value: "leger", label: "Légèrement actif (1-2x/sem)" },
  { value: "modere", label: "Modérément actif (3-4x/sem)" },
  { value: "actif", label: "Actif (5-6x/sem)" },
  { value: "tres_actif", label: "Très actif (sport intense quotidien)" },
];

// Prévisualisation locale des objectifs sans appel API
function previewObjectifs({ sexe, poids_kg, poids_objectif_kg, objectif_type }) {
  const p = Number(poids_kg);
  const pCible = Number(poids_objectif_kg);
  if (!p || !pCible) return null;
  const homme = sexe !== 'femme';
  const seche = objectif_type !== 'prise_de_masse';

  let calories, proteines, lipides;
  if (seche) {
    calories  = Math.round(p * (homme ? 26 : 24));
    proteines = Math.round(pCible * (homme ? 2 : 1.8));
    lipides   = Math.round(p * (homme ? 1 : 0.8));
  } else {
    calories  = Math.round(p * (homme ? 36 : 34));
    proteines = Math.round(p * (homme ? 2.2 : 2));
    lipides   = Math.round(p * (homme ? 1.2 : 1));
  }
  const glucides = Math.max(0, Math.round((calories - proteines * 4 - lipides * 9) / 4));
  const fibres   = Math.round((calories / 1000) * 14);
  return { calories, proteines, glucides, lipides, fibres };
}

export default function EditProfile({ user, poidsActuel, onClose, onUpdated }) {
  const [form, setForm] = useState({
    prenom: user.prenom,
    nom: user.nom,
    sexe: user.sexe,
    age: user.age,
    taille_cm: user.taille_cm,
    poids_objectif_kg: user.poids_objectif_kg,
    niveau_activite: user.niveau_activite,
    objectif_type: user.objectif_type || 'seche',
    objectif_proteines_g: user.objectif_proteines_g || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // Prévisualisation en temps réel
  const preview = previewObjectifs({
    sexe: form.sexe,
    poids_kg: poidsActuel || user.poids_objectif_kg, // fallback si poidsActuel indisponible
    poids_objectif_kg: form.poids_objectif_kg,
    objectif_type: form.objectif_type,
  });

  async function submit() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        taille_cm: Number(form.taille_cm),
        poids_objectif_kg: Number(form.poids_objectif_kg),
        objectif_proteines_g: form.objectif_proteines_g ? Number(form.objectif_proteines_g) : null,
        objectif_type: form.objectif_type,
      };
      const updated = await api.updateProfile(payload);
      setSuccess(true);
      onUpdated(updated);
      setTimeout(() => onClose(), 900);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
        width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>Modifier mon profil</h2>
          <div onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", background: "#F0F2FF",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#888"
          }}>✕</div>
        </div>

        <ErrorBox>{error}</ErrorBox>
        <SuccessBox>{success ? "Profil mis à jour ✓" : null}</SuccessBox>

        {/* Sélecteur objectif principal */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#555", marginBottom: 8 }}>
            Mon objectif principal
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "seche", label: "🔥 Sèche", desc: "Perdre du gras" },
              { value: "prise_de_masse", label: "💪 Prise de masse", desc: "Gagner du muscle" }
            ].map(o => (
              <div key={o.value} onClick={() => set("objectif_type")(o.value)} style={{
                flex: 1, padding: "12px 8px", borderRadius: 14, textAlign: "center", cursor: "pointer",
                border: form.objectif_type === o.value ? `2px solid ${BLUE}` : "2px solid #E0E6FF",
                background: form.objectif_type === o.value ? BLUE_LIGHT : "white",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: form.objectif_type === o.value ? BLUE : "#555" }}>{o.label}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{o.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Prévisualisation des objectifs calculés */}
        {preview && (
          <div style={{ background: BLUE_LIGHT, borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: BLUE }}>
              📊 Tes objectifs journaliers calculés
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["🔥 Calories", `${preview.calories} kcal`, "#1a1a2e"],
                ["💪 Protéines", `${preview.proteines}g`, BLUE],
                ["🍚 Glucides", `${preview.glucides}g`, ORANGE],
                ["🥑 Lipides", `${preview.lipides}g`, RED],
                ["🥦 Fibres", `${preview.fibres}g`, GREEN],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: "white", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label="Prénom" value={form.prenom} onChange={set("prenom")} />
        <Field label="Nom" value={form.nom} onChange={set("nom")} />
        <Select label="Sexe" value={form.sexe} onChange={set("sexe")} options={[
          { value: "homme", label: "Homme" }, { value: "femme", label: "Femme" }
        ]} />
        <Field label="Âge" value={form.age} onChange={set("age")} type="number" unit="ans" />
        <Field label="Taille" value={form.taille_cm} onChange={set("taille_cm")} type="number" unit="cm" />
        <Field label="Poids objectif" value={form.poids_objectif_kg} onChange={set("poids_objectif_kg")} type="number" unit="kg" />
        <Select label="Niveau d'activité" value={form.niveau_activite} onChange={set("niveau_activite")} options={NIVEAUX_ACTIVITE} />
        <Field label="Objectif protéines perso (optionnel)" value={form.objectif_proteines_g} onChange={set("objectif_proteines_g")} type="number" unit="g/jour" placeholder="Laisser vide = calcul auto" />

        <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 16px" }}>
          Le poids actuel se met à jour via tes pesées dans l'onglet Progrès.
        </p>

        <Btn onClick={submit} disabled={loading}>{loading ? "..." : "Enregistrer"}</Btn>
      </div>
    </div>
  );
}
