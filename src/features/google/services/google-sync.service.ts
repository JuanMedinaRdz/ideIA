// Sincronización idea → Google Calendar event. Idempotente: si la idea ya
// tiene google_calendar_event_id, hace PATCH; si no, POST y guarda el id.
//
// Diseño "fire and forget desde el llamador":
//   - Si el user NO tiene Google conectado → noop silencioso.
//   - Si falla la llamada a Google → log + return (no rompe la mutación de
//     la idea, que es más crítica que la sincronización).
//   - El llamador NUNCA debe `await` esto en el camino crítico de la API
//     response. Usar `Promise.allSettled` o pattern "background work" que
//     en Vercel se hace con `waitUntil`.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken } from "./google-tokens.service";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google/calendar";

/**
 * Sincroniza una idea con Google Calendar según su estado actual:
 *  - event_at presente + sin google_id → crear
 *  - event_at presente + con google_id → actualizar
 *  - event_at null + con google_id → borrar
 *  - event_at null + sin google_id → noop
 */
export async function syncIdeaToGoogle(ideaId: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  // 1) Leer la idea con su user_id
  const { data: idea } = await admin
    .from("ideas")
    .select(
      "id, user_id, title, summary, event_at, event_duration_minutes, google_calendar_event_id",
    )
    .eq("id", ideaId)
    .maybeSingle();

  if (!idea) return;

  // 2) Obtener access_token del user (refresh automático). Si no conectado → bail.
  const accessToken = await getValidAccessToken(idea.user_id);
  if (!accessToken) return;

  const hasEvent = idea.event_at !== null;
  const hasGoogleId = idea.google_calendar_event_id !== null;

  try {
    if (!hasEvent && !hasGoogleId) {
      // Nada que hacer
      return;
    }

    if (!hasEvent && hasGoogleId) {
      // Idea era evento, ya no → borrar de Google
      await deleteCalendarEvent(accessToken, idea.google_calendar_event_id!);
      await admin
        .from("ideas")
        .update({ google_calendar_event_id: null })
        .eq("id", ideaId);
      return;
    }

    // hasEvent === true a partir de aquí
    const startISO = idea.event_at!;
    const durationMin = idea.event_duration_minutes ?? 60;
    const endISO = new Date(
      new Date(startISO).getTime() + durationMin * 60_000,
    ).toISOString();

    if (hasGoogleId) {
      // Update
      await updateCalendarEvent(accessToken, idea.google_calendar_event_id!, {
        summary: idea.title,
        description: idea.summary || undefined,
        startISO,
        endISO,
      });
    } else {
      // Create
      const created = await createCalendarEvent(accessToken, {
        summary: idea.title,
        description: idea.summary || undefined,
        startISO,
        endISO,
      });
      await admin
        .from("ideas")
        .update({ google_calendar_event_id: created.id })
        .eq("id", ideaId);
    }
  } catch (e) {
    // Log silencioso en server. En el futuro podemos meter Sentry o tabla
    // sync_errors. Por ahora console.error es suficiente para Vercel logs.
    // eslint-disable-next-line no-console
    console.error(`[google-sync] ideaId=${ideaId}`, e);
  }
}
