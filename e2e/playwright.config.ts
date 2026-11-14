// The audit starts its own page server by default: e2e/serve.ts builds and serves the report.
// Set AUDIT_URL to audit an app running elsewhere. Set AUDIT_SERVER to a different start command.
import { defineConfig } from "@playwright/test";

const appUrl = process.env.AUDIT_URL ?? "http://localhost:3017";
const startCommand = process.env.AUDIT_SERVER ?? "bun e2e/serve.ts 3017";
// Set AUDIT_BROWSER to a Chromium you already have, when Playwright's own copy is not installed.
const browserPath = process.env.AUDIT_BROWSER;

export default defineConfig({
  testDir: ".",
  testMatch: "text-audit.spec.ts",
  reporter: "list",
  use: {
    // biome-ignore lint/style/useNamingConvention: baseURL is the name Playwright requires
    baseURL: appUrl,
    trace: "off",
    launchOptions: browserPath ? { executablePath: browserPath } : {},
  },
  webServer: startCommand
    ? { command: startCommand, cwd: "..", url: appUrl, reuseExistingServer: true }
    : undefined,
});
