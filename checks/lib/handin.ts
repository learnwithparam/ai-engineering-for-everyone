// Read the files a learner hands in. A check reads files, never the chat.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";

export const has = (folder: string, name: string) => existsSync(join(folder, name));

// The text of a handed-in file, or "" if it is missing.
// Windows editors may add a byte-order mark and \r\n line endings, so both are removed.
export function text(folder: string, name: string): string {
  const path = join(folder, name);
  if (!existsSync(path)) return "";
  const raw = readFileSync(path, "utf8");
  return raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
}

// A number as people write it: "$1,234.50", "1 200", "0.0036", "about 2,400 tokens".
// NaN if there is none.
export function readNumber(written: string | undefined): number {
  if (!written) return NaN;
  const withoutCommas = written.replace(/(\d),(\d{3})/g, "$1$2");
  const withoutSpaces = withoutCommas.replace(/(\d) (\d{3})\b/g, "$1$2");
  const found = withoutSpaces.match(/-?\d+(\.\d+)?/);
  if (!found) return NaN;
  return Number(found[0]);
}

// Is got close enough to want? share is how far off it may be, for example 0.1 for 10%.
export function within(got: number, want: number, share: number): boolean {
  if (!Number.isFinite(got) || !Number.isFinite(want)) return false;
  return Math.abs(got - want) <= Math.abs(want) * share;
}

// Markdown: the text under each "## Heading", keyed by the heading in lower case.
export function sections(markdown: string): Record<string, string> {
  const found: Record<string, string> = {};
  let current = "";
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].toLowerCase();
      found[current] = "";
    } else if (current) {
      found[current] += `${line}\n`;
    }
  }
  return found;
}

export function section(markdown: string, heading: string): string | undefined {
  return sections(markdown)[heading.toLowerCase()];
}

// Real words in a section, leaving out placeholders like "(write here)" and template hints.
export function filled(body: string | undefined): boolean {
  if (!body) return false;
  const withoutPlaceholders = body.replace(/\(write[^)]*\)/gi, "");
  const withoutComments = withoutPlaceholders.replace(/<!--[\s\S]*?-->/g, "");
  const words = withoutComments.replace(/[-*|#>_`]/g, " ").trim();
  const realWords = words.split(/\s+/).filter((word) => /\w/.test(word));
  return realWords.length >= 2;
}

// "- Label: value" lines. Returns the value of the first line whose label matches.
export function field(body: string | undefined, label: RegExp): string | undefined {
  for (const line of (body ?? "").split("\n")) {
    const labelled = line.match(/^\s*[-*]?\s*([^:]+):\s*(.*)$/);
    if (labelled && label.test(labelled[1])) return labelled[2].trim();
  }
  return undefined;
}

// The cells of one Markdown table line: "| a | b |" gives ["a", "b"].
function cellsOf(line: string): string[] {
  const inner = line.trim().replace(/^\||\|$/g, "");
  return inner.split("|").map((cell) => cell.trim());
}

// A Markdown table as rows of { header: cell }.
export function table(body: string | undefined): Record<string, string>[] {
  const allLines = (body ?? "").split("\n");
  const lines = allLines.filter((line) => line.trim().startsWith("|"));
  if (lines.length < 2) return [];
  const headers = cellsOf(lines[0]).map((header) => header.toLowerCase());
  // The line of dashes under the headers is not a row.
  const rowLines = lines.slice(1).filter((line) => !/^\s*\|?\s*:?-{2,}/.test(line));
  return rowLines.map((line) => {
    const cells = cellsOf(line).map((cell, i) => [headers[i] ?? `col${i}`, cell]);
    return Object.fromEntries(cells);
  });
}

// A CSV file as rows. Header names are trimmed and lower case. Empty lines are dropped.
export function csv(
  folder: string,
  name: string,
): { header: string[]; rows: Record<string, string>[] } {
  const content = text(folder, name).trim();
  if (!content) return { header: [], rows: [] };
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  const rows = parsed.data.map((row) => {
    const cells = Object.entries(row).map(([header, cell]) => [header, String(cell ?? "").trim()]);
    return Object.fromEntries(cells);
  });
  return { header: parsed.meta.fields ?? [], rows };
}

// Does the text name a thing? ways is the list of words or patterns that count as naming it.
export function names(written: string, ways: (string | RegExp)[]): boolean {
  return ways.some((way) => {
    if (typeof way === "string") return written.toLowerCase().includes(way);
    return way.test(written);
  });
}
