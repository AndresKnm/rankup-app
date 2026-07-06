# RANK·UP — Contexto del proyecto

App de seguimiento de hábitos **gamificada tipo shooter competitivo**: completas hábitos,
ganas **RR (Rank Rating)**, subes de rango (Hierro → … → Leyenda) y compites con amigos en
**ligas** con leaderboard en vivo. Todo en español.

## Comandos
- `npm install` — instala dependencias (solo la primera vez o si cambian)
- `npm run dev` — arranca el servidor de desarrollo (Vite). También expone una URL de red para probar en el celular.
- `npm run build` — compila para producción
- `npm run preview` — sirve el build localmente

## Stack
- **React 18 + Vite** (JavaScript, no TypeScript)
- **Supabase** para auth, base de datos y datos compartidos (`@supabase/supabase-js`)
- **lucide-react** para íconos
- **Sin Tailwind ni librerías de UI.** Los estilos se hacen con *inline styles* usando el objeto
  `THEME` que está en `src/lib/game.js`. Las fuentes, variables CSS y animaciones (@keyframes)
  viven en `src/index.css`.
- PWA básica (instalable): `public/manifest.json` + meta tags en `index.html`.

## Variables de entorno
En `.env` (no se sube a Git):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   (es una "publishable key" sb_publishable_..., pública, va en el cliente)
```

## Estructura
```
src/
├── main.jsx                → punto de entrada
├── App.jsx                 → sesión (Supabase Auth), navegación por pestañas (Hábitos/Ligas), cabecera con rango
├── index.css               → fuentes (Chakra Petch, Rajdhani, Space Mono), variables, animaciones
├── lib/
│   ├── game.js             → RANKS, rankFromRR(), streakMultiplier(), computeStreak(), DEFAULT_HABITS, helpers de fecha, THEME (colores)
│   └── supabaseClient.js   → cliente de Supabase
└── components/
    ├── Auth.jsx            → login / registro
    ├── HabitsView.jsx      → hábitos del día, rango, estadísticas, tira semanal, marcar/desmarcar
    ├── LeaguesView.jsx     → crear/unirse a ligas, leaderboard con 3 modos (Hoy/Semana/Total)
    └── RankBadge.jsx       → insignia de rango (SVG)
```

## Base de datos (Supabase / PostgreSQL)
Tablas en el esquema `public`:
- **profiles** (id → auth.users, username, display_name, avatar_emoji, total_rr) — perfil de cada usuario. Un trigger `handle_new_user` lo crea al registrarse.
- **habits** (id, user_id, name, emoji, xp, sort_order, is_active) — hábitos privados de cada usuario.
- **completions** (id, user_id, habit_id, completed_on, rr_earned) con `unique(habit_id, completed_on)` — un registro por hábito por día.
- **leagues** (id, name, invite_code, owner_id) — grupos de competencia. El `invite_code` se autogenera.
- **league_members** (league_id, user_id) — membresías.
- Vista **league_leaderboard** y función **league_rankings(p_league_id)** que devuelve, por miembro: `total_rr`, `daily_rr`, `weekly_rr`.
- **RLS activado** en todas las tablas: cada quien edita solo lo suyo; perfiles y ligas son legibles por usuarios autenticados. `league_rankings` es `security definer` y solo responde a miembros de la liga.

## Reglas del juego
- Cada hábito tiene un `xp` base. Al marcarlo hoy: `rr_earned = round(xp * multiplicador_de_racha)` y se suma a `profiles.total_rr`. Al desmarcar, se resta.
- **Rangos:** Hierro, Bronce, Plata, Oro, Platino, Diamante, Maestro, Leyenda. Cada uno tiene 3 divisiones (III → II → I) salvo Leyenda. **100 RR por división.** `rankFromRR()` traduce el RR total a rango.
- **Racha:** días consecutivos (terminando hoy o ayer) con ≥1 hábito cumplido. Multiplicador: 3 días → ×1.2, 7 → ×1.5, 14 → ×2 (`streakMultiplier()`).
- El **rango es individual** (progreso personal). La **liga es el grupo** donde se compite. Son cosas distintas.

## Convenciones y cosas a tener en cuenta
- **Estilos:** inline styles + `THEME` (de `game.js`). Layout con flex/grid inline. No introducir Tailwind.
- **Tipografías:** `Chakra Petch` (títulos y números grandes, clase `.disp`), `Rajdhani` (texto), `Space Mono` (cifras de RR, clase `.mono`).
- En `HabitsView` hay un guard con `useRef` (`didLoad`) para que React StrictMode no siembre los hábitos por defecto dos veces (bug que ya se corrigió).
- Al **eliminar un hábito** se hace *soft delete* (`is_active = false`) para no perder el historial de RR asociado.
- El `total_rr` se mantiene desde el cliente al marcar/desmarcar. (Mejora futura: moverlo a un trigger de Postgres para máxima robustez.)
- Los rankings de liga se obtienen con `supabase.rpc("league_rankings", { p_league_id })`.

## Estado actual
Funcionando: registro/login, 20 hábitos por defecto, rango + RR + rachas, tira de últimos 7 días,
ligas con código de invitación, leaderboard con modos Hoy/Semana/Total, PWA instalable.

## Próximos pasos / ideas
- Desplegar en **Vercel** (agregar las 2 variables de entorno en el proyecto).
- Rachas por hábito individual (racha actual y racha más larga).
- Notificaciones / recordatorios.
- Temporadas que reinician el ranking cada cierto tiempo.
- Misiones o retos semanales.

## Idioma
Todo el texto de la interfaz y los mensajes van **en español**.
