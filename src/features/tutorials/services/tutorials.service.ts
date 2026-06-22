// Tutorials CRUD. Server-only. RLS hace el filtrado por user automáticamente.
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tutorial, TutorialStep, TutorialWithSteps } from "@/features/tutorials/types/tutorial";

interface TutorialRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface StepRow {
  id: string;
  tutorial_id: string;
  position: number;
  title: string | null;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTutorial(r: TutorialRow): Tutorial {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    category: r.category ?? undefined,
    coverImageUrl: r.cover_image_url ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToStep(r: StepRow): TutorialStep {
  return {
    id: r.id,
    tutorialId: r.tutorial_id,
    position: r.position,
    title: r.title ?? undefined,
    description: r.description,
    imageUrl: r.image_url ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getTutorials(): Promise<Tutorial[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutorials")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTutorial);
}

export async function getTutorialById(id: string): Promise<TutorialWithSteps | null> {
  const supabase = await createSupabaseServerClient();
  const { data: tutorial, error: tutorialError } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (tutorialError) throw tutorialError;
  if (!tutorial) return null;

  const { data: steps, error: stepsError } = await supabase
    .from("tutorial_steps")
    .select("*")
    .eq("tutorial_id", id)
    .order("position", { ascending: true });
  if (stepsError) throw stepsError;

  return {
    ...rowToTutorial(tutorial),
    steps: (steps ?? []).map(rowToStep),
  };
}

export async function createTutorial(input: { title: string; description?: string }): Promise<Tutorial> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data, error } = await supabase
    .from("tutorials")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToTutorial(data);
}

export async function updateTutorial(
  id: string,
  input: Partial<{ title: string; description: string | null; category: string | null; coverImageUrl: string | null }>,
): Promise<Tutorial> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category;
  if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl;

  const { data, error } = await supabase
    .from("tutorials")
    .update(patch as Parameters<typeof supabase.from>[0] extends never ? never : never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToTutorial(data);
}

export async function deleteTutorial(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tutorials").delete().eq("id", id);
  if (error) throw error;
}

// --- Steps ---

export async function createStep(tutorialId: string): Promise<TutorialStep> {
  const supabase = await createSupabaseServerClient();
  // Position = max(position) + 1. Query separada porque Supabase no soporta
  // increment desde JS sin RPC. Race condition aceptable: si dos clicks
  // simultáneos crean misma position, no rompe nada (position no es unique).
  const { data: existing } = await supabase
    .from("tutorial_steps")
    .select("position")
    .eq("tutorial_id", tutorialId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("tutorial_steps")
    .insert({ tutorial_id: tutorialId, position: nextPos, description: "" })
    .select("*")
    .single();
  if (error) throw error;
  return rowToStep(data);
}

export async function updateStep(
  id: string,
  input: Partial<{ title: string | null; description: string; imageUrl: string | null; position: number }>,
): Promise<TutorialStep> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.position !== undefined) patch.position = input.position;

  const { data, error } = await supabase
    .from("tutorial_steps")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToStep(data);
}

export async function deleteStep(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("tutorial_steps").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Reordena steps en bulk. Recibe el array completo en el nuevo orden y
 * actualiza la columna position. Single round-trip (upsert).
 */
export async function reorderSteps(tutorialId: string, orderedIds: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // Construimos un patch por step y los upserteamos. Como solo cambiamos
  // position, no perdemos otros campos.
  const updates = orderedIds.map((id, index) => ({
    id,
    tutorial_id: tutorialId,
    position: index,
  }));
  const { error } = await supabase
    .from("tutorial_steps")
    .upsert(updates as never, { onConflict: "id" });
  if (error) throw error;
}
