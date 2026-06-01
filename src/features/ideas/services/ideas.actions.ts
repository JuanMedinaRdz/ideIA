"use server";

// Server Actions = endpoints tipados invocables desde el cliente sin escribir
// una API Route. Next.js los serializa como POST internamente.
//
// Devolvemos `{ ok, error }` en vez de throw porque los errores cruzando el
// boundary cliente/server son strings opacos — perdés el stack. Manejarlo
// explícitamente lleva a mejores mensajes para el usuario.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createIdea,
  deleteIdea,
  updateIdea,
  type CreateIdeaInput,
  type UpdateIdeaInput,
} from "./ideas.service";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createIdeaAction(
  input: CreateIdeaInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.title?.trim()) return { ok: false, error: "El título es obligatorio." };
    const idea = await createIdea(input);
    revalidatePath("/dashboard");
    revalidatePath("/inbox");
    return { ok: true, data: { id: idea.id } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    if (message === "UNAUTHORIZED") return { ok: false, error: "Sesión expirada." };
    return { ok: false, error: message };
  }
}

export async function updateIdeaAction(
  id: string,
  input: UpdateIdeaInput,
): Promise<ActionResult> {
  try {
    await updateIdea(id, input);
    revalidatePath("/dashboard");
    revalidatePath("/inbox");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function deleteIdeaAction(id: string): Promise<ActionResult> {
  try {
    await deleteIdea(id);
    revalidatePath("/dashboard");
    revalidatePath("/inbox");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

/** Borra la idea y redirige a /inbox. Usado desde la vista de detalle. */
export async function deleteIdeaAndRedirectAction(id: string): Promise<void> {
  await deleteIdea(id);
  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  redirect("/inbox");
}

export async function toggleFavoriteAction(
  id: string,
  isFavorite: boolean,
): Promise<ActionResult> {
  return updateIdeaAction(id, { isFavorite });
}
