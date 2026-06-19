import { BLUE, GREEN, ORANGE } from "./ui";

// Courbe d'évolution du poids dans le temps, en SVG natif (pas de dépendance externe).
export default function WeightChart({ history, poidsObjectif }) {
  if (!history || history.length < 2) return null;

  const width = 340;
  const height = 160;
  const padding = { top: 20, right: 10, bottom: 24, left: 38 };

  const poids = history.map(h => Number(h.poids_kg));
  const dates = history.map(h => new Date(h.logged_at));

  const minPoids = Math.min(...poids, Number(poidsObjectif)) - 1;
  const maxPoids = Math.max(...poids) + 1;
  const range = maxPoids - minPoids || 1;

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xFor = (i) => padding.left + (i / (history.length - 1)) * plotWidth;
  const yFor = (p) => padding.top + (1 - (p - minPoids) / range) * plotHeight;

  const points = poids.map((p, i) => `${xFor(i)},${yFor(p)}`).join(' ');
  const objectifY = yFor(Number(poidsObjectif));

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: 280 }}>
        {/* Ligne objectif en pointillés */}
        <line x1={padding.left} y1={objectifY} x2={width - padding.right} y2={objectifY}
          stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4,3" />
        <text x={width - padding.right} y={objectifY - 4} textAnchor="end" fontSize="9" fill={ORANGE}>
          Objectif {poidsObjectif}kg
        </text>

        {/* Courbe de poids */}
        <polyline points={points} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {poids.map((p, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(p)} r={i === poids.length - 1 ? 4 : 2.5}
            fill={i === poids.length - 1 ? GREEN : BLUE} stroke="white" strokeWidth="1.5" />
        ))}

        {/* Axe Y : min/max */}
        <text x={2} y={padding.top + 4} fontSize="9" fill="#999">{maxPoids.toFixed(0)}</text>
        <text x={2} y={height - padding.bottom} fontSize="9" fill="#999">{minPoids.toFixed(0)}</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#999", padding: "0 4px" }}>
        <span>{dates[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
        <span>{dates[dates.length - 1].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
      </div>
    </div>
  );
}
