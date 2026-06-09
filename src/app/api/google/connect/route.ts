import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/google/oauth";

/**
 * Inicia el flujo OAuth de Google Calendar.
 *
 * Genera un `state` random, lo guarda en cookie httpOnly (no accesible desde
 * JS) y redirige al usuario a la pantalla de consentimiento de Google.
 * El state previene CSRF: si alguien te engaña para visitar tu callback con
 * un code de un atacante, no tendrá la cookie matching y rechazamos.
 */
export async function GET(_request: NextRequest) {
  void _request;

  // Sesión obligatoria — solo usuarios logeados pueden conectar Google.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const state = randomBytes(32).toString("hex");
  const authUrl = buildAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });
  return response;
}
