import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trophy, Plus, Users, Copy, Check, ArrowLeft, Crown, Loader2, X, LogIn } from "lucide-react";
import RankBadge from "./RankBadge";
import { THEME as S, rankFromRR } from "../lib/game";

const MODES = [
  { key: "daily", label: "Hoy", field: "daily_rr" },
  { key: "weekly", label: "Semana", field: "weekly_rr" },
  { key: "total", label: "Total", field: "total_rr" },
];

export default function LeaguesView({ userId }) {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [mode, setMode] = useState("total");
  const [modal, setModal] = useState(null); // "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => { loadLeagues(); /* eslint-disable-next-line */ }, [userId]);

  async function loadLeagues() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("league_members")
        .select("leagues(id,name,invite_code,owner_id)")
        .eq("user_id", userId);
      if (error) throw error;
      setLeagues((data || []).map((r) => r.leagues).filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function openLeague(lg) {
    setSelected(lg); setBoard([]); setBoardLoading(true); setMode("total");
    try {
      const { data, error } = await supabase.rpc("league_rankings", { p_league_id: lg.id });
      if (error) throw error;
      setBoard(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBoardLoading(false);
    }
  }

  async function createLeague() {
    const n = name.trim(); if (!n) return;
    setWorking(true); setErr("");
    try {
      const { data: lg, error } = await supabase
        .from("leagues").insert({ name: n, owner_id: userId })
        .select("id,name,invite_code,owner_id").single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("league_members").insert({ league_id: lg.id, user_id: userId });
      if (e2) throw e2;
      setName(""); setModal(null);
      await loadLeagues();
      openLeague(lg);
    } catch (e) {
      console.error(e); setErr("No se pudo crear la liga.");
    } finally {
      setWorking(false);
    }
  }

  async function joinLeague() {
    const c = code.trim().toUpperCase(); if (!c) return;
    setWorking(true); setErr("");
    try {
      const { data: lg, error } = await supabase
        .from("leagues").select("id,name,invite_code,owner_id").eq("invite_code", c).maybeSingle();
      if (error) throw error;
      if (!lg) { setErr("No existe una liga con ese código."); setWorking(false); return; }
      const { error: e2 } = await supabase.from("league_members").insert({ league_id: lg.id, user_id: userId });
      if (e2 && !`${e2.message}`.toLowerCase().includes("duplicate")) throw e2;
      setCode(""); setModal(null);
      await loadLeagues();
      openLeague(lg);
    } catch (e) {
      console.error(e); setErr("No se pudo unir a la liga.");
    } finally {
      setWorking(false);
    }
  }

  async function shareCode(c) {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Únete a mi liga en RANK·UP", text: `Código: ${c}` });
      } else {
        await navigator.clipboard.writeText(c);
        setCopied(true); setTimeout(() => setCopied(false), 1600);
      }
    } catch (e) { /* el usuario canceló, sin problema */ }
  }

  // ── DETALLE DE UNA LIGA (leaderboard con 3 modos) ──
  if (selected) {
    const field = MODES.find((m) => m.key === mode).field;
    const sorted = [...board].sort((a, b) => (b[field] - a[field]) || (b.total_rr - a.total_rr));

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setSelected(null)} style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 10, padding: 8, color: S.text, display: "flex" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="disp" style={{ fontSize: 20, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.name}</div>
            <div className="disp" style={{ fontSize: 11, color: S.dim, letterSpacing: 1 }}>{board.length} {board.length === 1 ? "jugador" : "jugadores"}</div>
          </div>
        </div>

        {/* código para invitar */}
        <button onClick={() => shareCode(selected.invite_code)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(90deg, ${S.accent}18, ${S.panel})`, border: `1px dashed ${S.accent}66`,
          borderRadius: 13, padding: "13px 16px", marginBottom: 14,
        }}>
          <div style={{ textAlign: "left" }}>
            <div className="disp" style={{ fontSize: 10, color: S.dim, letterSpacing: 2, textTransform: "uppercase" }}>Código para invitar</div>
            <div className="mono" style={{ fontSize: 22, color: S.accent, letterSpacing: 3 }}>{selected.invite_code}</div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: S.accent, fontWeight: 700, fontSize: 13 }}>
            {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Compartir</>}
          </span>
        </button>

        {/* selector de ranking */}
        <div style={{ display: "flex", gap: 6, background: S.bg, borderRadius: 12, padding: 4, marginBottom: 16, border: `1px solid ${S.line}` }}>
          {MODES.map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)} className="disp" style={{
              flex: 1, border: "none", borderRadius: 9, padding: "9px", fontWeight: 700, fontSize: 13,
              background: mode === m.key ? S.panel2 : "transparent",
              color: mode === m.key ? S.accent : S.dim,
            }}>{m.label}</button>
          ))}
        </div>

        {boardLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40, color: S.dim }}><Loader2 className="spin" size={20} /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((m, i) => {
              const info = rankFromRR(m.total_rr);
              const isMe = m.user_id === userId;
              const medal = ["#FBD34D", "#C4CEDB", "#D0894A"][i];
              const value = m[field];
              return (
                <div key={m.user_id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: isMe ? `linear-gradient(90deg, ${S.accent}18, ${S.panel})` : S.panel,
                  border: `1px solid ${isMe ? S.accent + "66" : S.line}`, borderRadius: 13, padding: "10px 13px",
                }}>
                  <div style={{ width: 26, textAlign: "center", flexShrink: 0 }}>
                    {i === 0 ? <Crown size={20} color={medal} fill={medal} /> :
                      <span className="disp" style={{ fontSize: 16, fontWeight: 700, color: medal || S.dim }}>{i + 1}</span>}
                  </div>
                  <div style={{ flexShrink: 0 }}><RankBadge rankInfo={info} size={40} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: isMe ? S.accent : S.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.display_name || m.username}{isMe ? " (tú)" : ""}
                    </div>
                    <div className="disp" style={{ fontSize: 12, color: info.rank.glow }}>{info.label}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: 15, color: S.gold }}>{value}</div>
                    <div className="disp" style={{ fontSize: 9, color: S.dim, letterSpacing: 1, textTransform: "uppercase" }}>
                      {mode === "daily" ? "RR hoy" : mode === "weekly" ? "RR semana" : "RR total"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── LISTA DE MIS LIGAS ──
  return (
    <div>
      <div className="disp" style={{ fontSize: 13, letterSpacing: 2, color: S.text, textTransform: "uppercase", margin: "0 2px 12px" }}>Mis ligas</div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40, color: S.dim }}><Loader2 className="spin" size={20} /></div>
      ) : leagues.length === 0 ? (
        <div style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 16, padding: "34px 24px", textAlign: "center", marginBottom: 16 }}>
          <Users size={34} color={S.dim} style={{ marginBottom: 12 }} />
          <div className="disp" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Aún no tienes ligas</div>
          <div style={{ color: S.dim, fontSize: 14, lineHeight: 1.5 }}>Crea una y comparte el código con tus amigos, o únete a una con el código que te pasen.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {leagues.map((lg) => (
            <button key={lg.id} onClick={() => openLeague(lg)} style={{
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              background: S.panel, border: `1px solid ${S.line}`, borderRadius: 13, padding: "14px 15px",
            }}>
              <Trophy size={20} color={S.gold} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: S.text }}>{lg.name}</div>
                <div className="mono" style={{ fontSize: 11, color: S.dim, letterSpacing: 1 }}>{lg.invite_code}</div>
              </div>
              <ArrowLeft size={16} color={S.dim} style={{ transform: "rotate(180deg)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setModal("create"); setErr(""); }} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: `linear-gradient(90deg, ${S.accent}, #1fb6a0)`, border: "none", color: "#04120f",
          borderRadius: 12, padding: "13px", fontFamily: "'Chakra Petch'", fontWeight: 700, fontSize: 14,
        }}><Plus size={17} /> Crear liga</button>
        <button onClick={() => { setModal("join"); setErr(""); }} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "transparent", border: `1px solid ${S.line}`, color: S.text,
          borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14,
        }}><LogIn size={17} /> Unirme</button>
      </div>

      {/* MODAL crear/unirse */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "#030509cc", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: "18px 18px 0 0", padding: 20, width: "100%", maxWidth: 460, animation: "slideUp .25s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="disp" style={{ fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>{modal === "create" ? "Nueva liga" : "Unirme a una liga"}</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: S.dim }}><X size={20} /></button>
            </div>

            {modal === "create" ? (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la liga (ej: Los Cracks)" autoFocus
                onKeyDown={(e) => e.key === "Enter" && createLeague()}
                style={{ width: "100%", background: S.panel2, border: `1px solid ${S.line}`, borderRadius: 11, color: S.text, padding: "12px 15px", outline: "none", fontSize: 16, fontWeight: 600 }} />
            ) : (
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código (ej: A3F9K2)" autoFocus maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && joinLeague()}
                style={{ width: "100%", background: S.panel2, border: `1px solid ${S.line}`, borderRadius: 11, color: S.text, padding: "12px 15px", outline: "none", fontSize: 18, fontWeight: 700, letterSpacing: 3, textAlign: "center", fontFamily: "'Space Mono'" }} />
            )}

            {err && <div style={{ color: S.pink, fontSize: 13, marginTop: 10, fontWeight: 600 }}>{err}</div>}

            <button onClick={modal === "create" ? createLeague : joinLeague} disabled={working} style={{
              width: "100%", marginTop: 14, background: `linear-gradient(90deg, ${S.accent}, #1fb6a0)`, border: "none",
              color: "#04120f", borderRadius: 12, padding: "12px", fontFamily: "'Chakra Petch'", fontWeight: 700, fontSize: 15, letterSpacing: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: working ? 0.7 : 1,
            }}>
              {working && <Loader2 size={17} className="spin" />}
              {modal === "create" ? "Crear liga" : "Unirme"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
