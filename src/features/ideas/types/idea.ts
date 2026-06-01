// Tipos del dominio "ideas".
//
// Mantenemos un tipo TS "limpio" (camelCase, ISO strings) separado del shape
// snake_case que Postgres devuelve. El service hace el mapping en un solo
// punto — los componentes nunca ven la forma de la DB. Esto te deja libertad
// para refactorizar columnas sin tocar la UI.
//
// En Fase 4/5, cuando el schema se estabilice, puedes generar tipos con:
//   pnpm dlx supabase gen types typescript --project-id <id> > src/types/database.ts
// y reemplazar `IdeaRow` por el tipo generado.

export type IdeaPriority = "low" | "medium" | "high" | "urgent";
export type IdeaStatus = "inbox" | "in_progress" | "done" | "archived";
export type IdeaSource = "whatsapp" | "web" | "voice" | "image";

export interface Idea {
  id: string;
  title: string;
  summary: string;
  description?: string;
  category: string;
  tags: string[];
  priority: IdeaPriority;
  status: IdeaStatus;
  source: IdeaSource;
  isFavorite: boolean;
  aiSuggestions: string[];
  createdAt: string;
  updatedAt: string;
}

/** Shape crudo devuelto por Supabase (snake_case). */
export interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  tags: string[];
  priority: IdeaPriority;
  status: IdeaStatus;
  source: IdeaSource;
  is_favorite: boolean;
  ai_suggestions: string[];
  created_at: string;
  updated_at: string;
}

export function rowToIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description ?? undefined,
    category: row.category,
    tags: row.tags,
    priority: row.priority,
    status: row.status,
    source: row.source,
    isFavorite: row.is_favorite,
    aiSuggestions: row.ai_suggestions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
