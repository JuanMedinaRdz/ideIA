import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LandingPage extends BasePage {
  readonly path = "/";

  // Selectores como getters → siempre frescos, no se desincronizan con el DOM.
  get heading() {
    return this.page.getByRole("heading", { name: /Captura ideas/i });
  }
  get dashboardCta() {
    return this.page.getByRole("link", { name: /Ir al dashboard/i });
  }
  get connectWhatsappCta() {
    return this.page.getByRole("link", { name: /Conectar WhatsApp/i });
  }

  /** Verifica que la landing está OK: heading + ambos CTAs visibles. */
  async expectVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.dashboardCta).toBeVisible();
    await expect(this.connectWhatsappCta).toBeVisible();
  }
}
