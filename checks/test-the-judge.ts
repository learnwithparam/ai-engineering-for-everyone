// test-the-judge: Claude labels the 20 test letters with your pass rules.
// You count how often it agrees with you and say who was right each time it did not.

import {
  coversBatch,
  expertAnswers,
  isYesOrNo,
  type Label,
  readLabels,
} from "../parts/05-measure-the-letters/labels";
import type { Rule } from "../scripts/verify";
import { csv, filled, has, section, table, text } from "./lib/handin";

const TEST_SET_FILE = "test-set.csv";
const JUDGE_FILE = "judge.md";

const labelsIn = (folder: string) => readLabels(folder, TEST_SET_FILE);
const judgeOf = (label: Label) => (label.row.judge ?? "").toLowerCase();
const judgeNotes = (folder: string) => text(folder, JUDGE_FILE);

function lettersWhereJudgeDiffers(folder: string): string[] {
  const differing = labelsIn(folder).filter((label) => judgeOf(label) !== label.pass);
  return differing.map((label) => label.letter);
}

// The count written under Agreement, for example "17 of 20".
function statedAgreement(folder: string): number {
  const written = section(judgeNotes(folder), "Agreement") ?? "";
  const found = written.match(/(\d+)\s*(of|out of|\/)\s*20\b/i);
  return found ? Number(found[1]) : NaN;
}

function disagreementRows(folder: string): Record<string, string>[] {
  const rows = table(section(judgeNotes(folder), "Disagreements"));
  return rows.filter((row) => /\b[AB]\d{2}\b/i.test(row.letter ?? ""));
}

function listsEveryDisagreement(folder: string): boolean {
  const listed = disagreementRows(folder).map((row) => (row.letter ?? "").toUpperCase().trim());
  const differing = lettersWhereJudgeDiffers(folder);
  const sameCount = listed.length === differing.length;
  return sameCount && differing.every((letter) => listed.includes(letter));
}

// The first word names who was right: "Me" or "I" means the learner,
// "Claude", "judge" or "AI" means the judge. The rest of the cell can explain why.
function whoTheyNamed(cell: string): "learner" | "judge" | "" {
  const firstWord = cell.trim().split(/[\s.,:;]+/)[0] ?? "";
  if (/^(you|me|i|mine|myself)$/i.test(firstWord)) return "learner";
  if (/^(claude|judge|ai|the)$/i.test(firstWord)) return "judge";
  return "";
}

function namesWhoWasRight(folder: string): boolean {
  const answers = expertAnswers("b");
  const labels = labelsIn(folder);
  const rows = disagreementRows(folder);
  return rows.every((row) => {
    const letter = (row.letter ?? "").toUpperCase().trim();
    const label = labels.find((candidate) => candidate.letter === letter);
    if (!label) return false;
    const rightOne = answers.get(letter) === label.pass ? "learner" : "judge";
    return whoTheyNamed(row["who was right"] ?? "") === rightOne;
  });
}

function countsMatch(folder: string): boolean {
  const labels = labelsIn(folder);
  const agreeing = labels.filter((label) => judgeOf(label) === label.pass).length;
  return labels.length === 20 && statedAgreement(folder) === agreeing;
}

export default [
  {
    says: "test-set.csv from label-the-test-set is in the folder",
    test: (folder) => coversBatch(labelsIn(folder), "b"),
    tryNext: "Copy your test-set.csv from the label-the-test-set problem folder into this one.",
  },
  {
    says: "test-set.csv has a judge column with yes or no on every row",
    test: (folder) =>
      csv(folder, TEST_SET_FILE).header.includes("judge") &&
      labelsIn(folder).every((label) => isYesOrNo(judgeOf(label))),
    tryNext: "Add ,judge to the first line. Then add Claude's yes or no at the end of each row.",
  },
  {
    says: "judge.md is in the folder",
    test: (folder) => has(folder, JUDGE_FILE),
    tryNext: "Save judge.md in this step's problem folder.",
  },
  {
    says: "The judge prompt shows what you gave Claude",
    test: (folder) => filled(section(judgeNotes(folder), "The judge prompt")),
    tryNext: "Under ## The judge prompt, paste the words you gave Claude, with your pass rules.",
  },
  {
    says: "Agreement gives a count of 20 that matches your judge column",
    test: countsMatch,
    tryNext: "Count the rows where pass and judge are the same. Write it like: 17 of 20.",
  },
  {
    says: "Disagreements lists every letter where Claude and you differ, and no others",
    test: listsEveryDisagreement,
    tryNext:
      "Add one table row for each letter where your pass and Claude's judge are not the same.",
  },
  {
    says: "each disagreement says who was right, and matches the expert key",
    test: (folder) => disagreementRows(folder).length > 0 && namesWhoWasRight(folder),
    tryNext:
      "Look up each letter in world/keys/letters-b.csv. Write me or Claude in Who was right.",
  },
] satisfies Rule[];
