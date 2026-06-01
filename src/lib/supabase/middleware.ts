// Refresca la sesión de Supabase en cada request y la mantiene viva entre Server
// Components. Se invoca desde middleware.ts en la raíz.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: nunca pongas lógica entre createServerClient y getUser.
  // getUser() revalida el token contra Supabase; quitarlo puede causar logouts aleatorios.
  await supabase.auth.getUser();

  return supabaseResponse;
}
