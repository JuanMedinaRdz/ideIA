// Google OAuth 2.0 con fetch puro — sin SDK pesado. Demuestra que entender
// el protocolo HTTP es suficiente. La doc oficial:
// https://developers.google.com/identity/protocols/oauth2/web-server
//
// El flujo "Authorization Code with refresh token":
//   1. App redirige a Google con scope + redirect_uri + state.
//   2. User da consent en Google.
//   3. Google redirige a redirect_uri con ?code=...&state=...
//   4. App intercambia code por { access_token, refresh_token, expires_in }.
//   5. access_token (1h) se usa en cada call. Cuando expira, app usa
//      refresh_token (no expira salvo revocación) para obtener uno nuevo.

import { env, serverEnv } from "@/lib/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

/** Scope mínimo para crear/editar/borrar eventos del calendario primario. */
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function redirectUri(): string {
  return `${env.app.url}/api/google/callback`;
}

function requireClientCreds(): { id: string; secret: string } {
  if (!serverEnv.googleOAuthClientId || !serverEnv.googleOAuthClientSecret) {
    throw new Error(
      "Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET en .env.local.",
    );
  }
  return { id: serverEnv.googleOAuthClientId, secret: serverEnv.googleOAuthClientSecret };
}

/**
 * Construye la URL a la que redirigimos al usuario para iniciar OAuth.
 *
 * Decisiones críticas:
 *   - access_type=offline → Google nos da refresh_token (sin esto solo
 *     conseguimos access_token que expira en 1h y obliga a re-consent).
 *   - prompt=consent → fuerza el modal de Google AUNQUE el user ya haya dado
 *     permiso antes. Sin esto, el primer flujo nos da refresh_token, pero
 *     reconexiones (revocar y volver a conectar) NO te devolverían uno nuevo.
 *   - state → token random para CSRF. Lo verificamos en el callback.
 */
export function buildAuthUrl(state: string): string {
  const { id } = requireClientCreds();
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
    include_granted_scopes: "true",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  /** Solo viene en el primer intercambio con prompt=consent y access_type=offline. */
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/** Intercambia el `code` recibido en el callback por tokens. */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { id, secret } = requireClientCreds();
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

/** Renueva el access_token usando el refresh_token guardado. */
export async function refreshAccessToken(refreshToken: string): Promise<
  Omit<GoogleTokenResponse, "refresh_token">
> {
  const { id, secret } = requireClientCreds();
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }
  return (await res.json()) as Omit<GoogleTokenResponse, "refresh_token">;
}

/**
 * Revoca el access_token (Google invalida ambos: access y refresh asociado).
 * Llamado al desconectar — best effort, ignoramos errores de red.
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
  } catch {
    // Si Google está caído, no bloquear el desconectar. La fila ya se borrará
    // de la DB y nuestros llamados subsecuentes fallarán graciosamente.
  }
}
