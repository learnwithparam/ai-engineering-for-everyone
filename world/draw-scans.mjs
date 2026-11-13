// node world/draw-scans.mjs: draw each scanned form (world/keys/scans/NN.html)
// as world/harbour-hill/applications/NN.png.
// Needs Playwright's Chromium. Course authors run it after bun run world build.

import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CommonJS require finds a Playwright installed globally as well as one in node_modules.
const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const scansFolder = join(here, "keys", "scans");
const applicationsFolder = join(here, "harbour-hill", "applications");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 830, height: 900 }, deviceScaleFactor: 1 });
const scans = readdirSync(scansFolder).filter((file) => file.endsWith(".html"));
for (const scan of scans) {
  const picture = scan.replace(".html", ".png");
  await page.goto(`file://${join(scansFolder, scan)}`);
  await page.screenshot({ path: join(applicationsFolder, picture), fullPage: true });
  console.log("drew", picture);
}
await browser.close();
