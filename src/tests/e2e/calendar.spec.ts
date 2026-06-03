import { test, expect } from "@playwright/test";

/**
 * Smoke tests para /calendar.
 *
 * Tests authenticated del calendario en sí (renderizado del grid, navegación de
 * mes, selección de día) requieren un test user con sesión seedada. Eso queda
 * para una iteración futura con fixtures de auth.
 *
 * Aquí cubrimos lo que SÍ podemos sin sesión:
 *  - La ruta existe y el auth gate la protege con search params válidos.
 *  - search params inválidos no rompen el server (devuelve 307 igualmente).
 */

test.describe("Calendario — smoke público", () => {
  test("redirige a /login sin sesión (con search params válidos)", async ({ page }) => {
    await page.goto("/calendar?y=2026&m=5");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("redirige a /login con search params raros (no rompe el server)", async ({ page }) => {
    await page.goto("/calendar?y=abc&m=999");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
