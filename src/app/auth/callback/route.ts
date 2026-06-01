import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Endpoint al que Supabase redirige tras el click del magic link.
 * Recibe `?code=...`, lo intercambia por una sesión y planta las cookies.
 *
 * Vive fuera del route group (auth) porque no debe tener UI — es solo un
 * redirect handler. Si lo metiéramos en (auth)/auth/callback, heredaría
 * el layout y mostraría el shell brevemente antes del redirect (flash).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
