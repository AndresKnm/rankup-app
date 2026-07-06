import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { Zap, Trophy, LogOut, Loader2 } from "lucide-react";
import { THEME as S, rankFromRR } from "./lib/game";
import Auth from "./components/Auth";
import HabitsView from "./components/HabitsView";
import LeaguesView from "./components/LeaguesView";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("habits");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    loadProfile();
    // eslint-disable-next-line
  }, [session]);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles").select("id,username,display_name,avatar_emoji,total_rr")
      .eq("id", session.user.id).maybeSingle();
    setProfile(data);
  }

  const setTotalRR = (v) => setProfile((p) => (p ? { ...p, total_rr: v } : p));

  // pantallas de carga / login
  if (session === undefined) {
    return <Centered><Loader2 className="spin" size={22} color={S.accent} /></Centered>;
  }
  if (!session) return <Auth />;
  if (!profile) {
    return <Centered><Loader2 className="spin" size={22} color={S.accent} /></Centered>;
  }

  const info = rankFromRR(profile.total_rr);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* CABECERA */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: `${S.bg}ee`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${S.line}`,
      }}>
        <div style={{ maxWidth: 460, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={20} color={S.accent} fill={S.accent} />
            <span className="disp" style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>
              RANK<span style={{ color: S.accent }}>·</span>UP
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div className="disp" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{profile.display_name || profile.username}</div>
              <div className="disp" style={{ fontSize: 11, color: info.rank.glow, lineHeight: 1.4 }}>{info.label}</div>
            </div>
            <button onClick={() => supabase.auth.signOut()} title="Salir"
              style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 9, padding: 8, color: S.dim, display: "flex" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main style={{ flex: 1, width: "100%", maxWidth: 460, margin: "0 auto", padding: "16px 16px 92px" }}>
        {tab === "habits"
          ? <HabitsView userId={profile.id} totalRR={profile.total_rr} setTotalRR={setTotalRR} />
          : <LeaguesView userId={profile.id} />}
      </main>

      {/* BARRA INFERIOR */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        background: `${S.panel}f2`, backdropFilter: "blur(10px)", borderTop: `1px solid ${S.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{ maxWidth: 460, margin: "0 auto", display: "flex" }}>
          <TabButton active={tab === "habits"} onClick={() => setTab("habits")} icon={<Zap size={22} />} label="Hábitos" />
          <TabButton active={tab === "leagues"} onClick={() => setTab("leagues")} icon={<Trophy size={22} />} label="Ligas" />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      background: "transparent", border: "none", padding: "11px 0 13px",
      color: active ? S.accent : S.dim,
    }}>
      {icon}
      <span className="disp" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
    </button>
  );
}

function Centered({ children }) {
  return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}
