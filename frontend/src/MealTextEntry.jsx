import { useState } from "react";
import { Btn, ErrorBox, BLUE, BLUE_LIGHT } from "./ui";
import VoiceInput from "./VoiceInput";

export default function MealTextEntry({ onAnalyze, renderResult }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function analyze() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await onAnalyze(description);
      setResult(r);
    } catch (e) {
      setError(e.message || "Impossible d'analyser cette description.");
    }
    setLoading(false);
  }

  function reset() {
    setDescription("");
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div>
        {renderResult(result)}
        <div style={{ marginTop: 12 }}>
          <Btn variant="secondary" onClick={reset}>+ Nouveau repas</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#555", marginBottom: 8 }}>
        Liste tes ingrédients et quantités
      </label>

      <div style={{ position: "relative", marginBottom: 6 }}>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: 150g de riz blanc cuit, 200g de blanc de poulet grillé, 1 cuillère d'huile d'olive... ou dicte 🎙️"
          rows={5}
          style={{
            width: "100%", padding: "13px 52px 13px 14px", borderRadius: 12, border: "2px solid #E0E6FF",
            fontSize: 15, fontFamily: "inherit", resize: "none", color: "#1a1a2e", boxSizing: "border-box"
          }}
        />
        <div style={{ position: "absolute", bottom: 10, right: 10 }}>
          <VoiceInput onTranscript={text => setDescription(prev => prev ? prev + " " + text : text)} />
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#999", margin: "0 0 16px" }}>
        Plus tu précises les grammages, plus l'estimation des macros sera fiable. Tu peux aussi dicter 🎙️
      </p>

      <ErrorBox>{error}</ErrorBox>

      <Btn onClick={analyze} disabled={loading || !description.trim()}>
        {loading ? "Analyse en cours..." : "Calculer les macros"}
      </Btn>
    </div>
  );
}
