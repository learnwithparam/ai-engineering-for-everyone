// The audit needs the course app running. Set AUDIT_URL to where it listens.
// Set AUDIT_SERVER to a command that starts it, and Playwright starts and stops it for you.
import { defineConfig } from "@playwright/test";

const appUrl = process.env.AUDIT_URL ?? "http://localhost:3000";
const startCommand = process.env.AUDIT_SERVER;
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
    ? { command: startCommand, url: appUrl, reuseExistingServer: true }
    : undefined,
});
