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
}

interface StructureOptions {
  /** Para asociar el log en `ai_usage`. Si no se conoce aún, omite. */
  userId?: string;
  ideaId?: string;
  source?: IdeaSource;
}

const SYSTEM_PROMPT = `Eres un asistente que organiza ideas/notas/pensamientos de un usuario.
Tu trabajo es transformar texto crudo (que puede venir de WhatsApp, voz transcrita, o web) en una idea estructurada en español.

Reglas:
- TITLE: máximo 80 caracteres, en imperativo o sustantivo claro. No uses comillas. Refleja la acción/tema principal.
- SUMMARY: 1-2 frases (máx 200 caracteres) que resuman el contenido completo. Conserva información clave: fechas, números, nombres.
- CATEGORY: una palabra. Categorías sugeridas: Producto, Contenido, Personal, Ingeniería, Bug, Marketing, Investigación, Admin. Inventa otra si encaja mejor.
- TAGS: 2-4 etiquetas en minúscula, una palabra cada una. Específicas (ej: "onboarding", "playwright"), no genéricas (ej: "trabajo", "tarea").
- PRIORITY: detecta urgencia explícita ("urgente", "antes del viernes", "hoy") o implícita.
  - urgent: bloqueante o fecha en <48h
  - high: importante con fecha en esta semana
  - medium: importante pero sin fecha apremiante (default)
  - low: idea o nota sin presión
- AI_SUGGESTIONS: 1-3 próximos pasos concretos y accionables. Empieza cada uno con verbo en infinitivo. NO repitas el contenido de la idea, propón ACCIONES.

Si el input es muy corto o ambiguo, infiere lo mínimo razonable sin inventar contexto que no esté.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "category", "tags", "priority", "ai_suggestions"],
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
        { role: "system", content: SYSTEM_PROMPT },
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
