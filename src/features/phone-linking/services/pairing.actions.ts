"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createPairingCode,
  unlinkPhone,
} from "./pairing.service";
import type { ActionResult } from "@/features/ideas/services/ideas.actions";

async function requireUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.id;
}

export async function generatePairingCodeAction(): Promise<
  ActionResult<{ code: string; expiresAt: string }>
> {
  try {
    const userId = await requireUserId();
    const result = await createPairingCode(userId);
    revalidatePath("/settings");
    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return { ok: false, error: msg === "UNAUTHORIZED" ? "Sesión expirada." : msg };
  }
}

export async function unlinkPhoneAction(linkId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await unlinkPhone(userId, linkId);
    revalidatePath("/settings");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
