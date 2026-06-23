import { useState } from "react";

// ── Design tokens ──────────────────────────────────────────────
export const BLUE       = "#3B5BFC";
export const BLUE_DARK  = "#2742d4";
export const BLUE_LIGHT = "#EEF1FF";
export const GREEN      = "#22c55e";
export const GREEN_LIGHT= "#F0FFF4";
export const ORANGE     = "#f59e0b";
export const ORANGE_LIGHT="#FFF7ED";
export const RED        = "#ef4444";
export const RED_LIGHT  = "#FEF2F2";
export const PURPLE     = "#8B5CF6";
export const BG         = "#F4F6FF";
export const TEXT       = "#1a1a2e";
export const TEXT_MUTED = "#6b7280";

// Dégradé principal header
export const GRADIENT_HEADER = "linear-gradient(135deg, #3B5BFC 0%, #6366F1 55%, #8B5CF6 100%)";

// ── Composants de base ─────────────────────────────────────────

export function Card({ children, style, glass }) {
  return (
    <div style={{
      background: glass ? "rgba(255,255,255,0.85)" : "white",
      backdropFilter: glass ? "blur(12px)" : "none",
      borderRadius: 20,
      padding: "16px 18px",
      boxShadow: "0 2px 20px rgba(59,91,252,0.07), 0 1px 4px rgba(0,0,0,0.04)",
      border: "1px solid rgba(255,255,255,0.8)",
      ...style
    }}>
      {children}
    </div>
  );
}

export function GradientCard({ children, style, colors }) {
  const bg = colors || `linear-gradient(135deg, ${BLUE} 0%, ${PURPLE} 100%)`;
  return (
    <div style={{
      background: bg, borderRadius: 20, padding: "16px 18px",
      boxShadow: "0 8px 32px rgba(59,91,252,0.25)",
      ...style
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, small, style }) {
  const base = {
    width: small ? "auto" : "100%",
    padding: small ? "9px 18px" : "15px",
    borderRadius: 14, border: "none",
    cursor: disabled ? "default" : "pointer",
    fontWeight: 700, fontSize: small ? 13 : 15,
    fontFamily: "inherit",
    transition: "all 0.2s",
    ...style
  };

  if (disabled) return (
    <button onClick={onClick} disabled style={{ ...base, background: "#E5E7EB", color: "#9CA3AF" }}>
      {children}
    </button>
  );

  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${BLUE} 0%, #6366F1 100%)`,
      color: "white",
      boxShadow: "0 4px 16px rgba(59,91,252,0.35)",
    },
    secondary: {
      background: BLUE_LIGHT,
      color: BLUE,
      border: `1.5px solid #C7D0FF`,
    },
    danger: {
      background: RED_LIGHT,
      color: RED,
      border: `1.5px solid #FECACA`,
    },
    ghost: {
      background: "transparent",
      color: BLUE,
      border: `1.5px solid #E0E6FF`,
    },
  };

  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant] || variants.primary }}>
      {children}
    </button>
  );
}

export function Field({ label, value, onChange, type = "text", unit, placeholder, voice }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>{label}</label>}
      <div style={{
        display: "flex", alignItems: "center",
        border: "1.5px solid #E5E7EB", borderRadius: 12,
        overflow: "hidden", background: "white",
        transition: "border-color 0.2s",
      }}>
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: "none", outline: "none",
            padding: "13px 14px", fontSize: 15,
            background: "transparent", color: TEXT,
            fontFamily: "inherit",
          }}
        />
        {unit && <span style={{ padding: "0 14px", color: TEXT_MUTED, fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{unit}</span>}
        {voice && (
          <div style={{ padding: "0 8px 0 0" }}>
            <VoiceInputInline onTranscript={voice} />
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceInputInline({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!supported) return null;

  function toggle() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = e => onTranscript(e.results[0][0].transcript);
    r.onerror = () => setListening(false);
    r.start();
  }

  return (
    <button onClick={toggle} style={{
      width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
      background: listening ? "#FEE2E2" : BLUE_LIGHT, fontSize: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {listening ? "⏹" : "🎙️"}
    </button>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "13px 14px", borderRadius: 12,
        border: "1.5px solid #E5E7EB", fontSize: 15,
        background: "white", color: TEXT, fontFamily: "inherit",
        appearance: "auto",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div style={{
      background: RED_LIGHT, borderRadius: 12, padding: "12px 14px",
      color: "#b91c1c", fontSize: 13, marginBottom: 12,
      border: "1px solid #FECACA",
    }}>
      {children}
    </div>
  );
}

export function SuccessBox({ children }) {
  if (!children) return null;
  return (
    <div style={{
      background: GREEN_LIGHT, borderRadius: 12, padding: "12px 14px",
      color: "#166534", fontSize: 13, marginBottom: 12,
      border: "1px solid #BBF7D0",
    }}>
      {children}
    </div>
  );
}

// ── Composant Badge ────────────────────────────────────────────
export function Badge({ children, color = BLUE, bg = BLUE_LIGHT }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color, borderRadius: 99,
      padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

// ── Composant StatCard ─────────────────────────────────────────
export function StatCard({ label, value, unit, color = BLUE, icon, style }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "14px 12px",
      boxShadow: "0 2px 12px rgba(59,91,252,0.06)",
      border: "1px solid #F0F2FF", textAlign: "center", ...style
    }}>
      {icon && <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{unit}</div>}
    </div>
  );
}

// ── Barre de progression ───────────────────────────────────────
export function ProgressBar({ value, max, color, bg, height = 6 }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div style={{ background: bg || "#F0F2FF", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{
        background: color || BLUE, height: "100%", borderRadius: 99,
        width: `${pct}%`, transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 10px" }}>
      <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: TEXT }}>{children}</p>
      {action && <span style={{ fontSize: 12, color: BLUE, fontWeight: 600, cursor: "pointer" }}>{action}</span>}
    </div>
  );
}
