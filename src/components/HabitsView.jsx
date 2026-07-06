import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Flame, Trophy, Check, Trash2, Zap, Loader2 } from "lucide-react";
import RankBadge from "./RankBadge";
import {
  THEME as S, DEFAULT_HABITS, today, shiftDay,
  rankFromRR, streakMultiplier, computeStreak,
} from "../lib/game";

export default function HabitsView({ userId, totalRR, setTotalRR }) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [todayMap, setTodayMap] = useState({});     // habit_id -> { id, rr_earned }
  const [countsByDate, setCountsByDate] = useState({}); // "YYYY-MM-DD" -> nº hábitos
  const [toast, setToast] = useState(null);
  const [rankUp, setRankUp] = useState(null);
  const [busy, setBusy] = useState(null);

  const t = today();
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return; // evita el doble arranque en desarrollo que duplicaba los hábitos
    didLoad.current = true;
    loadAll();
    // eslint-disable-next-line
  }, [userId]);

  async function loadAll() {
    setLoading(true);
    try {
      let { data: hs, error } = await supabase.from("habits")
        .select("id,name,emoji,xp").eq("user_id", userId).eq("is_active", true)
        .order("sort_order").order("created_at");
      if (error) throw error;
      if (!hs || hs.length === 0) hs = await seedDefaults();
      setHabits(hs);

      const from = shiftDay(t, -34);
      const { data: comps, error: e2 } = await supabase.from("completions")
        .select("id,habit_id,completed_on,rr_earned")
        .eq("user_id", userId).gte("completed_on", from);
      if (e2) throw e2;

      const counts = {}, tmap = {};
      (comps || []).forEach((c) => {
        counts[c.completed_on] = (counts[c.completed_on] || 0) + 1;
        if (c.completed_on === t) tmap[c.habit_id] = { id: c.id, rr_earned: c.rr_earned };
      });
      setCountsByDate(counts); setTodayMap(tmap);
    } catch (e) {
      console.error(e); showToast("No se pudo cargar", "revisa tu conexión");
    } finally {
      setLoading(false);
    }
  }

  async function seedDefaults() {
    const rows = DEFAULT_HABITS.map((h, i) => ({ ...h, user_id: userId, sort_order: i }));
    const { data, error } = await supabase.from("habits").insert(rows).select("id,name,emoji,xp");
    if (error) throw error;
    return data;
  }

  const streakDates = new Set(Object.keys(countsByDate).filter((d) => countsByDate[d] > 0));
  const streak = computeStreak(streakDates);
  const mult = streakMultiplier(streak);
  const rankInfo = rankFromRR(totalRR);
  const doneCount = Object.keys(todayMap).length;
  const dayPct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  const pct = rankInfo.isTop ? 100 : Math.min(100, Math.round((rankInfo.rrInDivision / rankInfo.needed) * 100));

  const week = Array.from({ length: 7 }).map((_, i) => {
    const k = shiftDay(t, -(6 - i));
    return { k, count: countsByDate[k] || 0, d: k.split("-")[2], isToday: k === t };
  });

  function showToast(msg, sub) {
    setToast({ msg, sub, id: Date.now() });
    setTimeout(() => setToast(null), 1800);
  }

  async function refreshTotalRR() {
    const { data, error } = await supabase.from("profiles").select("total_rr").eq("id", userId).single();
    if (error) throw error;
    return data.total_rr;
  }

  async function toggle(habit) {
    if (busy) return;
    const isDone = !!todayMap[habit.id];
    setBusy(habit.id);
    try {
      if (isDone) {
        const rec = todayMap[habit.id];
        const { error } = await supabase.from("completions").delete().eq("id", rec.id);
        if (error) throw error;
        const newTotal = await refreshTotalRR(); // el trigger de Postgres ya recalculó profiles.total_rr
        const tmap = { ...todayMap }; delete tmap[habit.id]; setTodayMap(tmap);
        setCountsByDate({ ...countsByDate, [t]: Math.max(0, (countsByDate[t] || 0) - 1) });
        setTotalRR(newTotal);
      } else {
        const rr = Math.round(habit.xp * mult);
        const { data, error } = await supabase.from("completions")
          .insert({ user_id: userId, habit_id: habit.id, completed_on: t, rr_earned: rr })
          .select("id").single();
        if (error) throw error;
        const before = rankFromRR(totalRR).label;
        const newTotal = await refreshTotalRR(); // el trigger de Postgres ya recalculó profiles.total_rr
        setTodayMap({ ...todayMap, [habit.id]: { id: data.id, rr_earned: rr } });
        setCountsByDate({ ...countsByDate, [t]: (countsByDate[t] || 0) + 1 });
        setTotalRR(newTotal);
        const after = rankFromRR(newTotal).label;
        if (after !== before) { setRankUp(rankFromRR(newTotal)); setTimeout(() => setRankUp(null), 3200); }
        else showToast(`+${rr} RR`, mult > 1 ? `Racha x${mult}` : habit.name);
      }
    } catch (e) {
      console.error(e); showToast("Error al guardar", "intenta de nuevo");
    } finally {
      setBusy(null);
    }
  }

  async function removeHabit(id) {
    try {
      // desactivar en vez de borrar: conserva tu historial de RR
      await supabase.from("habits").update({ is_active: false }).eq("id", id);
      setHabits(habits.filter((h) => h.id !== id));
    } catch (e) {
      console.error(e); showToast("No se pudo quitar", "");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: S.dim }}>
        <Loader2 className="spin" size={20} style={{ marginRight: 8 }} /> Cargando tu progreso…
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* HEADER: RANGO */}
      <div style={{
        background: `radial-gradient(120% 120% at 50% 0%, ${rankInfo.rank.glow}1a 0%, ${S.panel} 46%)`,
        border: `1px solid ${S.line}`, borderRadius: 20, padding: "20px 18px 18px",
      }}>
        <div className="disp" style={{ fontSize: 11, letterSpacing: 3, color: S.dim, textTransform: "uppercase", marginBottom: 6 }}>Rango actual</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ animation: "pulseGlow 3.4s ease-in-out infinite" }}>
            <RankBadge rankInfo={rankInfo} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="disp" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: rankInfo.rank.glow, textShadow: `0 0 18px ${rankInfo.rank.glow}55` }}>
              {rankInfo.rank.name}
            </div>
            {!rankInfo.isTop && (
              <div className="disp" style={{ fontSize: 15, color: S.text, letterSpacing: 2, marginTop: 2 }}>División {rankInfo.division}</div>
            )}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span className="mono" style={{ fontSize: 13, color: rankInfo.rank.glow }}>{rankInfo.rrInDivision} RR</span>
                <span className="disp" style={{ fontSize: 11, color: S.dim, letterSpacing: 1 }}>
                  {rankInfo.isTop ? "RANGO MÁXIMO" : `${rankInfo.needed - rankInfo.rrInDivision} para subir`}
                </span>
              </div>
              <div style={{ height: 9, background: "#0a0f1c", borderRadius: 20, overflow: "hidden", border: `1px solid ${S.line}` }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 20,
                  background: `linear-gradient(90deg, ${rankInfo.rank.gem[0]}, ${rankInfo.rank.glow})`,
                  boxShadow: `0 0 12px ${rankInfo.rank.glow}aa`, transition: "width .5s cubic-bezier(.2,.8,.2,1)",
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
        <Stat icon={<Flame size={16} color={S.pink} />} label="Racha" value={`${streak}d`} sub={mult > 1 ? `x${mult} RR` : "sin bonus"} accent={S.pink} />
        <Stat icon={<Zap size={16} color={S.accent} />} label="Hoy" value={`${doneCount}/${habits.length}`} sub={`${dayPct}%`} accent={S.accent} />
        <Stat icon={<Trophy size={16} color={S.gold} />} label="RR total" value={totalRR} sub="acumulado" accent={S.gold} />
      </div>

      {/* TIRA SEMANAL */}
      <div style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 16, padding: "14px 14px 12px", marginTop: 12 }}>
        <div className="disp" style={{ fontSize: 11, letterSpacing: 2, color: S.dim, textTransform: "uppercase", marginBottom: 10 }}>Últimos 7 días</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
          {week.map((w) => {
            const intensity = habits.length ? w.count / habits.length : 0;
            const bg = w.count === 0 ? "#141d31" : `rgba(49,224,196,${0.25 + Math.min(1, intensity) * 0.75})`;
            return (
              <div key={w.k} style={{ flex: 1, textAlign: "center" }}>
                <div className="disp" style={{
                  height: 34, borderRadius: 9, background: bg,
                  border: w.isToday ? `1.5px solid ${S.accent}` : `1px solid ${S.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: intensity > 0.4 ? "#04120f" : S.dim, fontWeight: 700, fontSize: 12,
                }}>{w.count || ""}</div>
                <div className="disp" style={{ fontSize: 10, color: w.isToday ? S.accent : S.dim, marginTop: 4 }}>{w.d}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HÁBITOS */}
      <div style={{ margin: "20px 2px 10px" }}>
        <div className="disp" style={{ fontSize: 13, letterSpacing: 2, color: S.text, textTransform: "uppercase" }}>Hábitos de hoy</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {habits.map((h) => {
          const done = !!todayMap[h.id];
          const gained = Math.round(h.xp * mult);
          return (
            <div key={h.id} className="hb-row" onClick={() => toggle(h)} style={{
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              background: done ? `linear-gradient(90deg, ${S.accent}14, ${S.panel})` : S.panel,
              border: `1px solid ${done ? S.accent + "66" : S.line}`, borderRadius: 13, padding: "11px 13px",
              opacity: busy === h.id ? 0.6 : 1,
            }}>
              <div className="chk" style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: done ? S.accent : "transparent", border: `2px solid ${done ? S.accent : S.line}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: done ? `0 0 12px ${S.accent}88` : "none",
              }}>
                {done && <Check size={16} color="#04120f" strokeWidth={3.5} />}
              </div>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{h.emoji}</span>
              <span className="disp" style={{ flex: 1, fontSize: 16, fontWeight: 600, color: done ? S.text : "#C7D2E6" }}>{h.name}</span>
              <span className="mono" style={{ fontSize: 12, color: done ? S.accent : S.dim, flexShrink: 0 }}>+{gained}</span>
              <button onClick={(e) => { e.stopPropagation(); removeHabit(h.id); }} style={{ background: "transparent", border: "none", color: S.line, padding: 2, flexShrink: 0 }}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* TOAST */}
      {toast && (
        <div key={toast.id} style={{
          position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)",
          background: S.panel2, border: `1px solid ${S.accent}66`, borderRadius: 12, padding: "10px 18px",
          boxShadow: `0 8px 30px #000a, 0 0 20px ${S.accent}33`, animation: "floatUp 1.8s ease-out forwards", textAlign: "center", zIndex: 40,
        }}>
          <div className="mono" style={{ color: S.accent, fontSize: 18 }}>{toast.msg}</div>
          <div className="disp" style={{ color: S.dim, fontSize: 11, letterSpacing: 1 }}>{toast.sub}</div>
        </div>
      )}

      {/* ASCENSO */}
      {rankUp && (
        <div onClick={() => setRankUp(null)} style={{
          position: "fixed", inset: 0, background: "#030509ee", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 60,
        }}>
          <div className="disp" style={{ color: rankUp.rank.glow, letterSpacing: 6, fontSize: 14, marginBottom: 18, textTransform: "uppercase" }}>¡Ascenso!</div>
          <div style={{ animation: "badgeIn .7s cubic-bezier(.2,.9,.3,1.4)" }}><RankBadge rankInfo={rankUp} size={190} /></div>
          <div className="disp" style={{ fontSize: 36, fontWeight: 700, color: rankUp.rank.glow, marginTop: 20, textShadow: `0 0 24px ${rankUp.rank.glow}` }}>{rankUp.label}</div>
          <div className="disp" style={{ color: S.dim, fontSize: 13, letterSpacing: 1, marginTop: 20 }}>toca para continuar</div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 14, padding: "12px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        {icon}
        <span className="disp" style={{ fontSize: 10, letterSpacing: 1.5, color: S.dim, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div className="disp" style={{ fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div className="disp" style={{ fontSize: 11, color: S.dim, marginTop: 3 }}>{sub}</div>
    </div>
  );
}
