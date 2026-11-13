// bun run audit: builds the office report, then runs the text audit on it in a browser.
// The audit needs Chromium. Install it once with: bunx playwright install chromium
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const run = (command: string[], env: Record<string, string> = {}): number =>
  Bun.spawnSync(command, {
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, ...env },
  }).exitCode;

const browser = process.env.AUDIT_BROWSER ?? chromium.executablePath();
if (!existsSync(browser)) {
  console.log("Text audit skipped: no browser found. Run: bunx playwright install chromium");
  process.exit(process.env.AUDIT_REQUIRED ? 1 : 0);
}
if (run(["bun", "world/office.ts"]) !== 0) process.exit(1);
const port = "4173";
process.exit(
  run(["bunx", "playwright", "test", "--config", "e2e/playwright.config.ts", "--trace", "off"], {
    // biome-ignore lint/style/useNamingConvention: environment variable names are upper case
    AUDIT_URL: `http://localhost:${port}`,
    // biome-ignore lint/style/useNamingConvention: environment variable names are upper case
    AUDIT_SERVER: "bun serve.ts",
    // biome-ignore lint/style/useNamingConvention: environment variable names are upper case
    AUDIT_PORT: port,
  }),
);
