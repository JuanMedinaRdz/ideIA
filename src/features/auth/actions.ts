"use server";

// Auth con código OTP de 6 dígitos (passwordless).
//
// Por qué OTP code y no magic link:
//   - Magic link con PKCE requiere que el navegador que pide y el que abre
//     el email sean el mismo. Si Outlook abre Edge y el user estaba en Chrome,
//     falla con "PKCE code verifier not found".
//   - OTP code: el usuario escribe el código en la MISMA pestaña donde lo pidió.
//     Funciona en cualquier combinación de cliente de email/navegador.
//   - Más fricción mínima (1 paso extra), pero 100% bulletproof.
//
// NOTA SUPABASE: para que el email contenga el código de 6 dígitos, el
// template "Magic Link" debe incluir `{{ .Token }}`. Ver README.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true } | { ok: false; error: string };

function normalizeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
  return v;
}

export async function requestEmailOtp(email: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, error: "Email no válido." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { shouldCreateUser: true },
    // Sin emailRedirectTo → Supabase usa el template "Magic Link" que el
    // user debe haber editado para mostrar {{ .Token }}.
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function verifyEmailOtp(email: string, token: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, error: "Email no válido." };

  const cleanToken = token.replace(/\s/g, "");
  // Supabase permite configurar la longitud del OTP (6-10 dígitos, default
  // varía según versión del proyecto). Aceptamos cualquier longitud válida.
  if (!/^\d{6,10}$/.test(cleanToken)) {
    return { ok: false, error: "El código debe tener entre 6 y 10 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: cleanToken,
    type: "email",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
