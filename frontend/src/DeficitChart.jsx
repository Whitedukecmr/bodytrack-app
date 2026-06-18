import { BLUE, GREEN, RED } from "./ui";

// Petit graphique en barres SVG, sans dépendance externe.
// Une barre par jour, hauteur proportionnelle au déficit (vert) ou surplus (rouge).
export default function DeficitChart({ jours, onDayClick, selectedDate }) {
  if (!jours || jours.length === 0) return null;

  const width = 340;
  const height = 140;
  const padding = 10;
  const barGap = 3;
  const barWidth = (width - padding * 2) / jours.length - barGap;

  const maxAbs = Math.max(...jours.map(j => Math.abs(j.deficitNet)), 500);
  const zeroY = height / 2;
  const scale = (height / 2 - padding) / maxAbs;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: 280 }}>
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#E0E6FF" strokeWidth="1" />
        {jours.map((j, i) => {
          const x = padding + i * (barWidth + barGap);
          const barH = Math.abs(j.deficitNet) * scale;
          const isDeficit = j.deficitNet >= 0;
          const y = isDeficit ? zeroY - barH : zeroY;
          const isToday = j.date === todayStr;
          const isSelected = j.date === selectedDate;
          const color = isDeficit ? GREEN : RED;

          return (
            <g key={j.date} onClick={() => onDayClick && onDayClick(j.date)} style={{ cursor: onDayClick ? "pointer" : "default" }}>
              <rect
                x={x} y={y} width={Math.max(barWidth, 2)} height={Math.max(barH, 2)}
                fill={color} opacity={isSelected ? 1 : 0.55} rx="2"
              />
              {isToday && (
                <circle cx={x + barWidth / 2} cy={height - 4} r="2" fill={BLUE} />
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", padding: "0 4px" }}>
        <span>{jours[0]?.date.slice(5)}</span>
        <span>{jours[jours.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
