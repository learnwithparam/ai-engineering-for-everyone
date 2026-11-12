// bun run office: the finished system. It reads six forms, puts each in policy order,
// drafts a letter, and flags every form a person must check.
// It logs every model call to world/state/office-log.jsonl
// and writes a page you can open: world/state/office-report.html.
// With no key it plays back saved replies (LLM_PROVIDER=replay), so it costs nothing to run.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Provider, provider } from "../config/models";
import { ask, type Reply } from "./lib/llm";
import { guard, OFFICE_SAMPLE, parseRow, policyPlace } from "./lib/office";
import { extractionPrompt, letterPrompt } from "./lib/prompts";
import {
  HARBOUR_HILL,
  log,
  OFFICE_LOG,
  OFFICE_REPORT,
  type RegisterRow,
  readRegister,
  STATE,
} from "./lib/state";

// What the office did with one form.
type Outcome = {
  id: string;
  child: string;
  place: string;
  reasons: string[];
  letter: string;
  row: Record<string, string>;
  cost: number;
  tokens: number;
};

// --run=1 or --run=2 plays a different saved reply, to show the model does not always agree.
const runOption = process.argv.find((argument) => argument.startsWith("--run="));
const run = Number(runOption?.split("=")[1] ?? 0);

const register = readRegister();
mkdirSync(STATE, { recursive: true });
rmSync(OFFICE_LOG, { force: true });

let chosen: Provider;
try {
  chosen = provider();
} catch (error) {
  console.log((error as Error).message);
  process.exit(2);
}

// One line in the office log for one model call. Each call is logged, so its cost can be checked.
function logModelCall(id: string, step: string, reply: Reply) {
  // biome-ignore-start lint/style/useNamingConvention: these are the office log's own field names
  log(OFFICE_LOG, {
    application_id: id,
    step,
    role: reply.role,
    input_tokens: reply.inputTokens,
    output_tokens: reply.outputTokens,
    cost: reply.cost,
  });
  // biome-ignore-end lint/style/useNamingConvention: end of the log's field names
}

// The model reads the form and drafts the letter. The rules, not the model, decide the place.
async function handleForm(id: string, applicant: RegisterRow): Promise<Outcome> {
  const formFile = join(HARBOUR_HILL, "applications", `${id.slice(-2)}.md`);
  const form = readFileSync(formFile, "utf8");

  const reading = await ask("fast", extractionPrompt(form), run);
  const row = parseRow(reading.text);
  const reasons = guard(form, row);
  const place = row ? policyPlace(row) : { clause: "?", name: "unknown" };
  logModelCall(id, "read the form", reading);

  const prompt = letterPrompt(applicant.child_name, applicant.parent_name, id, reasons);
  const letter = await ask("smart", prompt, run);
  logModelCall(id, "draft the letter", letter);

  // biome-ignore-start lint/style/useNamingConvention: these are the office log's own field names
  log(OFFICE_LOG, {
    application_id: id,
    step: "flag",
    needs_person: reasons.length > 0,
    reasons,
    policy_clause: place.clause,
    signed_by: null,
  });
  // biome-ignore-end lint/style/useNamingConvention: end of the log's field names

  const tokens =
    reading.inputTokens + reading.outputTokens + letter.inputTokens + letter.outputTokens;
  return {
    id,
    child: applicant.child_name,
    place: `${place.clause} ${place.name}`,
    reasons,
    letter: letter.text,
    row: row ?? {},
    cost: reading.cost + letter.cost,
    tokens,
  };
}

function printOutcome(outcome: Outcome) {
  let needsPerson = "no";
  if (outcome.reasons.length > 0) needsPerson = `YES: ${outcome.reasons.join("; ")}`;
  const columns = [
    outcome.id.padEnd(9),
    outcome.child.padEnd(17),
    outcome.place.padEnd(16),
    needsPerson,
  ];
  console.log(`  ${columns.join(" ")}`);
}

// Stop text in a form from being read as HTML on the report page.
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function tableRows(row: Record<string, string>): string {
  const shown = Object.entries(row).filter(
    ([field]) => field !== "application_id" && field !== "child_name",
  );
  const rows = shown.map(([field, value]) => {
    const label = field.replace(/_/g, " ");
    const valueClass = value === "unknown" ? "unk" : "";
    return `<tr><td>${label}</td><td class="${valueClass}">${escapeHtml(value)}</td></tr>`;
  });
  return rows.join("");
}

