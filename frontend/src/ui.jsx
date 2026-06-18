export const BLUE = "#3B5BFC";
export const BLUE_DARK = "#2742d4";
export const BLUE_LIGHT = "#EEF1FF";
export const GREEN = "#22c55e";
export const ORANGE = "#f59e0b";
export const RED = "#ef4444";

export function Field({ label, value, onChange, type = "text", unit, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#555", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: "2px solid #E0E6FF", borderRadius: 12, overflow: "hidden", background: "white" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, border: "none", outline: "none", padding: "13px 14px", fontSize: 16, background: "transparent", color: "#1a1a2e" }} />
        {unit && <span style={{ padding: "0 14px", color: "#888", fontWeight: 600, fontSize: 13 }}>{unit}</span>}
      </div>
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#555", marginBottom: 6 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "13px 14px", borderRadius: 12, border: "2px solid #E0E6FF",
        fontSize: 16, background: "white", color: "#1a1a2e"
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: small ? "auto" : "100%", padding: small ? "9px 16px" : "15px",
      borderRadius: 14, border: variant === "secondary" ? `2px solid ${BLUE}` : "none",
      cursor: disabled ? "default" : "pointer", fontWeight: 700, fontSize: small ? 13 : 16,
      background: disabled ? "#ccc" : variant === "primary" ? BLUE : variant === "danger" ? "#fee2e2" : "white",
      color: disabled ? "#aaa" : variant === "primary" ? "white" : variant === "danger" ? RED : BLUE,
      transition: "all 0.2s", boxShadow: disabled || variant !== "primary" ? "none" : "0 4px 14px rgba(59,91,252,0.25)",
    }}>{children}</button>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "white", borderRadius: 18, padding: 18, boxShadow: "0 4px 24px rgba(59,91,252,0.08)", ...style }}>
      {children}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div style={{ background: "#FFF0F0", borderRadius: 12, padding: 14, color: "#c0392b", fontSize: 14, marginBottom: 12 }}>
      {children}
    </div>
  );
}

export function SuccessBox({ children }) {
  if (!children) return null;
  return (
    <div style={{ background: "#F0FFF4", borderRadius: 12, padding: 14, color: "#166534", fontSize: 14, marginBottom: 12 }}>
      {children}
    </div>
  );
}
