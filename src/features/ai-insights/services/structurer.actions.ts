"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { structureIdea, type StructuredIdea } from "./structurer.service";
import { getIdeaById, updateIdea } from "@/features/ideas/services/ideas.service";
import type { ActionResult } from "@/features/ideas/services/ideas.actions";

export async function structureIdeaAction(
  rawContent: string,
): Promise<ActionResult<StructuredIdea>> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sesión expirada." };

    const result = await structureIdea(rawContent, { userId: user.id });
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "EMPTY_INPUT") return { ok: false, error: "Escribe algo primero." };
    if (msg === "INPUT_TOO_LONG")
      return { ok: false, error: "El texto es demasiado largo (máx 4000 caracteres)." };
    return { ok: false, error: msg };
  }
}

/**
 * Re-estructura una idea ya existente que tenga `raw_content`. Útil para:
 *  - Mensajes que vinieron de WhatsApp con AI subóptima.
 *  - Mejorar la estructuración si cambias el prompt o el modelo.
 *
 * El usuario que llama debe ser dueño de la idea (RLS lo garantiza, pero
 * añadimos check explícito para fail-fast con mejor mensaje).
 */
export async function restructureIdeaAction(
  ideaId: string,
): Promise<ActionResult<StructuredIdea>> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sesión expirada." };

    const idea = await getIdeaById(ideaId);
    if (!idea) return { ok: false, error: "Idea no encontrada." };

    // raw_content es null si la idea se creó manualmente desde la web sin pasar
    // por IA. En ese caso no hay nada que re-estructurar.
    const source = idea.description || idea.summary || idea.title;
    if (!source.trim()) return { ok: false, error: "No hay contenido para estructurar." };

    const structured = await structureIdea(source, { userId: user.id, ideaId });
    await updateIdea(ideaId, {
      title: structured.title,
      summary: structured.summary,
      category: structured.category,
      tags: structured.tags,
      priority: structured.priority,
      aiSuggestions: structured.ai_suggestions,
    });

    revalidatePath("/dashboard");
    revalidatePath("/inbox");
    revalidatePath(`/ideas/${ideaId}`);
    return { ok: true, data: structured };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
