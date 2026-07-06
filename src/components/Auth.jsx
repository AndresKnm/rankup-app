import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Zap, Loader2 } from "lucide-react";
import { THEME as S } from "../lib/game";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setInfo("");
    if (!email || !password) { setError("Escribe tu correo y contraseña."); return; }
    if (mode === "signup" && !username.trim()) { setError("Elige un nombre de usuario."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username.trim(), display_name: username.trim() } },
        });
        if (error) throw error;
        setInfo("¡Listo! Si tu proyecto pide confirmar correo, revisa tu bandeja. Si no, ya puedes entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError(traducir(e.message));
    } finally {
      setLoading(false);
    }
  };

  const field = {
    width: "100%", background: S.panel2, border: `1px solid ${S.line}`, borderRadius: 12,
    color: S.text, padding: "13px 15px", outline: "none", fontSize: 16, fontWeight: 600, marginBottom: 11,
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, animation: "slideUp .5s ease-out" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 10,
          }}>
            <Zap size={26} color={S.accent} fill={S.accent} />
            <span className="disp" style={{ fontSize: 34, fontWeight: 700, letterSpacing: 1, color: S.text }}>
              RANK<span style={{ color: S.accent }}>·</span>UP
            </span>
          </div>
          <div className="disp" style={{ color: S.dim, fontSize: 14, letterSpacing: 2, textTransform: "uppercase" }}>
            Sube de rango con tus hábitos
          </div>
        </div>

        <div style={{ background: S.panel, border: `1px solid ${S.line}`, borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", gap: 6, background: S.bg, borderRadius: 11, padding: 4, marginBottom: 18 }}>
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }}
                style={{
                  flex: 1, border: "none", borderRadius: 8, padding: "9px",
                  background: mode === m ? S.panel2 : "transparent",
                  color: mode === m ? S.accent : S.dim, fontWeight: 700, fontSize: 14,
                }} className="disp">
                {m === "login" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <input style={field} placeholder="Nombre de usuario" value={username}
              onChange={(e) => setUsername(e.target.value)} maxLength={20} />
          )}
          <input style={field} type="email" placeholder="Correo" value={email}
            autoCapitalize="none" onChange={(e) => setEmail(e.target.value)} />
          <input style={field} type="password" placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} />

          {error && <div style={{ color: S.pink, fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
          {info && <div style={{ color: S.accent, fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{info}</div>}

          <button onClick={submit} disabled={loading} style={{
            width: "100%", border: "none", borderRadius: 12, padding: "13px",
            background: `linear-gradient(90deg, ${S.accent}, #1fb6a0)`, color: "#04120f",
            fontFamily: "'Chakra Petch'", fontWeight: 700, fontSize: 16, letterSpacing: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading && <Loader2 size={18} className="spin" />}
            {mode === "login" ? "Entrar" : "Crear mi cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function traducir(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered")) return "Ese correo ya tiene una cuenta.";
  if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("unable to validate email")) return "El correo no parece válido.";
  return msg;
}
