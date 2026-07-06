import React from "react";

function Star({ cx, cy, r, fill = "#fff" }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

export default function RankBadge({ rankInfo, size = 118 }) {
  const [c1, c2] = rankInfo.rank.gem;
  const gid = `g-${rankInfo.rankIndex}-${size}`;
  const stars = rankInfo.division === "I" ? 3 : rankInfo.division === "II" ? 2 : 1;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ filter: `drop-shadow(0 0 14px ${rankInfo.rank.glow}66)` }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      <path d="M50 6 L86 22 L86 52 C86 74 68 88 50 94 C32 88 14 74 14 52 L14 22 Z"
        fill={`url(#${gid})`} stroke={c2} strokeWidth="2" />
      <path d="M50 6 L86 22 L86 52 C86 74 68 88 50 94 C32 88 14 74 14 52 L14 22 Z"
        fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
      <path d="M50 20 L72 30 L72 52 C72 66 62 76 50 82 C38 76 28 66 28 52 L28 30 Z"
        fill="#000000" fillOpacity="0.18" />
      {!rankInfo.isTop && (
        <g fill="#ffffff" fillOpacity="0.95">
          {Array.from({ length: stars }).map((_, i, arr) => {
            const x = 50 + (i - (arr.length - 1) / 2) * 12;
            return <Star key={i} cx={x} cy={62} r={4} />;
          })}
        </g>
      )}
      {rankInfo.isTop && <Star cx={50} cy={54} r={9} fill="#fff" />}
    </svg>
  );
}
