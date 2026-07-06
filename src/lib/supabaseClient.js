import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "⚠️ Faltan las variables de Supabase.\n" +
    "Copia el archivo .env.example como .env y pega tu URL y tu anon key."
  );
}

export const supabase = createClient(url, key);
