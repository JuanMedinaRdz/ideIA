import { test, expect } from "@playwright/test";

/**
 * Smoke tests del flujo OAuth Google. Como con todos los flujos auth, no
 * podemos automatizar el consent de Google sin tooling extra (mock OAuth
 * server). Pero SÍ podemos validar:
 *   - /api/google/connect requiere sesión → redirige a /login sin auth.
 *   - /api/google/callback con params raros no crashea el server.
 */

test.describe("Google OAuth — smoke público", () => {
  test("/api/google/connect sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/api/google/connect");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("/api/google/callback sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/api/google/callback?code=fake&state=fake");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
