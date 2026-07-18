import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://tu-proyecto.supabase.co') {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error al inicializar el cliente de Supabase:', error);
  }
} else {
  console.warn(
    'Supabase no configurado o usando valores de ejemplo. La aplicación funcionará en modo Local (sin sincronización en tiempo real).'
  );
}

export const supabase = supabaseInstance;
