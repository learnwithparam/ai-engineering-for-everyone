// Check the verdict: bun assignment/check.ts [folder]
// It reads verdict.md in the folder (default: this one) and the recorded results.json here.
// It writes result.json in the folder: one pass or fail per Done-when line,
// and the promptfoo version found.
// Exit codes: 0 pass, 1 fail.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const HERE = import.meta.dir;
const WINNERS = ["small model", "middle model", "tie"];

export const DONE_WHEN = ["verdict.md names a winner for every prompt"];

type Row = { vars: { form: string } };
type Recorded = { metadata?: { promptfooVersion?: string }; results: { results: Row[] } };

export function readRecorded(): Recorded {
  return JSON.parse(readFileSync(join(HERE, "results.json"), "utf8"));
}

export function promptsIn(recorded: Recorded): string[] {
  return [...new Set(recorded.results.results.map((row) => row.vars.form))];
}

function cells(line: string): string[] {
  const inner = line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
  return inner.split("|").map((cell) => cell.trim());
}

// The winner written for one prompt, in lower case, or "" if there is no row for it.
export function winnerFor(verdict: string, prompt: string): string {
  for (const line of verdict.replace(/\r\n/g, "\n").split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const [first, second] = cells(line);
    if (first?.includes(prompt)) return (second ?? "").replace(/[*_`]/g, "").toLowerCase();
  }
  return "";
}

function verdictIn(folder: string): string {
  const file = join(folder, "verdict.md");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

export function hasVerdict(folder: string): boolean {
  return existsSync(join(folder, "verdict.md"));
}

// Every prompt has a row with something written under Winner.
export function hasRowPerPrompt(folder: string): boolean {
  const verdict = verdictIn(folder);
  return promptsIn(readRecorded()).every((prompt) => winnerFor(verdict, prompt) !== "");
}

export function winnersAreNamed(folder: string): boolean {
  const verdict = verdictIn(folder);
  return promptsIn(readRecorded()).every((prompt) => WINNERS.includes(winnerFor(verdict, prompt)));
}

type Line = { says: string; result: "pass" | "fail" };

export function runCheck(folder: string): { pass: boolean; lines: Line[] } {
  const lines = DONE_WHEN.map((says) => ({
    says,
    result: winnersAreNamed(folder) ? ("pass" as const) : ("fail" as const),
  }));
  return { pass: lines.every((line) => line.result === "pass"), lines };
}

if (import.meta.main) {
  const folder = resolve(process.argv[2] ?? HERE);
  const { pass, lines } = runCheck(folder);
  const version = readRecorded().metadata?.promptfooVersion ?? "unknown";
  const out = join(existsSync(folder) ? folder : dirname(folder), "result.json");
  writeFileSync(out, `${JSON.stringify({ promptfoo: version, lines }, null, 2)}\n`);
  for (const line of lines) console.log(`${line.result.toUpperCase()}  ${line.says}`);
  console.log(`promptfoo version found: ${version}`);
  process.exit(pass ? 0 : 1);
}
