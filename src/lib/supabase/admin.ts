// Cliente admin de Supabase — usa la SERVICE ROLE KEY que ignora RLS.
//
// ⚠️ NUNCA importar desde un Client Component. La service role key da acceso
// total a la DB; si llega al bundle del cliente, queda expuesta en source maps.
// Este archivo solo debe importarse desde:
//   - API Routes (/api/...)
//   - Server Actions ("use server")
//   - Server Components que confíes (lectura admin)
//
// Lo usamos en el webhook de n8n porque ahí no hay sesión de usuario — el
// request viene de un sistema externo autenticado por header secret, y
// necesitamos escribir en tablas de OTROS usuarios (resolver phone → user_id
// → insertar idea en ideas/<user_id>).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let cached: SupabaseClient<Database> | null = null;

export function createSupabaseAdminClient() {
  if (cached) return cached;

  if (!serverEnv.supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Añade la key en .env.local (la encuentras en Supabase → Project Settings → API → service_role).",
    );
  }

  cached = createClient<Database>(env.supabase.url, serverEnv.supabaseServiceRoleKey, {
    auth: {
      // El admin client no necesita persistir sesión: cada request es stateless.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
