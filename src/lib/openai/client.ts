// Cliente OpenAI lazy + singleton.
//
// Server-only — la API key NUNCA debe llegar al cliente.
// El singleton evita reabrir el TCP connection pool en cada request.

import OpenAI from "openai";
import { serverEnv } from "@/lib/env";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  if (!serverEnv.openAiApiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Crea una key en https://platform.openai.com/api-keys y añádela a .env.local.",
    );
  }
  cached = new OpenAI({ apiKey: serverEnv.openAiApiKey });
  return cached;
}

/**
 * Modelo por defecto. `gpt-4o-mini` es el sweet spot: barato (~$0.15 input /
 * $0.60 output por 1M tokens), rápido, y soporta JSON structured outputs.
 * Si en el futuro quieres mejor calidad, sube a `gpt-4o` (~10x precio).
 */
export const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Precios en USD por 1M tokens (octubre 2024). Actualiza si OpenAI cambia.
 * Usado solo para calcular el costo aproximado en `ai_usage`.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

/** Devuelve costo en "microcents" (1e-6 USD). 1000 = $0.001. */
export function estimateCostMicro(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const usd =
    (promptTokens * pricing.input) / 1_000_000 +
    (completionTokens * pricing.output) / 1_000_000;
  return Math.round(usd * 1_000_000);
}
