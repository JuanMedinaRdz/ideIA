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
  attachmentUrl?: string;
  attachmentType?: string;
  /** ISO 8601 timestamp con TZ. null si la idea no es un evento agendado. */
  eventAt?: string;
  eventDurationMinutes?: number;
  eventCompleted: boolean;
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
  attachment_url: string | null;
  attachment_type: string | null;
  event_at: string | null;
  event_duration_minutes: number | null;
  event_completed: boolean;
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
    attachmentUrl: row.attachment_url ?? undefined,
    attachmentType: row.attachment_type ?? undefined,
    eventAt: row.event_at ?? undefined,
    eventDurationMinutes: row.event_duration_minutes ?? undefined,
    eventCompleted: row.event_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
