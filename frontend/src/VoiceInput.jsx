import { useState, useRef } from "react";
import { BLUE, RED } from "./ui";

// Utilise l'API Web Speech native du navigateur (iOS Safari + Android Chrome)
// Aucune dépendance externe, aucun coût API

export default function VoiceInput({ onTranscript, placeholder, style }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recogRef = useRef(null);

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = 'fr-FR';
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);

    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onTranscript(text);
    };

    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    recog.start();
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <button
      onClick={listening ? stopListening : startListening}
      title={listening ? "Arrêter l'écoute" : "Dicter"}
      style={{
        width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
        background: listening ? RED : BLUE,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0,
        animation: listening ? "pulse 1s infinite" : "none",
        boxShadow: listening ? `0 0 0 4px ${RED}33` : "none",
        ...style
      }}
    >
      {listening ? "⏹" : "🎙️"}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </button>
  );
}
