import { useState } from "react";
import { api } from "./api";
import { Field, Select, Btn, ErrorBox, SuccessBox, BLUE } from "./ui";

const NIVEAUX_ACTIVITE = [
  { value: "sedentaire", label: "Sédentaire (bureau, peu de sport)" },
  { value: "leger", label: "Légèrement actif (1-2x/sem)" },
  { value: "modere", label: "Modérément actif (3-4x/sem)" },
  { value: "actif", label: "Actif (5-6x/sem)" },
  { value: "tres_actif", label: "Très actif (sport intense quotidien)" },
];

export default function EditProfile({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    prenom: user.prenom,
    nom: user.nom,
    sexe: user.sexe,
    age: user.age,
    taille_cm: user.taille_cm,
    poids_objectif_kg: user.poids_objectif_kg,
    niveau_activite: user.niveau_activite,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

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
        width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto"
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

        <Field label="Prénom" value={form.prenom} onChange={set("prenom")} />
        <Field label="Nom" value={form.nom} onChange={set("nom")} />
        <Select label="Sexe" value={form.sexe} onChange={set("sexe")} options={[
          { value: "homme", label: "Homme" }, { value: "femme", label: "Femme" }
        ]} />
        <Field label="Âge" value={form.age} onChange={set("age")} type="number" unit="ans" />
        <Field label="Taille" value={form.taille_cm} onChange={set("taille_cm")} type="number" unit="cm" />
        <Field label="Poids objectif" value={form.poids_objectif_kg} onChange={set("poids_objectif_kg")} type="number" unit="kg" />
        <Select label="Niveau d'activité" value={form.niveau_activite} onChange={set("niveau_activite")} options={NIVEAUX_ACTIVITE} />

        <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 16px" }}>
          Le poids actuel n'est pas modifiable ici — il se met à jour automatiquement via tes pesées dans l'onglet Progrès.
        </p>

        <Btn onClick={submit} disabled={loading}>{loading ? "..." : "Enregistrer"}</Btn>
      </div>
    </div>
  );
}
