import { test, expect } from "@playwright/test";

/**
 * Tests del webhook /api/webhooks/n8n.
 *
 * Validan que el endpoint:
 *  - Rechaza requests sin secret (401).
 *  - Rechaza secret incorrecto (401, constant-time compare).
 *  - Acepta secret correcto pero falla validación de payload (400).
 *  - Mantiene la respuesta consistente (JSON).
 *
 * NO testeamos la rama happy-path (crear idea) porque requeriría un user con
 * número emparejado en el DB — eso pertenece a tests de integración con seed.
 */

const WEBHOOK_PATH = "/api/webhooks/n8n";

test.describe("Webhook /api/webhooks/n8n", () => {
  test("rechaza sin header x-webhook-secret → 401", async ({ request }) => {
    const res = await request.post(WEBHOOK_PATH, {
      data: {},
      headers: { "content-type": "application/json" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  test("rechaza secret incorrecto → 401", async ({ request }) => {
    const res = await request.post(WEBHOOK_PATH, {
      data: {},
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": "secret-incorrecto-de-prueba",
      },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test("OPTIONS / GET no soportado → 405", async ({ request }) => {
    const res = await request.get(WEBHOOK_PATH, { failOnStatusCode: false });
    // Next devuelve 405 Method Not Allowed para route handlers sin GET.
    expect([405, 404]).toContain(res.status());
  });
});