function reasonList(reasons: string[]): string {
  if (reasons.length === 0) return "";
  const items = reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`);
  return `<ul class="why">${items.join("")}</ul>`;
}

function card(outcome: Outcome): string {
  const flagged = outcome.reasons.length > 0;
  let badge = '<span class="ok">Ready for a person to sign</span>';
  if (flagged) badge = '<span class="badge">Needs a person</span>';
  return [
    `<section class="card ${flagged ? "flag" : ""}">`,
    `  <header><b>${outcome.id}</b> ${escapeHtml(outcome.child)} ${badge}</header>`,
    `  <table>${tableRows(outcome.row)}`,
    `  <tr><td>policy place</td><td>clause ${escapeHtml(outcome.place)}</td></tr></table>`,
    `  ${reasonList(outcome.reasons)}`,
    `  <details><summary>Draft letter</summary><pre>${escapeHtml(outcome.letter)}</pre></details>`,
    "</section>",
  ].join("\n");
}

// The page's colours and layout. It follows the reader's light or dark setting.
const STYLE = [
  ":root{--bg:#f6f4ef;--card:#fff;--ink:#1d2430;--muted:#5b6472;--line:#e3ded3;" +
    "--red:#b42318;--redbg:#fde8e6;--green:#1f7a4d}",
  "@media (prefers-color-scheme: dark){:root{--bg:#14171c;--card:#1d2128;--ink:#e8eaee;" +
    "--muted:#9aa3b1;--line:#2c323c;--red:#ff8a80;--redbg:#3a1d1b;--green:#6fd3a0}}",
  "body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif}",
  "main{max-width:1100px;margin:0 auto;padding:24px 16px}",
  "h1{font-size:22px;margin:0 0 4px} p.sub{color:var(--muted);margin:0 0 18px}",
  ".sum{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}",
  ".sum div{background:var(--card);border:1px solid var(--line);border-radius:10px;" +
    "padding:10px 14px}",
  ".sum b{display:block;font-size:20px}",
  ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}",
  ".card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}",
  ".card.flag{border-color:var(--red)}",
  "header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}",
  ".badge{background:var(--redbg);color:var(--red);font-weight:600;border-radius:99px;" +
    "padding:2px 10px;font-size:13px}",
  ".ok{color:var(--green);font-size:13px}",
  "table{width:100%;border-collapse:collapse;font-size:14px} " +
    "td{padding:3px 0;border-bottom:1px solid var(--line)} " +
    "td:first-child{color:var(--muted);width:48%}",
  ".unk{color:var(--red);font-weight:600}",
  ".why{color:var(--red);margin:8px 0;padding-left:18px;font-size:14px}",
  "pre{white-space:pre-wrap;font:13px/1.4 ui-monospace,monospace;background:var(--bg);" +
    "padding:8px;border-radius:8px}",
].join("\n");

function reportPage(outcomes: Outcome[], cost: number, tokens: number): string {
  const flagged = outcomes.filter((outcome) => outcome.reasons.length > 0);
  const cards = outcomes.map(card).join("\n");
  const summary = [
    `<div><b>${outcomes.length}</b>forms read</div>`,
    `<div><b>${flagged.length}</b>need a person</div>`,
    `<div><b>$${cost.toFixed(4)}</b>cost of this run</div>`,
    `<div><b>${tokens.toLocaleString("en-GB")}</b>tokens</div>`,
  ].join("");
  return [
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Harbour Hill office run</title>',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<style>",
    STYLE,
    "</style>",
    "<main>",
    "<h1>Harbour Hill admissions office: one run</h1>",
    '<p class="sub">Fictional school. The AI reads forms and drafts letters. ' +
      "The policy rules set the order. A person signs every letter.</p>",
    `<div class="sum">${summary}</div>`,
    `<div class="grid">${cards}</div>`,
    "</main></html>",
    "",
  ].join("\n");
}

let providerNote = "";
if (chosen === "replay") providerNote = ", no key needed";
console.log(
  `The finished office reads ${OFFICE_SAMPLE.length} forms (provider: ${chosen}${providerNote}).\n`,
);
console.log(
  `  ${"Form".padEnd(9)} ${"Child".padEnd(17)} ${"Policy place".padEnd(16)} Needs a person`,
);

const outcomes: Outcome[] = [];
for (const id of OFFICE_SAMPLE) {
  const applicant = register.applicants.find((row) => row.applicant_id === id);
  try {
    if (!applicant) throw new Error(`${id} is not in the register`);
    const outcome = await handleForm(id, applicant);
    outcomes.push(outcome);
    printOutcome(outcome);
  } catch (error) {
    console.log(`  ${id.padEnd(9)} could not run: ${(error as Error).message}`);
    process.exit(2);
  }
}

let cost = 0;
let tokens = 0;
for (const outcome of outcomes) {
  cost += outcome.cost;
  tokens += outcome.tokens;
}
const flagged = outcomes.filter((outcome) => outcome.reasons.length > 0);
const flaggedIds = flagged.map((outcome) => outcome.id).join(", ");

console.log(`\nLetters drafted: ${outcomes.length}. Every one waits for a person to sign it.`);
console.log(`Cost of this run: $${cost.toFixed(4)} for ${tokens.toLocaleString("en-GB")} tokens.`);
console.log(`${flagged.length} of ${outcomes.length} forms need a person: ${flaggedIds}`);
console.log("Log: world/state/office-log.jsonl   Page: world/state/office-report.html");

writeFileSync(OFFICE_REPORT, reportPage(outcomes, cost, tokens));
