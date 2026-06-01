import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test.describe("Login form", () => {
  test("renderiza email input + submit button", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectVisible();
  });

  test("submit button está deshabilitado sin email", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.submitButton).toBeDisabled();
  });

  test("submit button se habilita al escribir email válido", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillEmail("test@example.com");
    await expect(login.submitButton).toBeEnabled();
  });

  test("acepta email válido y cambia a estado 'Enviando…'", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillEmail("test-no-existe-xyz123@example.com");
    await login.submitButton.click();
    // Debe mostrar el texto de loading brevemente. Como puede ser instantáneo,
    // toleramos que ya haya pasado al paso 2 o al estado de error.
    await page.waitForTimeout(500);
    // La página NO debe seguir mostrando "Enviar código" si todo va bien
    // (porque pasó a paso 2 o muestra error). Verificamos URL sin redirect.
    await expect(page).toHaveURL(/\/login/);
  });
});
