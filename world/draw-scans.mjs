// node world/draw-scans.mjs: draw each scanned form (world/keys/scans/NN.html) as world/harbour-hill/applications/NN.png.
// Needs Playwright's Chromium. Course authors run it after bun run world build.
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// CommonJS require finds a Playwright installed globally as well as one in node_modules.
const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "keys", "scans");
const out = join(here, "harbour-hill", "applications");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 830, height: 900 }, deviceScaleFactor: 1 });
for (const f of readdirSync(src).filter((f) => f.endsWith(".html"))) {
  await page.goto("file://" + join(src, f));
  await page.screenshot({ path: join(out, f.replace(".html", ".png")), fullPage: true });
  console.log("drew", f.replace(".html", ".png"));
}
await browser.close();
