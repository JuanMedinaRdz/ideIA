import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Login con OTP en 2 pasos.
 *
 * NOTA: validar el flujo end-to-end requeriría interceptar el email de Resend.
 * Eso se haría con un mock SMTP en un entorno de testing dedicado (fuera del
 * scope de estos tests básicos). Aquí cubrimos lo que SÍ podemos:
 *  - Render correcto del paso 1 (email).
 *  - Validación cliente: botón deshabilitado sin email.
 *  - Que el botón cambia a "Enviando…" al submit (loading state).
 */
export class LoginPage extends BasePage {
  readonly path = "/login";

  get heading() {
    return this.page.getByRole("heading", { name: /Entra a ideIA/i });
  }
  get emailInput() {
    return this.page.getByPlaceholder("tu@email.com");
  }
  get submitButton() {
    return this.page.getByRole("button", { name: /Enviar código/i });
  }

  async expectVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }
}
