import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSecret } from "@/lib/webhook-auth";
import { structureIdea } from "@/features/ai-insights/services/structurer.service";
import type { IdeaPriority, IdeaSource, IdeaStatus } from "@/features/ideas/types/idea";

/**
 * Webhook que recibe ideas estructuradas desde n8n.
 *
 * Flujo upstream (en n8n):
 *   WhatsApp Trigger → Whisper (si audio) → OpenAI (Fase 5) → POST aquí
 *
 * Contrato del payload:
 * ```
 * {
 *   "phone_number": "+34612345678",     // E.164, obligatorio
 *   "title": "Refactor del onboarding",  // obligatorio
 *   "summary": "Los usuarios abandonan…", // opcional
 *   "description": "Texto largo opcional",
 *   "category": "Producto",
 *   "tags": ["ux", "retention"],
 *   "priority": "high",                  // low | medium | high | urgent
 *   "source": "whatsapp",                // whatsapp | voice | image | web
 *   "ai_suggestions": ["..."]
 * }
 * ```
 *
 * Decisiones:
 *  - Auth por header `x-webhook-secret` con compare constant-time.
 *  - Usa service-role: el webhook es server-to-server, no hay sesión humana.
 *  - Resuelve `phone_number` → `user_id` vía `user_phone_links`. Si el número
 *    no está vinculado: 404 + evento en `ingest_events` para que el usuario
 *    sepa que llegó pero no se pudo asignar.
 *  - Loguea TODO en `ingest_events`: éxitos, no autorizados, payloads malos.
 *    Append-only, sirve como auditoría y debugging.
 *  - Si el payload trae `pairing_code` en vez de los campos de idea, lo
 *    interpretamos como un mensaje de emparejamiento.
 */

export const runtime = "nodejs";

interface StructuredIdeaPayload {
  phone_number: string;
  title: string;
  summary?: string;
  description?: string;
  category?: string;
  tags?: string[];
  priority?: IdeaPriority;
  source?: IdeaSource;
  status?: IdeaStatus;
  ai_suggestions?: string[];
}

interface RawIdeaPayload {
  phone_number: string;
  /** Texto crudo del mensaje. La IA lo estructura. */
  raw_content: string;
  source?: IdeaSource;
}

interface PairingPayload {
  phone_number: string;
  pairing_code: string;
}

type Payload = StructuredIdeaPayload | RawIdeaPayload | PairingPayload;

function isPairing(p: Partial<PairingPayload>): p is PairingPayload {
  return typeof p.pairing_code === "string" && p.pairing_code.length === 6;
}

function isStructuredIdea(p: Partial<StructuredIdeaPayload>): p is StructuredIdeaPayload {
  return typeof p.title === "string" && p.title.trim().length > 0;
}

function isRawIdea(p: Partial<RawIdeaPayload>): p is RawIdeaPayload {
  return typeof p.raw_content === "string" && p.raw_content.trim().length > 0;
}

