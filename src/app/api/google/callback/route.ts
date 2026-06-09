import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { saveTokens } from "@/features/google/services/google-tokens.service";

/**
 * Callback de Google OAuth.
 *
 * Google nos redirige aquí con:
 *   ?code=...&state=...&scope=...     (éxito)
 *   ?error=access_denied&state=...    (user canceló)
 *
 * Validaciones:
 *   - Sesión activa (sin esto no sabemos a quién asignar los tokens).
 *   - state cookie === state query (anti-CSRF).
 *   - Sin error y con code.
 *
 * Tras éxito: guarda tokens y redirige a /settings con flag de éxito.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings?google=denied`, request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/settings?google=invalid`, request.url),
    );
  }

  const stateCookie = request.cookies.get("google_oauth_state")?.value;
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(
      new URL(`/settings?google=csrf`, request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    // refresh_token solo viene con prompt=consent + access_type=offline.
    // Si no viene (no debería pasar con nuestra config, pero defensa):
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(`/settings?google=no_refresh`, request.url),
      );
    }
    await saveTokens({
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    const response = NextResponse.redirect(
      new URL(`/settings?google=connected`, request.url),
    );
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[google-oauth-callback]", e);
    return NextResponse.redirect(
      new URL(`/settings?google=error`, request.url),
    );
  }
}
