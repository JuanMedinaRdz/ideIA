import { defineConfig, devices } from "@playwright/test";

/**
 * Config Playwright para ideIA.
 *
 * - `baseURL` apunta a tu deploy de Vercel por defecto. Sobreescribible con
 *   `PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e` para testear local.
 * - Reporters: HTML para revisión local + list para CI/terminal.
 * - Trace/Video on-failure: para debuggear sin sobrecargar artefactos.
 * - 3 navegadores chromium/firefox/webkit cubren ~95% del tráfico real.
 *   En desarrollo basta con chromium; los otros se activan en CI.
 */
export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://ide-ia-chi.vercel.app",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // En CI activar también:
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit",  use: { ...devices["Desktop Safari"]  } },
    // { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
});
