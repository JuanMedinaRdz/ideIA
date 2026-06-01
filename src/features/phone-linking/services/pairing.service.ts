// Servicio de pairing. Solo server-only.
//
// Usamos el admin client para INSERT en pairing_codes (no hay policy de
// insert para usuarios) — esto previene que un atacante con sesión cree
// códigos para otros user_id. La sesión la verificamos antes de llamar
// con `getUser()` en el Server Action.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PAIRING_TTL_MS = 10 * 60 * 1000; // 10 min

/**
 * Genera un código numérico de 6 dígitos. Usamos crypto.getRandomValues para
 * que no sea adivinable. Reintentamos si hay colisión (extremadamente raro
 * con un espacio de 1M y ventana de 10 min, pero por completitud).
 */
function generate6DigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function createPairingCode(userId: string): Promise<{
  code: string;
  expiresAt: string;
}> {
  const admin = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();

  // Limpieza preventiva: borra códigos previos del mismo user para no
  // acumular y para que el último siempre sea el válido.
  await admin.from("pairing_codes").delete().eq("user_id", userId);

  // Hasta 5 intentos en caso de colisión.
  for (let i = 0; i < 5; i++) {
    const code = generate6DigitCode();
    const { error } = await admin.from("pairing_codes").insert({
      code,
      user_id: userId,
      expires_at: expiresAt,
    });
    if (!error) return { code, expiresAt };
    if (error.code !== "23505") throw error; // no era colisión
  }
  throw new Error("PAIRING_CODE_GENERATION_FAILED");
}

export async function getActivePairingCode(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("pairing_codes")
    .select("code, expires_at")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data;
}

export async function getLinkedPhones(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_phone_links")
    .select("id, phone_e164, label, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function unlinkPhone(userId: string, linkId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("user_phone_links")
    .delete()
    .eq("id", linkId)
    .eq("user_id", userId); // doble check defensivo
  if (error) throw error;
}