function normalizePhone(raw: string): string | null {
  // Acepta '+34 612 345 678', '34612345678', '+34612345678'.
  // Normaliza a E.164: '+' + dígitos.
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  let e164 = digits.startsWith("+") ? digits : `+${digits}`;

  // QUIRK MÉXICO: WhatsApp Cloud API añade un "1" después del país (52) para
  // móviles mexicanos, herencia de cuando WA distinguía móvil/fijo. El número
  // REAL (en SIM, perfil WhatsApp, contactos) NO tiene ese "1".
  // Canonicalizamos quitando el "1": +5218442891397 → +528442891397.
  if (/^\+521\d{10}$/.test(e164)) {
    e164 = `+52${e164.slice(4)}`;
  }

  // QUIRK ARGENTINA: similar — WhatsApp añade "9" después de +54 para móviles.
  // +5491165432109 → +541165432109
  if (/^\+549\d{10}$/.test(e164)) {
    e164 = `+54${e164.slice(4)}`;
  }

  // Validación mínima: + seguido de 8-15 dígitos (estándar E.164).
  if (!/^\+\d{8,15}$/.test(e164)) return null;
  return e164;
}

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();

  // 1) Autenticación
  if (!verifyWebhookSecret(request)) {
    await admin.from("ingest_events").insert({
      status: "unauthorized",
      error_message: "Bad or missing x-webhook-secret",
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Parseo y validación mínima
  let body: Partial<Payload>;
  try {
    body = (await request.json()) as Partial<Payload>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = body.phone_number ? normalizePhone(body.phone_number) : null;
  if (!phone) {
    await admin.from("ingest_events").insert({
      status: "invalid_payload",
      payload: body as never,
      error_message: "Missing or invalid phone_number",
    });
    return NextResponse.json({ error: "invalid_phone_number" }, { status: 400 });
  }

  // 3) Rama: emparejamiento
  if (isPairing(body)) {
    return handlePairing(phone, body.pairing_code);
  }

  // 4) Rama: nueva idea — debe ser raw_content (texto crudo) o estructurada.
  if (!isStructuredIdea(body) && !isRawIdea(body)) {
    await admin.from("ingest_events").insert({
      status: "invalid_payload",
      phone_e164: phone,
      payload: body as never,
      error_message:
        "Payload necesita 'title' (estructurado) o 'raw_content' (para estructurar con IA) o 'pairing_code'",
    });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // 5) Resolver user_id por phone
  const { data: link } = await admin
    .from("user_phone_links")
    .select("user_id")
    .eq("phone_e164", phone)
    .maybeSingle();

  if (!link) {
    await admin.from("ingest_events").insert({
      status: "unknown_phone",
      phone_e164: phone,
      payload: body as never,
      error_message: "Número no vinculado a ningún usuario",
    });
    return NextResponse.json(
      { error: "phone_not_linked", hint: "El usuario debe enlazar este número desde /settings" },
      { status: 404 },
    );
  }

  // 6) Si llega raw_content, estructurar con IA. Si llega ya estructurado,
  //    respetar lo que mande el cliente (n8n puede hacer su propio prompting).
  let structured: {
    title: string;
    summary: string;
    description: string | null;
    category: string;
    tags: string[];
    priority: IdeaPriority;
    ai_suggestions: string[];
    raw_content: string | null;
  };

  if (isStructuredIdea(body)) {
    structured = {
      title: body.title.trim().slice(0, 200),
      summary: (body.summary ?? "").slice(0, 800),
      description: body.description ?? null,
      category: body.category ?? "General",
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : [],
      priority: body.priority ?? "medium",
      ai_suggestions: Array.isArray(body.ai_suggestions)
        ? body.ai_suggestions.slice(0, 10)
        : [],
      raw_content: null,
    };
  } else {
    // isRawIdea: estructurar con OpenAI
    try {
      const ai = await structureIdea(body.raw_content, { userId: link.user_id });
      structured = {
        title: ai.title,
        summary: ai.summary,
        description: null,
        category: ai.category,
        tags: ai.tags,
        priority: ai.priority,
        ai_suggestions: ai.ai_suggestions,
        raw_content: body.raw_content.slice(0, 4000),
      };
    } catch (e) {
      await admin.from("ingest_events").insert({
        status: "error",
        phone_e164: phone,
        user_id: link.user_id,
        payload: body as never,
        error_message: `AI structuring failed: ${e instanceof Error ? e.message : String(e)}`,
      });
      return NextResponse.json({ error: "ai_structuring_failed" }, { status: 502 });
    }
  }

  const { data: idea, error: insertError } = await admin
    .from("ideas")
    .insert({
      user_id: link.user_id,
      title: structured.title,
      summary: structured.summary,
      description: structured.description,
      category: structured.category,
      tags: structured.tags,
      priority: structured.priority,
      status: "inbox",
      source: body.source ?? "whatsapp",
      ai_suggestions: structured.ai_suggestions,
      raw_content: structured.raw_content,
    })
    .select("id")
    .single();

  if (insertError) {
    await admin.from("ingest_events").insert({
      status: "error",
      phone_e164: phone,
      user_id: link.user_id,
      payload: body as never,
      error_message: insertError.message,
    });
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  await admin.from("ingest_events").insert({
    status: "ok",
    phone_e164: phone,
    user_id: link.user_id,
    idea_id: idea.id,
    payload: body as never,
  });

  return NextResponse.json({ ok: true, idea_id: idea.id }, { status: 201 });
}

async function handlePairing(phone: string, code: string) {
  const admin = createSupabaseAdminClient();

  const { data: pairing } = await admin
    .from("pairing_codes")
    .select("user_id, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!pairing) {
    await admin.from("ingest_events").insert({
      status: "invalid_payload",
      phone_e164: phone,
      error_message: "Pairing code no encontrado",
    });
    return NextResponse.json({ error: "code_not_found" }, { status: 404 });
  }

  if (new Date(pairing.expires_at as string).getTime() < Date.now()) {
    await admin.from("pairing_codes").delete().eq("code", code);
    return NextResponse.json({ error: "code_expired" }, { status: 410 });
  }

  // Crear el link. Si el phone ya existe (unique), Postgres falla — devolvemos 409.
  const { error: linkError } = await admin.from("user_phone_links").insert({
    user_id: pairing.user_id,
    phone_e164: phone,
  });

  if (linkError) {
    // 23505 = unique_violation
    if (linkError.code === "23505") {
      return NextResponse.json({ error: "phone_already_linked" }, { status: 409 });
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // Consumir el código (one-shot).
  await admin.from("pairing_codes").delete().eq("code", code);

  await admin.from("ingest_events").insert({
    status: "ok",
    phone_e164: phone,
    user_id: pairing.user_id,
    error_message: "PAIRED",
  });

  return NextResponse.json({ ok: true, paired: true }, { status: 200 });
}
