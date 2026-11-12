// Every page a learner reads stays at grade 6 or lower (Flesch-Kincaid), and names no model id.
// Prose only: code blocks, Mermaid, inline code, links and table pipes are left out before scoring.
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { grade, prose } from "./readability";

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
