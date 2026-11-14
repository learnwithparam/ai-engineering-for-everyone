// catch-the-stale-policy: last year's policy in the Project gives wrong answers.
// The learner names the two clauses that changed and takes the old file out of the Project.
import type { Rule } from "../scripts/verify";
import { filled, has, names, section, text } from "./lib/handin";

const STALE_FILE = "stale.md";
const SECTIONS = ["What changed", "What Claude said", "The fix"];
const CHANGED_CLAUSES = ["4.3", "5.2"];

const notesIn = (folder: string) => text(folder, STALE_FILE);
const sectionIn = (folder: string, heading: string) => section(notesIn(folder), heading) ?? "";

function namesBothClauses(folder: string): boolean {
  const changed = sectionIn(folder, "What changed");
  return CHANGED_CLAUSES.every((clause) =>
    new RegExp(`\\b${clause.replace(".", "\\.")}\\b`).test(changed),
  );
}

// The fix must take the old file out of the Project. A label is not enough: Claude still reads a
// labelled file, so it can still quote it.
const REMOVE_WORDS = [/\b(remove|removed|delete|deleted|take out|took out|taken out)\b/i];

export default [
  {
    says: "stale.md is in the folder",
    test: (folder) => has(folder, STALE_FILE),
    tryNext: "Save stale.md in this step's problem folder.",
  },
  {
    says: "it has the sections What changed, What Claude said and The fix, each filled in",
    test: (folder) => SECTIONS.every((heading) => filled(sectionIn(folder, heading))),
    tryNext: "Keep the three ## headings from the starter and write under each one.",
  },
  {
    says: "What changed names both clauses that differ: 4.3 and 5.2",
    test: namesBothClauses,
    tryNext: "Compare clause 4.3 and clause 5.2 in the two policies. Name both numbers.",
  },
  {
    says: "The fix removes the old policy from the Project",
    test: (folder) => names(sectionIn(folder, "The fix"), REMOVE_WORDS),
    tryNext: "A label is not enough, Claude still reads the old file. Remove the 2026 file.",
  },
] satisfies Rule[];
