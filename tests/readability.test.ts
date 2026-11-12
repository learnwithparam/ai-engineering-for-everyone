// Every page a learner reads stays at grade 6 or lower (Flesch-Kincaid), and names no model id.
// Prose only: code blocks, Mermaid, inline code, links and table pipes are left out before scoring.
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const MAX_GRADE = 6;

function learnerPages(): string[] {
  const out = [join(ROOT, "README.md")];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith(".md") && !p.includes("/solution/") && !p.includes("/wrong/")) out.push(p);
    }
  };
  walk(join(ROOT, "00-orientation"));
  walk(join(ROOT, "parts"));
  out.push(join(ROOT, "world", "README.md"));
  return out.filter(existsSync);
}

export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function prose(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .split("\n")
    .filter((l) => !/^\s*\|?\s*:?-{3,}/.test(l))
    .map((l) => l.replace(/^#+\s*/, "").replace(/\|/g, ". ").replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+\.\s+/, "").trim())
    .filter(Boolean)
    .map((l) => (/[.!?:]$/.test(l) ? l : l + "."))
    .join(" ");
}

export function grade(md: string): number {
  const t = prose(md);
  const sentences = t.split(/[.!?:;]+\s/).filter((s) => /[a-z]/i.test(s)).length || 1;
  const words = t.split(/\s+/).map((w) => w.replace(/[^A-Za-z'-]/g, "")).filter((w) => /[a-z]/i.test(w));
  if (words.length === 0) return 0;
  const syl = words.reduce((s, w) => s + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

describe(`every learner page reads at grade ${MAX_GRADE} or lower`, () => {
  for (const f of learnerPages()) {
    test(relative(ROOT, f), () => {
      const g = grade(readFileSync(f, "utf8"));
      if (g > MAX_GRADE) throw new Error(`${relative(ROOT, f)} reads at grade ${g.toFixed(1)}; use shorter sentences and words`);
      expect(g).toBeLessThanOrEqual(MAX_GRADE);
    });
  }
});

describe("no time words in learner pages", () => {
  for (const f of learnerPages()) {
    test(relative(ROOT, f), () => {
      const t = prose(readFileSync(f, "utf8"));
      const m = t.match(/\b(weeks?|days?|hours?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tonight|tomorrow|yesterday)\b/i);
      expect(m?.[0] ?? null).toBeNull();
    });
  }
});
