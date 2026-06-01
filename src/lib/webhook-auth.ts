import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/**
 * Verifica el header `x-webhook-secret` con comparación constant-time para
 * evitar timing attacks. Si `==` simple, un atacante podría inferir el secret
 * carácter a carácter midiendo cuánto tarda la respuesta.
 */
export function verifyWebhookSecret(request: Request): boolean {
  const provided = request.headers.get("x-webhook-secret");
  const expected = serverEnv.n8nWebhookSecret;

  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
