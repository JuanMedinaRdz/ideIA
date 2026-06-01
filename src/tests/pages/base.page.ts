import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object. Patrón POM clásico:
 *  - Cada página de la app tiene una clase Page (extiende esta).
 *  - Los selectores y acciones viven en la clase, NO en los tests.
 *  - Tests son "describe what" (assertions), pages son "describe how" (selectors).
 *
 * Beneficio: si cambias la UI, tocas un solo sitio. Los tests siguen igual.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** URL relativa a la baseURL configurada. Sobreescribir en subclases. */
  abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Espera a que la página esté completamente cargada (sin requests pendientes). */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /** Locator a un elemento por accessible name (rol + nombre). */
  byRole(role: Parameters<Page["getByRole"]>[0], name: string | RegExp): Locator {
    return this.page.getByRole(role, { name });
  }

  /** Locator por texto visible. */
  byText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
