"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTutorial,
  updateTutorial,
  deleteTutorial,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
} from "./tutorials.service";
import type { ActionResult } from "@/features/ideas/services/ideas.actions";

export async function createTutorialAction(input: { title: string; description?: string }): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.title?.trim()) return { ok: false, error: "El título es obligatorio." };
    const t = await createTutorial({ title: input.title.trim(), description: input.description?.trim() });
    revalidatePath("/tutorials");
    return { ok: true, data: { id: t.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function createAndRedirectTutorialAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const t = await createTutorial({ title });
  revalidatePath("/tutorials");
  redirect(`/tutorials/${t.id}`);
}

export async function updateTutorialAction(
  id: string,
  input: Partial<{ title: string; description: string | null; category: string | null }>,
): Promise<ActionResult> {
  try {
    await updateTutorial(id, input);
    revalidatePath("/tutorials");
    revalidatePath(`/tutorials/${id}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function deleteTutorialAndRedirectAction(id: string): Promise<void> {
  await deleteTutorial(id);
  revalidatePath("/tutorials");
  redirect("/tutorials");
}

export async function createStepAction(tutorialId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const s = await createStep(tutorialId);
    revalidatePath(`/tutorials/${tutorialId}`);
    return { ok: true, data: { id: s.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function updateStepAction(
  id: string,
  tutorialId: string,
  input: Partial<{ title: string | null; description: string; imageUrl: string | null }>,
): Promise<ActionResult> {
  try {
    await updateStep(id, input);
    revalidatePath(`/tutorials/${tutorialId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function deleteStepAction(id: string, tutorialId: string): Promise<ActionResult> {
  try {
    await deleteStep(id);
    revalidatePath(`/tutorials/${tutorialId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function reorderStepsAction(tutorialId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await reorderSteps(tutorialId, orderedIds);
    revalidatePath(`/tutorials/${tutorialId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
