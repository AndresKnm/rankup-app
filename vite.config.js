import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true }, // permite abrirlo desde el celular en la misma red WiFi
});
