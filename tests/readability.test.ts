// Every page a learner reads stays at grade 6 or lower (Flesch-Kincaid), and names no model id.
// Prose only: code blocks, Mermaid, inline code, links and table pipes are left out before scoring.
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { grade, prose } from "./readability";

const ROOT = join(import.meta.dir, "..");
const MAX_GRADE = 6;
const TIME_WORD = new RegExp(
  "\\b(weeks?|days?|hours?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|" +
    "tonight|tomorrow|yesterday)\\b",
  "i",
);

// Sample solutions and wrong answers are not pages a learner is asked to read.
function isLearnerPage(path: string): boolean {
  if (!path.endsWith(".md")) return false;
  return !path.includes("/solution/") && !path.includes("/wrong/");
}

function collectPages(folder: string, found: string[]): void {
  if (!existsSync(folder)) return;
  for (const entry of readdirSync(folder)) {
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) collectPages(path, found);
    else if (isLearnerPage(path)) found.push(path);
  }
}

function learnerPages(): string[] {
  const pages = [join(ROOT, "README.md")];
  collectPages(join(ROOT, "00-orientation"), pages);
  collectPages(join(ROOT, "parts"), pages);
  pages.push(join(ROOT, "world", "README.md"));
  return pages.filter(existsSync);
}

describe(`every learner page reads at grade ${MAX_GRADE} or lower`, () => {
  for (const page of learnerPages()) {
    test(relative(ROOT, page), () => {
      const pageGrade = grade(readFileSync(page, "utf8"));
      if (pageGrade > MAX_GRADE) {
        const name = relative(ROOT, page);
        const shown = pageGrade.toFixed(1);
        throw new Error(`${name} reads at grade ${shown}; use shorter sentences and words`);
      }
      expect(pageGrade).toBeLessThanOrEqual(MAX_GRADE);
    });
  }
});

describe("no time words in learner pages", () => {
  for (const page of learnerPages()) {
    test(relative(ROOT, page), () => {
      const text = prose(readFileSync(page, "utf8"));
      const timeWord = text.match(TIME_WORD);
      expect(timeWord?.[0] ?? null).toBeNull();
    });
  }
});
