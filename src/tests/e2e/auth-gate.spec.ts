import { test, expect } from "@playwright/test";

/**
 * Auth gate: las rutas privadas deben redirigir a /login cuando no hay sesión.
 *
 * Esto valida que el layout (dashboard) llama a getUser() y hace redirect en
 * cada request. Si añadimos una nueva ruta privada, basta con sumarla al array
 * y queda cubierta — no hay que duplicar tests.
 */
const PRIVATE_ROUTES = [
  "/dashboard",
  "/inbox",
  "/kanban",
  "/search",
  "/insights",
  "/settings",
  "/ideas/00000000-0000-0000-0000-000000000000", // un UUID inválido cualquiera
];

test.describe("Auth gate", () => {
  for (const route of PRIVATE_ROUTES) {
    test(`${route} redirige a /login sin sesión`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
      // El form de login debe estar visible — confirma que estamos en la página correcta
      await expect(page.getByRole("heading", { name: /Entra a ideIA/i })).toBeVisible();
    });
  }
});
