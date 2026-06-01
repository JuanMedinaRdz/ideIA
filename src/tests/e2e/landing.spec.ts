import { test, expect } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";

test.describe("Landing pública", () => {
  test("renderiza heading, CTAs y badge de Fase 1", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.expectVisible();
  });

  test("el CTA 'Ir al dashboard' lleva a /dashboard (que redirige a /login si no auth)", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.dashboardCta.click();
    // Al no estar autenticado, el layout (dashboard) redirige a /login.
    await expect(page).toHaveURL(/\/login/);
  });

  test("metadata SEO básica", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ideIA/);
  });
});
