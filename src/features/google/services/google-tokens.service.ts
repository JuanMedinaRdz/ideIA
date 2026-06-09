// Acceso a tabla google_calendar_tokens. Server-only. Usa admin client porque
// el callback OAuth corre sin sesión activa cuando guarda los tokens (la
// session se establece a posteriori).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/google/oauth";

interface StoredTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
}

export async function getUserTokens(userId: string): Promise<StoredTokens | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    userId: data.user_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    scope: data.scope,
  };
}

export async function saveTokens(input: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  tokenType?: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();
  const { error } = await admin
    .from("google_calendar_tokens")
    .upsert({
      user_id: input.userId,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      expires_at: expiresAt,
      scope: input.scope,
      token_type: input.tokenType ?? "Bearer",
    });
  if (error) throw error;
}

export async function deleteTokens(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin.from("google_calendar_tokens").delete().eq("user_id", userId);
}

/**
 * Devuelve un access_token válido, refrescándolo automáticamente si está a
 * punto de expirar (margen 60s). Si falla el refresh, asumimos que el user
 * revocó manualmente desde Google → borramos la fila y devolvemos null.
 *
 * El llamador debe chequear null y comportarse como "no conectado".
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = await getUserTokens(userId);
  if (!tokens) return null;

  const expiresMs = new Date(tokens.expiresAt).getTime();
  const isExpiring = expiresMs - Date.now() < 60_000; // <1 min de vida

  if (!isExpiring) return tokens.accessToken;

  // Refresh
  try {
    const fresh = await refreshAccessToken(tokens.refreshToken);
    await saveTokens({
      userId,
      accessToken: fresh.access_token,
      refreshToken: tokens.refreshToken, // refresh_token no cambia en este flujo
      expiresIn: fresh.expires_in,
      scope: fresh.scope,
      tokenType: fresh.token_type,
    });
    return fresh.access_token;
  } catch {
    // Token revocado o cuenta deshabilitada → limpiar para que el user
    // reconecte si quiere.
    await deleteTokens(userId);
    return null;
  }
}

export async function isConnected(userId: string): Promise<boolean> {
  return (await getUserTokens(userId)) !== null;
}
