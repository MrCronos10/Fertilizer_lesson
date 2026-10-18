import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * WebKit only, deliberately: every v1 target browser (iPad Safari, macOS Safari)
 * uses WebKit, so Chromium would give false confidence. See PRD §6.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "ipad-portrait",
      use: { ...devices["Desktop Safari"], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "ipad-landscape",
      use: { ...devices["Desktop Safari"], viewport: { width: 1366, height: 1024 }, hasTouch: true },
    },
    {
      name: "mac-desktop",
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
  ],

  // Production build, not dev: dev-only warnings would make the
  // zero-console-errors assertion meaningless.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
