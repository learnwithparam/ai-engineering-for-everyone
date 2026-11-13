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

// Every run plays back saved replies, so pictures never need a key and never change.
function replayEnvironment() {
  const environment = { ...process.env };
  environment.LLM_PROVIDER = "replay";
  return environment;
}

function runCommand(command, folder) {
  const environment = replayEnvironment();
  environment.FORCE_COLOR = "0";
  try {
    return execSync(command, {
      cwd: folder,
      env: environment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    // A failing command is still a picture: show what it printed.
    return (error.stdout ?? "") + (error.stderr ?? "");
  }
}

// Bun echoes the script it runs; the picture shows only the command the learner typed.
function isBunNoise(line) {
  return line.startsWith("$ bun ") || line.startsWith("error: script");
}

function terminalText(command, output) {
  const lines = output.split("\n").filter((line) => !isBunNoise(line));
  const shown = lines.join("\n").trimEnd();
  return `$ ${command}\n${shown}`;
}

// Run commands in a throwaway copy, so a "your work passes" shot can use the sample solution
// as the work.
function inCopy(setup, commands) {
  const copy = mkdtempSync(join(tmpdir(), "shot-"));
  cpSync(ROOT, copy, { recursive: true, filter: (source) => !source.includes("/.git") });
  setup?.(copy);
  const screens = commands.map((command) => terminalText(command, runCommand(command, copy)));
  rmSync(copy, { recursive: true, force: true });
  return screens.join("\n\n");
}

const solved = (step) => (copy) => {
  const listing = execSync(`ls -d parts/*/*-${step}`, { cwd: copy, encoding: "utf8" });
  const stepFolder = listing.trim();
  const solution = join(copy, stepFolder, "solution");
  cpSync(solution, join(copy, stepFolder, "problem"), { recursive: true });
};

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function paint(text) {
  return escapeHtml(text)
    .replace(/^(\$ .*)$/gm, '<span class="cmd">$1</span>')
    .replace(/\b(PASS)\b/g, '<span class="pass">$1</span>')
    .replace(/\b(FAIL|ERROR)\b/g, '<span class="fail">$1</span>')
    .replace(/(Try next:)/g, '<span class="hint">$1</span>')
    .replace(/\b(YES)\b/g, '<span class="fail">$1</span>');
}

const TERMINAL_STYLE = [
  "body{margin:0;background:#0d1117;padding:16px;width:800px;box-sizing:border-box}",
  ".win{background:#161b22;border:1px solid #30363d;border-radius:10px;overflow:hidden}",
  ".bar{display:flex;gap:6px;align-items:center;padding:8px 12px;background:#21262d;" +
    "color:#8b949e;font:12px system-ui}",
  ".dot{width:10px;height:10px;border-radius:50%;background:#484f58}",
  "pre{margin:0;padding:14px 16px;color:#e6edf3;" +
    "font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap}",
  ".cmd{color:#79c0ff}.pass{color:#3fb950;font-weight:700}.fail{color:#f85149;font-weight:700}" +
    ".hint{color:#d29922}",
].join("\n");

function terminal(title, body) {
  const dots = '<span class="dot"></span>'.repeat(3);
  const titleBar = `<div class="bar">${dots}&nbsp;${escapeHtml(title)}</div>`;
  const terminalWindow = `<div class="win">${titleBar}<pre>${paint(body)}</pre></div>`;
  const head = `<!doctype html><meta charset="utf-8"><style>\n${TERMINAL_STYLE}\n</style>`;
  return head + terminalWindow;
}

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
        [
          "bun run words",
          "world/harbour-hill/policy/admissions-policy-2027.md",
          "world/harbour-hill/applications/03.md",
          "world/harbour-hill/inbox/04.md",
        ].join(" "),
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
  {
    out: "parts/05-measure-the-letters/01-read-twenty-outputs/images/expected.png",
    title: "read-twenty-outputs",
    run: () => inCopy(solved("read-twenty-outputs"), ["bun run verify read-twenty-outputs"]),
  },
  {
    out: "parts/05-measure-the-letters/02-name-the-failures/images/expected.png",
    title: "name-the-failures",
    run: () => inCopy(solved("name-the-failures"), ["bun run verify name-the-failures"]),
  },
  {
    out: "parts/05-measure-the-letters/03-label-the-test-set/images/expected.png",
    title: "label-the-test-set",
    run: () => inCopy(solved("label-the-test-set"), ["bun run verify label-the-test-set"]),
  },
  {
    out: "parts/05-measure-the-letters/04-test-the-judge/images/expected.png",
    title: "test-the-judge",
    run: () => inCopy(solved("test-the-judge"), ["bun run verify test-the-judge"]),
  },
];

async function takeShot(browser, shot) {
  const page = await browser.newPage({
    viewport: { width: shot.width ?? 832, height: 400 },
    deviceScaleFactor: 2,
  });
  if (shot.page) await page.goto(`file://${join(ROOT, shot.page)}`);
  else {
    const html = join(tmpdir(), "shot.html");
    writeFileSync(html, terminal(shot.title, shot.run()));
    await page.goto(`file://${html}`);
  }
  mkdirSync(dirname(join(ROOT, shot.out)), { recursive: true });
  await page.screenshot({ path: join(ROOT, shot.out), fullPage: true });
  console.log("took", shot.out);
  await page.close();
}

// Pass part of a file name to take only the pictures that match.
const only = process.argv[2];
execSync("bun run world reset && bun run office", {
  cwd: ROOT,
  stdio: "ignore",
  env: replayEnvironment(),
});
const browser = await chromium.launch();
const wanted = SHOTS.filter((shot) => !only || shot.out.includes(only));
for (const shot of wanted) await takeShot(browser, shot);
await browser.close();
