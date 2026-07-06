// ═══════════════════════════════════════════════════════════
//  Lógica del juego (sin React) — rangos, RR, rachas y fechas
// ═══════════════════════════════════════════════════════════

export const THEME = {
  bg: "#080B14", panel: "#0F1626", panel2: "#151E33", line: "#243049",
  text: "#E7ECF5", dim: "#8A98B4", accent: "#31E0C4", pink: "#FF4D8D", gold: "#FBD34D",
};

export const RANKS = [
  { name: "Hierro",   gem: ["#4A515E", "#828C9E"], glow: "#828C9E" },
  { name: "Bronce",   gem: ["#7C4A22", "#D0894A"], glow: "#D0894A" },
  { name: "Plata",    gem: ["#7C879A", "#E6ECF5"], glow: "#C4CEDB" },
  { name: "Oro",      gem: ["#B37D14", "#FBD34D"], glow: "#FBD34D" },
  { name: "Platino",  gem: ["#137F94", "#5EEAD4"], glow: "#5EEAD4" },
  { name: "Diamante", gem: ["#4A5ED6", "#A6B9FF"], glow: "#A6B9FF" },
  { name: "Maestro",  gem: ["#6A2FBF", "#CC8CFF"], glow: "#CC8CFF" },
  { name: "Leyenda",  gem: ["#B8862B", "#FFE9A8"], glow: "#FFD98A", top: true },
];

export const RR_PER_DIVISION = 100;
export const DIVISIONS = ["III", "II", "I"];
const NORMAL_DIVISIONS = (RANKS.length - 1) * 3; // 21

// Tus 20 hábitos. xp = RR base (15 para los de más esfuerzo, 10 el resto).
export const DEFAULT_HABITS = [
  { name: "Levantarse a horas exactas", emoji: "⏰", xp: 10 },
  { name: "Tender la cama u organizar algo", emoji: "🧹", xp: 10 },
  { name: "Hidratación al despertar", emoji: "💧", xp: 10 },
  { name: "Ejercicios con propio peso (15 min)", emoji: "💪", xp: 15 },
  { name: "Estiramientos / ejercicio ligero", emoji: "🏃", xp: 10 },
  { name: "Ducha de agua tibia/fría", emoji: "🥶", xp: 10 },
  { name: "Desayuno saludable", emoji: "🍳", xp: 10 },
  { name: "Sol matutino (10-15 min)", emoji: "☀️", xp: 10 },
  { name: "Trabajar en enfoque profundo", emoji: "🎯", xp: 15 },
  { name: "Aprender / avanzar una habilidad", emoji: "📈", xp: 15 },
  { name: "Registrar gastos diarios", emoji: "📊", xp: 10 },
  { name: "No alcohol", emoji: "🍺", xp: 10 },
  { name: "Evitar paquetes y fritos", emoji: "🍟", xp: 10 },
  { name: "Evitar bebidas azucaradas", emoji: "🥤", xp: 10 },
  { name: "Meta de pasos / caminar", emoji: "🚶", xp: 10 },
  { name: "Espacio de trabajo ordenado", emoji: "🗂️", xp: 10 },
  { name: "Preparar ropa y mochila", emoji: "🎒", xp: 10 },
  { name: "Ventilar la habitación", emoji: "🌬️", xp: 10 },
  { name: "Dormir 6-8 horas", emoji: "🛌", xp: 15 },
  { name: "Dos litros de agua al día", emoji: "💦", xp: 10 },
];

// ── fechas (formato YYYY-MM-DD en hora local) ──
export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const today = () => dayKey(new Date());
export const shiftDay = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};
// lunes de la semana actual (para el ranking semanal)
export const weekStartKey = () => {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - offset);
  return dayKey(d);
};

// ── rango a partir del RR total ──
export function rankFromRR(totalRR) {
  const divIndex = Math.floor(totalRR / RR_PER_DIVISION);
  if (divIndex >= NORMAL_DIVISIONS) {
    const legend = RANKS[RANKS.length - 1];
    return {
      rank: legend, rankIndex: RANKS.length - 1, division: "", label: "Leyenda",
      rrInDivision: totalRR - NORMAL_DIVISIONS * RR_PER_DIVISION, needed: null, isTop: true,
    };
  }
  const rankIndex = Math.floor(divIndex / 3);
  const within = divIndex % 3; // 0=III, 1=II, 2=I
  const rank = RANKS[rankIndex];
  return {
    rank, rankIndex, division: DIVISIONS[within], label: `${rank.name} ${DIVISIONS[within]}`,
    rrInDivision: totalRR % RR_PER_DIVISION, needed: RR_PER_DIVISION, isTop: false,
  };
}

// ── multiplicador por racha (bonus tipo "win streak") ──
export function streakMultiplier(streak) {
  if (streak >= 14) return 2;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.2;
  return 1;
}

// ── racha: días consecutivos (terminando hoy o ayer) con ≥1 registro. ──
export function computeStreak(dates) {
  const t = today();
  let cursor = dates.has(t) ? t : shiftDay(t, -1);
  let s = 0;
  while (dates.has(cursor)) { s++; cursor = shiftDay(cursor, -1); }
  return s;
}
