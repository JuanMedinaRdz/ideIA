// Estructurador IA: recibe texto crudo (mensaje WhatsApp, audio transcrito,
// nota rápida) y devuelve los campos de una Idea estructurada.
//
// Decisiones técnicas:
//   - Usamos JSON mode con `response_format: { type: "json_schema" }`. Garantiza
//     que el output siempre cumple el schema — sin parsing defensivo, sin
//     "y a veces el modelo se inventa una key".
//   - El schema es ESTRICTO (`additionalProperties: false`, `required: [...]`).
//     OpenAI usa "structured outputs" que fuerza el LLM a respetar el schema
//     a nivel de sampling, no solo prompt — tasa de error ~0%.
//   - Temperatura baja (0.3) para que la categoría/prioridad sean consistentes
//     entre ejecuciones del mismo input.
//   - Loguea uso en `ai_usage` SIEMPRE (éxito o error) — auditable y útil
//     para optimizar prompts con datos reales.

import { getOpenAI, DEFAULT_MODEL, estimateCostMicro } from "@/lib/openai/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  IdeaPriority,
  IdeaSource,
} from "@/features/ideas/types/idea";

export interface StructuredIdea {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  priority: IdeaPriority;
  ai_suggestions: string[];
  /** ISO 8601 con TZ si el texto menciona fecha/hora. null si no. */
  event_at: string | null;
  /** Duración estimada en minutos. 60 por defecto si hay event_at. */
  event_duration_minutes: number | null;
}

/** Zona horaria por defecto. Mover a config user en Fase 11. */
const DEFAULT_TZ = "America/Mexico_City";

interface StructureOptions {
  /** Para asociar el log en `ai_usage`. Si no se conoce aún, omite. */
  userId?: string;
  ideaId?: string;
  source?: IdeaSource;
}

/**
 * Construye el prompt sistema incluyendo contexto temporal. La hora actual y
 * la zona horaria se inyectan en cada llamada — sin eso la IA no puede
 * interpretar "mañana", "el viernes", "en 2 horas", etc.
 */
function buildSystemPrompt(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("es-MX", {
    timeZone: DEFAULT_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  const currentHuman = formatter.format(now);
  const currentIso = now.toISOString();

  return `Eres un asistente que organiza ideas/notas/pensamientos de un usuario.
Tu trabajo es transformar texto crudo (que puede venir de WhatsApp, voz transcrita, o web) en una idea estructurada en español.

CONTEXTO TEMPORAL — CRÍTICO:
- Ahora mismo es: ${currentHuman} (zona horaria del usuario: ${DEFAULT_TZ}).
- En ISO 8601 UTC: ${currentIso}.
- Cuando el texto mencione fechas/horas relativas ("mañana", "el viernes", "en 2 horas", "hoy a las 8pm", "esta tarde"), calcula la fecha+hora absoluta DESDE ese momento actual y devuélvela en event_at en formato ISO 8601 con offset de zona (ejemplo: "2026-06-03T20:00:00-06:00").
- Si el usuario no especifica hora pero sí día, asume las 09:00 del día indicado.
- Si el texto NO menciona ninguna fecha/hora, event_at debe ser null.

Reglas para el resto de campos:
- TITLE: máximo 80 caracteres, en imperativo o sustantivo claro. No uses comillas. Refleja la acción/tema principal.
- SUMMARY: 1-2 frases (máx 200 caracteres) que resuman el contenido completo. Conserva información clave: fechas, números, nombres.
- CATEGORY: una palabra. Sugeridas: Producto, Contenido, Personal, Ingeniería, Bug, Marketing, Investigación, Admin. Inventa otra si encaja mejor.
- TAGS: 2-4 etiquetas en minúscula, una palabra cada una. Específicas.
- PRIORITY: detecta urgencia.
  - urgent: bloqueante o fecha en <48h (incluyendo "hoy" y "mañana")
  - high: importante con fecha en esta semana
  - medium: importante pero sin fecha apremiante (default)
  - low: idea o nota sin presión
- AI_SUGGESTIONS: 1-3 próximos pasos concretos. Empieza con verbo en infinitivo.
- EVENT_DURATION_MINUTES: si hay event_at, estima duración razonable según el tipo (reunión: 30-60, entrevista: 45, llamada rápida: 15, evento: 120). Si no hay event_at, null.

Si el input es muy corto o ambiguo, infiere lo mínimo razonable sin inventar contexto que no esté.`;
}

// Strict mode de OpenAI requiere TODOS los campos en `required` y `properties`.
// Para hacer un campo "opcional", lo declaramos con type: ["string", "null"]
// o equivalente y dejamos que el modelo elija null cuando no aplica.
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "category",
    "tags",
    "priority",
    "ai_suggestions",
    "event_at",
    "event_duration_minutes",
  ],
  properties: {
    title: { type: "string", maxLength: 200 },
    summary: { type: "string", maxLength: 800 },
    category: { type: "string", maxLength: 50 },
    tags: {
      type: "array",
      items: { type: "string", maxLength: 30 },
      maxItems: 6,
    },
    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
    ai_suggestions: {
      type: "array",
      items: { type: "string", maxLength: 200 },
      maxItems: 5,
    },
    event_at: {
      type: ["string", "null"],
      description: "ISO 8601 con offset de TZ. null si no hay fecha/hora.",
    },
    event_duration_minutes: {
      type: ["integer", "null"],
      minimum: 5,
      maximum: 1440,
    },
  },
} as const;

export async function structureIdea(
  rawContent: string,
  options: StructureOptions = {},
): Promise<StructuredIdea> {
  const trimmed = rawContent.trim();
  if (!trimmed) throw new Error("EMPTY_INPUT");
  if (trimmed.length > 4000) {
    throw new Error("INPUT_TOO_LONG");
  }

  const openai = getOpenAI();
  const startedAt = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: trimmed },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_idea",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("NO_CONTENT");

    // Con structured outputs el parseo nunca falla, pero por contrato lo
    // envolvemos. Nunca confíes 100% en una API externa.
    const parsed = JSON.parse(raw) as StructuredIdea;

    await logUsage({
      ...options,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    });

    return parsed;
  } catch (e) {
    await logUsage({
      ...options,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startedAt,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

async function logUsage(params: {
  userId?: string;
  ideaId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  errorMessage?: string;
}) {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("ai_usage").insert({
      user_id: params.userId ?? null,
      idea_id: params.ideaId ?? null,
      operation: "structure_idea",
      model: DEFAULT_MODEL,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.totalTokens,
      cost_usd_micro: estimateCostMicro(
        DEFAULT_MODEL,
        params.promptTokens,
        params.completionTokens,
      ),
      latency_ms: params.latencyMs,
      error_message: params.errorMessage ?? null,
    });
  } catch {
    // No bloqueamos el flujo principal si el log falla — la idea es lo
    // importante; el tracking es complementario.
  }
}
