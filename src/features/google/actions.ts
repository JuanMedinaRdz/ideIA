"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserTokens, deleteTokens } from "./services/google-tokens.service";
import { revokeToken } from "@/lib/google/oauth";
import type { ActionResult } from "@/features/ideas/services/ideas.actions";

/**
 * Desconectar: revoca el token en Google (best effort) y borra de la DB.
 * Si el user vuelve a conectar después, Google le pide consent de nuevo
 * (gracias a `prompt=consent` en buildAuthUrl).
 */
export async function disconnectGoogleAction(): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sesión expirada." };

    const tokens = await getUserTokens(user.id);
    if (tokens) {
      // Revocar primero, luego borrar. Si revoke falla (red caída), borramos
      // igual — el token queda huérfano en Google pero pierde acceso a la DB.
      await revokeToken(tokens.refreshToken);
      await deleteTokens(user.id);
    }
    revalidatePath("/settings");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
