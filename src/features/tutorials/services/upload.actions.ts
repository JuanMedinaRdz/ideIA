"use server";

// Upload de imágenes de steps a Supabase Storage. Reusamos el bucket
// `idea-attachments` con path prefix `tutorials/{tutorial_id}/{step_id}-{ts}.{ext}`
// — cero setup extra para el usuario, bucket ya existe y es público.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { ActionResult } from "@/features/ideas/services/ideas.actions";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadStepImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sesión expirada." };

    const tutorialId = String(formData.get("tutorialId") ?? "");
    const stepId = String(formData.get("stepId") ?? "");
    const file = formData.get("file");

    if (!tutorialId || !stepId) return { ok: false, error: "tutorialId y stepId requeridos." };
    if (!(file instanceof File)) return { ok: false, error: "Archivo no válido." };
    if (file.size === 0) return { ok: false, error: "Archivo vacío." };
    if (file.size > MAX_BYTES) return { ok: false, error: "Máximo 5 MB." };
    if (!ALLOWED_TYPES.has(file.type)) {
      return { ok: false, error: "Solo JPG, PNG, WEBP o GIF." };
    }

    // Verifica que el tutorial es del user (RLS lo haría igualmente, pero
    // así fail-fast con mejor mensaje).
    const { data: tutorial } = await supabase
      .from("tutorials")
      .select("id")
      .eq("id", tutorialId)
      .maybeSingle();
    if (!tutorial) return { ok: false, error: "Tutorial no encontrado." };

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `tutorials/${tutorialId}/${stepId}-${Date.now()}.${ext}`;

    // Usamos admin client para evitar problemas de RLS de Storage. El check
    // de ownership ya lo hicimos arriba.
    const admin = createSupabaseAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("idea-attachments")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const url = `${env.supabase.url}/storage/v1/object/public/idea-attachments/${path}`;
    return { ok: true, data: { url } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
