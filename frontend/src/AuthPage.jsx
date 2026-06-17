import { useState } from "react";
import { api, setToken } from "./api";
import { Field, Select, Btn, ErrorBox, BLUE } from "./ui";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: "", password: "", prenom: "", nom: "", sexe: "homme",
    age: "", taille_cm: "", poids_initial_kg: "", poids_objectif_kg: "", niveau_activite: "modere"
  });

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { ...form, age: Number(form.age), taille_cm: Number(form.taille_cm), poids_initial_kg: Number(form.poids_initial_kg), poids_objectif_kg: Number(form.poids_objectif_kg) };

      const result = mode === "login" ? await api.login(payload) : await api.register(payload);
      setToken(result.token);
      onAuth(result.user);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "white", padding: "32px 24px", fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');`}</style>

      <h1 style={{ fontWeight: 900, fontSize: 28, color: "#1a1a2e", margin: "0 0 6px" }}>
        {mode === "login" ? "Bon retour 👋" : "Créons ton profil 🎯"}
      </h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
        {mode === "login" ? "Connecte-toi pour retrouver ton suivi" : "Quelques infos pour calculer ton métabolisme"}
      </p>

      <ErrorBox>{error}</ErrorBox>

      <Field label="Email" value={form.email} onChange={set("email")} type="email" placeholder="toi@email.com" />
      <Field label="Mot de passe" value={form.password} onChange={set("password")} type="password" placeholder="••••••••" />

      {mode === "register" && (
        <>
          <Field label="Prénom" value={form.prenom} onChange={set("prenom")} placeholder="Ex: Marie" />
          <Field label="Nom" value={form.nom} onChange={set("nom")} placeholder="Ex: Dupont" />
          <Select label="Sexe" value={form.sexe} onChange={set("sexe")} options={[
            { value: "homme", label: "Homme" }, { value: "femme", label: "Femme" }
          ]} />
          <Field label="Âge" value={form.age} onChange={set("age")} type="number" unit="ans" placeholder="Ex: 35" />
          <Field label="Taille" value={form.taille_cm} onChange={set("taille_cm")} type="number" unit="cm" placeholder="Ex: 170" />
          <Field label="Poids actuel" value={form.poids_initial_kg} onChange={set("poids_initial_kg")} type="number" unit="kg" placeholder="Ex: 80" />
          <Field label="Poids objectif" value={form.poids_objectif_kg} onChange={set("poids_objectif_kg")} type="number" unit="kg" placeholder="Ex: 75" />
          <Select label="Niveau d'activité" value={form.niveau_activite} onChange={set("niveau_activite")} options={[
            { value: "sedentaire", label: "Sédentaire (bureau, peu de sport)" },
            { value: "leger", label: "Légèrement actif (1-2x/sem)" },
            { value: "modere", label: "Modérément actif (3-4x/sem)" },
            { value: "actif", label: "Actif (5-6x/sem)" },
            { value: "tres_actif", label: "Très actif (sport intense quotidien)" },
          ]} />
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <Btn onClick={submit} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon profil"}
        </Btn>
      </div>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#666" }}>
        {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
        <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: BLUE, fontWeight: 700, cursor: "pointer" }}>
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </span>
      </p>
    </div>
  );
}
