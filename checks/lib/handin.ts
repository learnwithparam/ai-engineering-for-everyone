// Read the files a learner hands in. A check reads files, never the chat.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";

export const has = (dir: string, name: string) => existsSync(join(dir, name));

export function text(dir: string, name: string): string {
  const p = join(dir, name);
  return existsSync(p) ? readFileSync(p, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n") : "";
}

// A number as people write it: "$1,234.50", "1 200", "0.0036", "about 2,400 tokens". NaN if there is none.
export function num(s: string | undefined): number {
  if (!s) return NaN;
  const m = s.replace(/(\d),(\d{3})/g, "$1$2").replace(/(\d) (\d{3})\b/g, "$1$2").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

export const within = (got: number, want: number, share: number) =>
  Number.isFinite(got) && Number.isFinite(want) && Math.abs(got - want) <= Math.abs(want) * share;

// Markdown: the text under each "## Heading", keyed by the heading in lower case.
export function sections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  let cur = "";
  for (const line of md.split("\n")) {
    const h = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (h) {
      cur = h[1].toLowerCase();
      out[cur] = "";
    } else if (cur) out[cur] += line + "\n";
  }
  return out;
}

export const section = (md: string, heading: string) => sections(md)[heading.toLowerCase()];

// Real words in a section, leaving out placeholders like "(write here)" and template hints.
export function filled(body: string | undefined): boolean {
  if (!body) return false;
  const t = body
    .replace(/\(write[^)]*\)/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[-*|#>_`]/g, " ")
    .trim();
  return t.split(/\s+/).filter((w) => /\w/.test(w)).length >= 2;
}

// "- Label: value" lines. Returns the value of the first line whose label matches.
export function field(body: string | undefined, label: RegExp): string | undefined {
  for (const line of (body ?? "").split("\n")) {
    const m = line.match(/^\s*[-*]?\s*([^:]+):\s*(.*)$/);
    if (m && label.test(m[1])) return m[2].trim();
  }
  return undefined;
}

// A Markdown table as rows of { header: cell }.
export function table(body: string | undefined): Record<string, string>[] {
  const lines = (body ?? "").split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return [];
  const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const head = cells(lines[0]).map((h) => h.toLowerCase());
  return lines
    .slice(1)
    .filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l))
    .map((l) => Object.fromEntries(cells(l).map((c, i) => [head[i] ?? `col${i}`, c])));
}

// A CSV file as rows. Header names are trimmed and lower case. Empty lines are dropped.
export function csv(dir: string, name: string): { header: string[]; rows: Record<string, string>[] } {
  const t = text(dir, name);
  if (!t.trim()) return { header: [], rows: [] };
  const r = Papa.parse<Record<string, string>>(t.trim(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  const rows = r.data.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "").trim()])));
  return { header: r.meta.fields ?? [], rows };
}

// Does the text name a thing? Each thing is a list of words or phrases that count as naming it.
export const names = (t: string, any: (string | RegExp)[]) =>
  any.some((w) => (typeof w === "string" ? t.toLowerCase().includes(w) : w.test(t)));
