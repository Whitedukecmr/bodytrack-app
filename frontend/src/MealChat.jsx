import { useState, useRef } from "react";
import { BLUE, BLUE_LIGHT, RED, GREEN, ORANGE } from "./ui";
import { compressImage } from "./imageUtils";

// Interface chat unifiée : texte libre + photo + voix dans une seule zone
// L'IA détecte automatiquement ce qu'elle reçoit et adapte son analyse

export default function MealChat({ onAnalyzeText, onAnalyzeImage, onAnalyzeBoth, renderResult }) {
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null); // { dataUrl, base64 }
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef();
  const textareaRef = useRef();

  // ── Gestion image ──────────────────────────────────────────
  async function handleFile(file) {
    if (!file) return;
    setCompressing(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      setImageData(compressed);
    } catch (e) {
      setError("Impossible de lire cette image.");
    }
    setCompressing(false);
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  }

  // ── Reconnaissance vocale ──────────────────────────────────
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) return;
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setText(prev => prev ? prev + " " + transcript : transcript);
      textareaRef.current?.focus();
    };
    r.onerror = () => setListening(false);
    r.start();
  }

  // ── Envoi ──────────────────────────────────────────────────
  async function send() {
    if (!text.trim() && !imageData) return;
    setLoading(true);
    setError(null);
    try {
      let r;
      if (imageData && text.trim()) {
        // Image + texte : on passe les deux
        r = await onAnalyzeBoth(imageData.base64, text.trim());
      } else if (imageData) {
        // Image seule
        r = await onAnalyzeImage(imageData.base64);
      } else {
        // Texte seul
        r = await onAnalyzeText(text.trim());
      }
      setResult(r);
    } catch (e) {
      setError(e.message || "Une erreur s'est produite, réessaie.");
    }
    setLoading(false);
  }

  function reset() {
    setText("");
    setImageData(null);
    setResult(null);
    setError(null);
  }

  const canSend = (text.trim() || imageData) && !loading && !compressing;

  if (result) {
    return (
      <div>
        {renderResult(result)}
        <button onClick={reset} style={{
          marginTop: 12, width: "100%", padding: 13, borderRadius: 14,
          border: `2px solid #E0E6FF`, background: "white", color: BLUE,
          fontWeight: 700, fontSize: 14, cursor: "pointer"
        }}>+ Nouveau repas</button>
      </div>
    );
  }

  return (
    <div>
      {/* Zone principale de saisie */}
      <div style={{
        border: `2px solid ${imageData ? BLUE : "#E0E6FF"}`, borderRadius: 16,
        background: "white", overflow: "hidden",
        transition: "border-color 0.2s"
      }}>
        {/* Aperçu image si présente */}
        {imageData && (
          <div style={{ position: "relative" }}>
            <img src={imageData.dataUrl} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
            <button onClick={() => setImageData(null)} style={{
              position: "absolute", top: 8, right: 8, width: 28, height: 28,
              borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none",
              color: "white", fontSize: 14, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>✕</button>
            <div style={{
              position: "absolute", bottom: 8, left: 8,
              background: "rgba(59,91,252,0.85)", borderRadius: 8,
              padding: "3px 8px", fontSize: 10, color: "white", fontWeight: 600
            }}>📷 Photo ajoutée</div>
          </div>
        )}

        {/* Zone texte */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onPaste={handlePaste}
          placeholder={imageData
            ? "Ajoute un commentaire (optionnel) : ex. 'c'est mon dîner de ce soir'"
            : "Décris ton repas ou colle/importe une photo 📎\nEx: 150g de riz, 200g de poulet grillé, salade verte..."}
          rows={imageData ? 2 : 4}
          style={{
            width: "100%", padding: "12px 14px", border: "none", outline: "none",
            fontSize: 14, fontFamily: "inherit", resize: "none",
            color: "#1a1a2e", background: "transparent",
            boxSizing: "border-box"
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
        />

        {/* Barre d'actions */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderTop: "1px solid #F0F2FF"
        }}>
          {/* Bouton photo */}
          <button onClick={() => fileRef.current.click()} style={{
            width: 34, height: 34, borderRadius: 10, border: "1.5px solid #E0E6FF",
            background: imageData ? BLUE_LIGHT : "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
          }} title="Ajouter une photo">📷</button>

          {/* Bouton micro */}
          <button onClick={toggleVoice} style={{
            width: 34, height: 34, borderRadius: 10,
            border: listening ? `1.5px solid ${RED}` : "1.5px solid #E0E6FF",
            background: listening ? "#FEE2E2" : "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            animation: listening ? "pulse 1s infinite" : "none"
          }} title="Dicter">
            {listening ? "⏹" : "🎙️"}
          </button>

          <div style={{ flex: 1 }} />

          {/* Hint */}
          <span style={{ fontSize: 10, color: "#ccc" }}>
            {compressing ? "Compression..." : "⌘↵ pour envoyer"}
          </span>

          {/* Bouton envoyer */}
          <button onClick={send} disabled={!canSend} style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: canSend ? BLUE : "#E0E6FF",
            color: canSend ? "white" : "#aaa",
            fontWeight: 700, fontSize: 13, cursor: canSend ? "pointer" : "default",
            transition: "all 0.2s"
          }}>
            {loading ? "..." : "Analyser →"}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])} />

      {/* Message d'erreur */}
      {error && (
        <div style={{ marginTop: 10, background: "#FEE2E2", borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, color: RED }}>{error}</p>
        </div>
      )}

      <p style={{ fontSize: 11, color: "#aaa", margin: "8px 0 0", textAlign: "center" }}>
        Photo 📷 · Texte libre ✍️ · Dictée 🎙️ · ou les trois en même temps
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
