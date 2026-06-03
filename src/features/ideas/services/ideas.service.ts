// Capa de acceso a datos para "ideas". Solo se usa desde el servidor (Server
// Components, Server Actions, Route Handlers).
//
// Patrón:
//   - getXxx: lecturas. Pueden cachearse con `revalidateTag` en el futuro.
//   - upsertXxx / deleteXxx: escrituras. Llamadas desde Server Actions.
//   - Todo método devuelve el dominio (`Idea`), nunca el row crudo.
//   - RLS en Postgres se encarga del filtrado por user_id, no lo replicamos
//     aquí. Si añades un .eq("user_id", userId) "por si acaso", duplicas
//     lógica que ya está en la DB.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  rowToIdea,
  type Idea,
  type IdeaPriority,
  type IdeaSource,
  type IdeaStatus,
} from "@/features/ideas/types/idea";
import type { Database } from "@/types/database";

type IdeaUpdate = Database["public"]["Tables"]["ideas"]["Update"];

export interface CreateIdeaInput {
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  tags?: string[];
  priority?: IdeaPriority;
  status?: IdeaStatus;
  source?: IdeaSource;
  aiSuggestions?: string[];
  eventAt?: string | null;
  eventDurationMinutes?: number | null;
}

export interface UpdateIdeaInput extends Partial<CreateIdeaInput> {
  isFavorite?: boolean;
  eventCompleted?: boolean;
}

export async function getIdeas(): Promise<Idea[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToIdea);
}

export async function getIdeaById(id: string): Promise<Idea | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToIdea(data) : null;
}

export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: input.title,
      summary: input.summary ?? "",
      description: input.description ?? null,
      category: input.category ?? "General",
      tags: input.tags ?? [],
      priority: input.priority ?? "medium",
      status: input.status ?? "inbox",
      source: input.source ?? "web",
      ai_suggestions: input.aiSuggestions ?? [],
      event_at: input.eventAt ?? null,
      event_duration_minutes: input.eventDurationMinutes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToIdea(data);
}

export async function updateIdea(id: string, input: UpdateIdeaInput): Promise<Idea> {
  const supabase = await createSupabaseServerClient();

  // Construimos el patch solo con campos definidos. Pasar `undefined` a Supabase
  // sobreescribe con null — bug clásico que rompe filas.
  const patch: IdeaUpdate = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.status !== undefined) patch.status = input.status;
  if (input.source !== undefined) patch.source = input.source;
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;
  if (input.aiSuggestions !== undefined) patch.ai_suggestions = input.aiSuggestions;
  if (input.eventAt !== undefined) patch.event_at = input.eventAt;
  if (input.eventDurationMinutes !== undefined) patch.event_duration_minutes = input.eventDurationMinutes;
  if (input.eventCompleted !== undefined) patch.event_completed = input.eventCompleted;

  const { data, error } = await supabase
    .from("ideas")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return rowToIdea(data);
}

export async function deleteIdea(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) throw error;
}

export interface IdeaStats {
  total: number;
  inbox: number;
  urgent: number;
  done: number;
  newToday: number;
}

export async function getIdeaStats(): Promise<IdeaStats> {
  // Una sola query trae lo necesario para las 4 métricas — más barato que
  // 4 counts separados. Filtramos en memoria (son pocas filas por usuario).
  const ideas = await getIdeas();
  const since = Date.now() - 24 * 3_600_000;
  return {
    total: ideas.length,
    inbox: ideas.filter((i) => i.status === "inbox").length,
    urgent: ideas.filter((i) => i.priority === "urgent").length,
    done: ideas.filter((i) => i.status === "done").length,
    newToday: ideas.filter((i) => new Date(i.createdAt).getTime() > since).length,
  };
}
