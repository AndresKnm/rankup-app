# RANK·UP — Hábitos con sistema de rangos

App de seguimiento de hábitos gamificada: completas hábitos, ganas **RR (Rank Rating)**,
subes de rango (Hierro → Bronce → … → Leyenda) y compites con tus amigos en **ligas**
con leaderboard en vivo. Funciona en el navegador y se puede instalar en el celular (PWA).

Hecho con **React + Vite** y **Supabase** (login, base de datos y datos compartidos).

Desplegado en producción: https://rankup-app.vercel.app

---

## 1. Requisitos

- **Node.js 18 o superior** instalado en tu computador. Verifica con:
  ```bash
  node --version
  ```
  Si no lo tienes, descárgalo de https://nodejs.org (versión LTS).

## 2. Configurar tus credenciales de Supabase

1. Copia el archivo `.env.example` y renómbralo como `.env`
2. Ábrelo y pega tus datos (los encuentras en **Supabase → Project Settings → API**):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-public-key
   ```
   > Usa la clave **anon public**, NO la `service_role`.

## 3. Instalar y ejecutar

Abre una terminal **dentro de la carpeta del proyecto** y corre:

```bash
npm install     # instala las dependencias (solo la primera vez)
npm run dev     # arranca la app
```

Verás una dirección como `http://localhost:5173`. Ábrela en tu navegador. ✅

### Probarla en el celular (misma red WiFi)
Al correr `npm run dev` también aparece una URL de red (algo como `http://192.168.x.x:5173`).
Ábrela desde el navegador de tu teléfono. Para instalarla como app: menú del navegador →
**"Agregar a pantalla de inicio"**.

---

## 4. Cómo se juega

- **Marca tus hábitos** cada día → ganas RR.
- **Racha:** días seguidos cumpliendo. A los 3 días tus RR valen ×1.2, a los 7 ×1.5, a los 14 ×2.
- **Sube de rango** llenando la barra de cada división.
- **Ligas:** crea una, comparte el código de 6 caracteres con tus amigos y compitan en el ranking.

---

## 5. Estructura del proyecto

```
rankup-app/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          → cópialo como .env con tus credenciales
├── public/
│   ├── manifest.json     → configuración de la PWA
│   └── icon-192/512.png  → íconos de la app
└── src/
    ├── main.jsx          → punto de entrada
    ├── App.jsx           → sesión, navegación y cabecera
    ├── index.css         → estilos, fuentes y animaciones
    ├── lib/
    │   ├── game.js       → lógica de rangos, RR, rachas y fechas
    │   └── supabaseClient.js
    └── components/
        ├── Auth.jsx      → login / registro
        ├── HabitsView.jsx→ hábitos + rango + estadísticas
        ├── LeaguesView.jsx → ligas + leaderboard
        └── RankBadge.jsx → insignia de rango (SVG)
```

## 6. Publicarla en internet (opcional, cuando quieras)

La forma más fácil es **Vercel**: crea una cuenta, conecta el repositorio (o sube la carpeta),
agrega las mismas dos variables de entorno del `.env` en la configuración del proyecto, y listo.

---

## Notas técnicas

- El RR total se guarda en la tabla `profiles` y se actualiza al marcar/desmarcar hábitos.
- Al eliminar un hábito se marca como inactivo (`is_active = false`) para no perder tu historial.
- Las reglas de seguridad (RLS) ya están aplicadas: cada quien solo edita lo suyo; perfiles y
  ligas son visibles para usuarios con sesión (suficiente para jugar entre amigos).
