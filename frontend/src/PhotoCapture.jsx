import { useState, useRef } from "react";
import { BLUE, BLUE_LIGHT, Btn, ErrorBox } from "./ui";

export default function PhotoCapture({ title, description, icon, onAnalyze, renderResult, extraControls }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const r = await onAnalyze(imageBase64);
      setResult(r);
    } catch (e) {
      setError(e.message || "Impossible d'analyser l'image. Réessaie avec une photo plus claire.");
    }
    setLoading(false);
  };

  const reset = () => { setImage(null); setResult(null); setImageBase64(null); setError(null); };

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e", margin: "0 0 4px" }}>{icon} {title}</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>{description}</p>

      {extraControls && !result && <div style={{ marginBottom: 14 }}>{extraControls}</div>}

      {!result && (
        <div onClick={() => fileRef.current.click()} style={{
          border: `2px dashed ${image ? BLUE : "#C5CDFF"}`, borderRadius: 16, cursor: "pointer",
          background: BLUE_LIGHT, minHeight: 160, display: "flex", alignItems: "center",
          justifyContent: "center", overflow: "hidden", marginBottom: 14
        }}>
          {image
            ? <img src={image} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
            : <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>{icon}</div>
                <p style={{ fontWeight: 600, color: BLUE, margin: 0, fontSize: 14 }}>Appuie pour ajouter une photo</p>
                <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>Caméra ou galerie</p>
              </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {image && !result && <Btn onClick={analyze} disabled={loading}>{loading ? "Analyse en cours..." : "Analyser"}</Btn>}

      <ErrorBox>{error}</ErrorBox>

      {result && (
        <div>
          {renderResult(result)}
          <div style={{ marginTop: 12 }}>
            <Btn variant="secondary" onClick={reset}>+ Nouvelle photo</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
