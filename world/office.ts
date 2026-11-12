// bun run office: the finished system. It reads six forms, puts each in policy order, drafts a letter,
// and flags every form a person must check. It logs every model call to world/state/office-log.jsonl
// and writes a page you can open: world/state/office-report.html.
// With no key it plays back saved replies (LLM_PROVIDER=replay), so it costs nothing to run.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ask } from "./lib/llm";
import { extractionPrompt, letterPrompt } from "./lib/prompts";
import { guard, parseRow, policyPlace, OFFICE_SAMPLE } from "./lib/office";
import { HH, STATE, OFFICE_LOG, OFFICE_REPORT, log, readRegister } from "./lib/state";
import { provider } from "../config/models";

const run = Number(process.argv.find((a) => a.startsWith("--run="))?.split("=")[1] ?? 0);
const reg = readRegister();
mkdirSync(STATE, { recursive: true });
rmSync(OFFICE_LOG, { force: true });

type Done = { id: string; child: string; place: string; why: string[]; letter: string; row: Record<string, string> };
const done: Done[] = [];
let cost = 0;
let tokens = 0;

let p: string;
try {
  p = provider();
} catch (e) {
  console.log((e as Error).message);
  process.exit(2);
}
console.log(`The finished office reads ${OFFICE_SAMPLE.length} forms (provider: ${p}${p === "replay" ? ", no key needed" : ""}).\n`);
console.log(`  ${"Form".padEnd(9)} ${"Child".padEnd(17)} ${"Policy place".padEnd(16)} Needs a person`);

for (const id of OFFICE_SAMPLE) {
  const r = reg.applicants.find((a) => a.applicant_id === id)!;
  const form = readFileSync(join(HH, "applications", `${id.slice(-2)}.md`), "utf8");
  try {
    const ex = await ask("fast", extractionPrompt(form), run);
    const row = parseRow(ex.text);
    const why = guard(form, row);
    const place = row ? policyPlace(row) : { clause: "?", name: "unknown" };
    log(OFFICE_LOG, { application_id: id, step: "read the form", role: "fast", input_tokens: ex.inputTokens, output_tokens: ex.outputTokens, cost: ex.cost });
    const lt = await ask("smart", letterPrompt(r.child_name, r.parent_name, id, why), run);
    log(OFFICE_LOG, { application_id: id, step: "draft the letter", role: "smart", input_tokens: lt.inputTokens, output_tokens: lt.outputTokens, cost: lt.cost });
    log(OFFICE_LOG, { application_id: id, step: "flag", needs_person: why.length > 0, reasons: why, policy_clause: place.clause, signed_by: null });
    cost += ex.cost + lt.cost;
    tokens += ex.inputTokens + ex.outputTokens + lt.inputTokens + lt.outputTokens;
    done.push({ id, child: r.child_name, place: `${place.clause} ${place.name}`, why, letter: lt.text, row: row ?? {} });
    console.log(`  ${id.padEnd(9)} ${r.child_name.padEnd(17)} ${`${place.clause} ${place.name}`.padEnd(16)} ${why.length ? `YES: ${why.join("; ")}` : "no"}`);
  } catch (e) {
    console.log(`  ${id.padEnd(9)} could not run: ${(e as Error).message}`);
    process.exit(2);
  }
}

const flagged = done.filter((d) => d.why.length);
console.log(`\nLetters drafted: ${done.length}. Every one waits for a person to sign it.`);
console.log(`Cost of this run: $${cost.toFixed(4)} for ${tokens.toLocaleString("en-GB")} tokens.`);
console.log(`${flagged.length} of ${done.length} forms need a person: ${flagged.map((d) => d.id).join(", ")}`);
console.log("Log: world/state/office-log.jsonl   Page: world/state/office-report.html");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const cards = done
  .map(
    (d) => `<section class="card ${d.why.length ? "flag" : ""}">
  <header><b>${d.id}</b> ${esc(d.child)} ${d.why.length ? '<span class="badge">Needs a person</span>' : '<span class="ok">Ready for a person to sign</span>'}</header>
  <table>${Object.entries(d.row).filter(([k]) => k !== "application_id" && k !== "child_name").map(([k, v]) => `<tr><td>${k.replace(/_/g, " ")}</td><td class="${v === "unknown" ? "unk" : ""}">${esc(v)}</td></tr>`).join("")}
  <tr><td>policy place</td><td>clause ${esc(d.place)}</td></tr></table>
  ${d.why.length ? `<ul class="why">${d.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
  <details><summary>Draft letter</summary><pre>${esc(d.letter)}</pre></details>
</section>`,
  )
  .join("\n");
writeFileSync(
  OFFICE_REPORT,
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Harbour Hill office run</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{--bg:#f6f4ef;--card:#fff;--ink:#1d2430;--muted:#5b6472;--line:#e3ded3;--red:#b42318;--redbg:#fde8e6;--green:#1f7a4d}
@media (prefers-color-scheme: dark){:root{--bg:#14171c;--card:#1d2128;--ink:#e8eaee;--muted:#9aa3b1;--line:#2c323c;--red:#ff8a80;--redbg:#3a1d1b;--green:#6fd3a0}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 4px} p.sub{color:var(--muted);margin:0 0 18px}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.sum div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.sum b{display:block;font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.card.flag{border-color:var(--red)}
header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.badge{background:var(--redbg);color:var(--red);font-weight:600;border-radius:99px;padding:2px 10px;font-size:13px}
.ok{color:var(--green);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px} td{padding:3px 0;border-bottom:1px solid var(--line)} td:first-child{color:var(--muted);width:48%}
.unk{color:var(--red);font-weight:600}
.why{color:var(--red);margin:8px 0;padding-left:18px;font-size:14px}
pre{white-space:pre-wrap;font:13px/1.4 ui-monospace,monospace;background:var(--bg);padding:8px;border-radius:8px}
</style>
<main>
<h1>Harbour Hill admissions office: one run</h1>
<p class="sub">Fictional school. The AI reads forms and drafts letters. The policy rules set the order. A person signs every letter.</p>
<div class="sum"><div><b>${done.length}</b>forms read</div><div><b>${flagged.length}</b>need a person</div><div><b>$${cost.toFixed(4)}</b>cost of this run</div><div><b>${tokens.toLocaleString("en-GB")}</b>tokens</div></div>
<div class="grid">${cards}</div>
</main></html>
`,
);
