// Supabase client for Server Components, Server Actions y Route Handlers.
// Lee/escribe la sesión vía cookies de Next.js (no usar en Client Components).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: setAll no está permitido aquí.
          // Lo ignoramos: el middleware refrescará la sesión más adelante.
        }
      },
    },
  });
}
