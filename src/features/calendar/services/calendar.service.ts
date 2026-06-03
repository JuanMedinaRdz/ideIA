// Service de calendario. Lee ideas con event_at != null.
//
// Filtros por rango de fechas en el server — más eficiente que traer todo
// y filtrar en cliente. Usa el índice parcial `ideas_user_event_at_idx`
// definido en la migración 0005.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowToIdea, type Idea } from "@/features/ideas/types/idea";

/**
 * Devuelve las ideas con evento dentro del rango [from, to).
 * Útil para vista mensual: pasas el primer día del mes y el primer día del
 * siguiente. Por construcción incluye eventos que caen en cualquier punto
 * del intervalo (semi-abierto a la derecha).
 */
export async function getEventsInRange(from: Date, to: Date): Promise<Idea[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .not("event_at", "is", null)
    .gte("event_at", from.toISOString())
    .lt("event_at", to.toISOString())
    .order("event_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToIdea);
}

/**
 * Próximos N eventos a partir de ahora. Para el card "Próximos eventos"
 * del dashboard.
 */
export async function getUpcomingEvents(limit = 5): Promise<Idea[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .not("event_at", "is", null)
    .eq("event_completed", false)
    .gte("event_at", new Date().toISOString())
    .order("event_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(rowToIdea);
}

// Helpers de fecha viven en ../lib/date-helpers.ts (puros, sin server deps).
// Los re-exportamos por conveniencia si algún Server Component los necesita
// junto al service.
export { monthBounds, calendarGridDays } from "../lib/date-helpers";
