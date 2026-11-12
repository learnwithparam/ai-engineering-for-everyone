// node images/shoot.mjs: take every picture the course pages show, from real runs.
// Terminal output is drawn as a dark terminal about 800 pixels wide. Pages are opened in Chromium.
// Needs Playwright's Chromium. images/SHOTS.md lists each picture and the command behind it.

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Run commands in a throwaway copy, so a "your work passes" shot can use the sample solution as the work.
function inCopy(setup, cmds) {
  const tmp = mkdtempSync(join(tmpdir(), "shot-"));
  cpSync(ROOT, tmp, { recursive: true, filter: (s) => !s.includes("/.git") });
  setup?.(tmp);
  const out = cmds
    .map((c) => {
      let o;
      try {
        o = execSync(c, {
          cwd: tmp,
          env: { ...process.env, LLM_PROVIDER: "replay", FORCE_COLOR: "0" },
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (e) {
        o = (e.stdout ?? "") + (e.stderr ?? "");
      }
      return (
        `$ ${c}\n` +
        o
          .split("\n")
          .filter((l) => !l.startsWith("$ bun ") && !l.startsWith("error: script"))
          .join("\n")
          .trimEnd()
      );
    })
    .join("\n\n");
  rmSync(tmp, { recursive: true, force: true });
  return out;
}

const solved = (step) => (tmp) => {
  const dir = execSync(`ls -d parts/*/*-${step}`, { cwd: tmp, encoding: "utf8" }).trim();
  cpSync(join(tmp, dir, "solution"), join(tmp, dir, "problem"), { recursive: true });
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const paint = (s) =>
  esc(s)
    .replace(/^(\$ .*)$/gm, '<span class="cmd">$1</span>')
    .replace(/\b(PASS)\b/g, '<span class="pass">$1</span>')
    .replace(/\b(FAIL|ERROR)\b/g, '<span class="fail">$1</span>')
    .replace(/(Try next:)/g, '<span class="hint">$1</span>')
    .replace(/\b(YES)\b/g, '<span class="fail">$1</span>');
const terminal = (title, body) => `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#0d1117;padding:16px;width:800px;box-sizing:border-box}
.win{background:#161b22;border:1px solid #30363d;border-radius:10px;overflow:hidden}
.bar{display:flex;gap:6px;align-items:center;padding:8px 12px;background:#21262d;color:#8b949e;font:12px system-ui}
.dot{width:10px;height:10px;border-radius:50%;background:#484f58}
pre{margin:0;padding:14px 16px;color:#e6edf3;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}
.cmd{color:#79c0ff}.pass{color:#3fb950;font-weight:700}.fail{color:#f85149;font-weight:700}.hint{color:#d29922}
</style><div class="win"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>&nbsp;${esc(title)}</div><pre>${paint(body)}</pre></div>`;

export const SHOTS = [
  {
    out: "images/office-run.png",
    title: "bun run office",
    run: () => inCopy(null, ["bun run world reset", "bun run office"]),
  },
  { out: "images/finished-office.png", page: "world/state/office-report.html", width: 1100 },
  {
    out: "00-orientation/images/first-run.png",
    title: "your first check",
    run: () => inCopy(null, ["bun run verify meet-the-office"]),
  },
  {
    out: "parts/00-meet-the-office/01-meet-the-office/images/expected.png",
    page: "world/state/office-report.html",
    width: 1100,
  },
  {
    out: "parts/01-price-the-work/01-count-the-tokens/images/expected.png",
    title: "count-the-tokens",
    run: () =>
      inCopy(solved("count-the-tokens"), [
        "bun run words world/harbour-hill/policy/admissions-policy-2027.md world/harbour-hill/applications/03.md world/harbour-hill/inbox/04.md",
        "bun run verify count-the-tokens",
      ]),
  },
  {
    out: "parts/01-price-the-work/02-price-the-season/images/expected.png",
    title: "price-the-season",
    run: () => inCopy(solved("price-the-season"), ["bun run verify price-the-season"]),
  },
  {
    out: "parts/01-price-the-work/03-spot-the-hidden-cost/images/expected.png",
    title: "spot-the-hidden-cost",
    run: () => inCopy(solved("spot-the-hidden-cost"), ["bun run verify spot-the-hidden-cost"]),
  },
];

const only = process.argv[2];
execSync("bun run world reset && bun run office", {
  cwd: ROOT,
  stdio: "ignore",
  env: { ...process.env, LLM_PROVIDER: "replay" },
});
const browser = await chromium.launch();
for (const s of SHOTS.filter((s) => !only || s.out.includes(only))) {
  const page = await browser.newPage({
    viewport: { width: s.width ?? 832, height: 400 },
    deviceScaleFactor: 2,
  });
  if (s.page) await page.goto("file://" + join(ROOT, s.page));
  else {
    const html = join(tmpdir(), "shot.html");
    writeFileSync(html, terminal(s.title, s.run()));
    await page.goto("file://" + html);
  }
  mkdirSync(dirname(join(ROOT, s.out)), { recursive: true });
  await page.screenshot({ path: join(ROOT, s.out), fullPage: true });
  console.log("took", s.out);
  await page.close();
}
await browser.close();
