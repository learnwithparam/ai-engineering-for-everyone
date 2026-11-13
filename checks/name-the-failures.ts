// name-the-failures: group the no letters into 2 to 5 failure modes, count each,
// and write one yes or no pass rule per mode.

import { readLabels, wordCount } from "../parts/05-measure-the-letters/labels";
import type { Rule } from "../scripts/verify";
import { has, readNumber, section, table, text } from "./lib/handin";

const MODES_FILE = "failure-modes.md";
const NOTES_FILE = "letter-notes.csv";
const QUESTION_START = /^(is|are|does|do|did|has|have|can|will)\b/i;
const SCORE_WORDS = /\b(1 to 5|1-5|out of|score|rate|rating|scale)\b/i;

type Mode = { name: string; count: number; passRule: string };

// The rows of the Failure modes table that have a name filled in.
function modesIn(folder: string): Mode[] {
  const rows = table(section(text(folder, MODES_FILE), "Failure modes"));
  const modes = rows.map((row) => ({
    name: row["failure mode"] ?? "",
    count: readNumber(row.count),
    passRule: (row["pass rule"] ?? "").replace(/[*_`]/g, "").trim(),
  }));
  // A name like "(write here)" is the starter's placeholder, not a mode.
  return modes.filter((mode) => /\w{3,}/.test(mode.name.replace(/\(write[^)]*\)/gi, "")));
}

function noRows(folder: string): number {
  const labels = readLabels(folder, NOTES_FILE);
  return labels.filter((label) => label.pass === "no").length;
}

function countsAddUp(folder: string): boolean {
  const modes = modesIn(folder);
  const total = modes.reduce((sum, mode) => sum + mode.count, 0);
  return modes.length > 0 && total === noRows(folder);
}

function isYesOrNoQuestion(passRule: string): boolean {
  const asksQuestion = QUESTION_START.test(passRule) && passRule.endsWith("?");
  return asksQuestion && wordCount(passRule) >= 5;
}

export default [
  {
    says: "failure-modes.md is in the folder",
    test: (folder) => has(folder, MODES_FILE),
    tryNext: "Save failure-modes.md in this step's problem folder.",
  },
  {
    says: "letter-notes.csv from read-twenty-outputs is in the folder",
    test: (folder) => noRows(folder) > 0,
    tryNext:
      "Copy your letter-notes.csv from the read-twenty-outputs problem folder into this one.",
  },
  {
    says: "the Failure modes table has 2 to 5 modes",
    test: (folder) => modesIn(folder).length >= 2 && modesIn(folder).length <= 5,
    tryNext: "Group your notes. Letters with the same kind of problem share one mode.",
  },
  {
    says: "every mode has a count of 1 or more",
    test: (folder) =>
      modesIn(folder).every((mode) => Number.isInteger(mode.count) && mode.count > 0),
    tryNext: "In the Count column, write how many no letters fall under that mode, like 2.",
  },
  {
    says: "the counts add up to the no rows in letter-notes.csv",
    test: countsAddUp,
    tryNext: "Count the no rows in letter-notes.csv. Each one goes under exactly one mode.",
  },
  {
    says: "every pass rule is a yes or no question",
    test: (folder) => modesIn(folder).every((mode) => isYesOrNoQuestion(mode.passRule)),
    tryNext:
      "Write each rule as a question a stranger can answer yes or no, for example: " +
      "Does every clause number exist in the 2027 policy?",
  },
  {
    says: "no pass rule asks for a score",
    test: (folder) => modesIn(folder).every((mode) => !SCORE_WORDS.test(mode.passRule)),
    tryNext:
      "Two people agree on yes or no far more often than on a score from 1 to 5. Drop scores.",
  },
] satisfies Rule[];
