// Service de búsqueda. Aprovecha los índices GIN trigram que creamos en la
// migración 0001 (`ideas_title_trgm_idx` y `ideas_summary_trgm_idx`).
//
// Usamos `.or()` con `ilike` — Postgres reconoce automáticamente el trigram
// para queries con %palabra%. No tipeamos "%" — eso es vulnerable a SQL
// injection en backends raw, pero el cliente Supabase los escapa.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  rowToIdea,
  type Idea,
  type IdeaPriority,
  type IdeaStatus,
} from "@/features/ideas/types/idea";

export interface SearchFilters {
  query?: string;
  status?: IdeaStatus | "all";
  priority?: IdeaPriority | "all";
  favoritesOnly?: boolean;
}

export async function searchIdeas(filters: SearchFilters): Promise<Idea[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("ideas").select("*").order("created_at", { ascending: false });

  if (filters.query?.trim()) {
    // Escape de caracteres especiales de Postgres LIKE (% y _).
    const escaped = filters.query.trim().replace(/[%_]/g, (c) => `\\${c}`);
    const pattern = `%${escaped}%`;
    // .or() requiere sintaxis PostgREST: "col1.ilike.value,col2.ilike.value"
    q = q.or(
      `title.ilike.${pattern},summary.ilike.${pattern},description.ilike.${pattern}`,
    );
  }
  if (filters.status && filters.status !== "all") {
    q = q.eq("status", filters.status);
  }
  if (filters.priority && filters.priority !== "all") {
    q = q.eq("priority", filters.priority);
  }
  if (filters.favoritesOnly) {
    q = q.eq("is_favorite", true);
  }

  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToIdea);
}
