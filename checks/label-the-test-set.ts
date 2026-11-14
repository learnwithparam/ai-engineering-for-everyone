// label-the-test-set: use the pass rules to label 20 new letters in batch B,
// then explain every label that differs from the expert key.

import {
  agreement,
  coversBatch,
  everyFailHasNote,
  expertAnswers,
  isYesOrNo,
  readLabels,
  wordCount,
} from "../parts/05-measure-the-letters/labels";
import type { Rule } from "../scripts/verify";
import { csv, has } from "./lib/handin";

const TEST_SET_FILE = "test-set.csv";
const labelsIn = (folder: string) => readLabels(folder, TEST_SET_FILE);

// A label that differs from the key needs a reason, so the learner looks at each miss.
function everyMissHasReason(folder: string): boolean {
  const answers = expertAnswers("b");
  const misses = labelsIn(folder).filter((label) => answers.get(label.letter) !== label.pass);
  return misses.every((label) => wordCount(label.note) >= 5);
}

const OWN_FILE = "own-test-set.csv";
const OWN_COLUMNS = "case,right_answer,ai_answer,pass,note";
const OWN_ROWS_NEEDED = 6;

// The learner's own task, never the course world: the shape is checked, not the content.
const ownRows = (folder: string) => csv(folder, OWN_FILE).rows;

function ownCasesAreFilled(folder: string): boolean {
  const rows = ownRows(folder);
  const cases = rows.map((row) => (row.case ?? "").toLowerCase());
  const allFilled = rows.every((row) => row.case && row.right_answer && row.ai_answer);
  return rows.length >= OWN_ROWS_NEEDED && allFilled && new Set(cases).size === cases.length;
}

function ownLabelsAreHonest(folder: string): boolean {
  const rows = ownRows(folder);
  const labelled = rows.every((row) => isYesOrNo(row.pass ?? ""));
  return (
    labelled &&
    rows.filter((row) => row.pass === "no").every((row) => wordCount(row.note ?? "") >= 5)
  );
}

export default [
  {
    says: "test-set.csv is in the folder",
    test: (folder) => has(folder, TEST_SET_FILE),
    tryNext: "Save test-set.csv in this step's problem folder.",
  },
  {
    says: "the first line of test-set.csv is letter,pass,note",
    test: (folder) => csv(folder, TEST_SET_FILE).header.join(",") === "letter,pass,note",
    tryNext: "Keep the first line exactly as it was: letter,pass,note",
  },
  {
    says: "there is one row for each letter from B01 to B20",
    test: (folder) => coversBatch(labelsIn(folder), "b"),
    tryNext: "Label the letters in letters/batch-b/, named B01 to B20. Batch A was the last step.",
  },
  {
    says: "every pass cell in test-set.csv says yes or no",
    test: (folder) => labelsIn(folder).every((label) => isYesOrNo(label.pass)),
    tryNext: "Use your pass rules. If every rule says yes, write yes. If one says no, write no.",
  },
  {
    says: "every no in test-set.csv has a note of 5 or more words",
    test: (folder) => everyFailHasNote(labelsIn(folder)),
    tryNext: "For each no, write which pass rule failed and why, in one short sentence.",
  },
  {
    says: "at least 16 of your 20 labels agree with the expert key",
    test: (folder) => agreement(labelsIn(folder), "b") >= 16,
    tryNext:
      "Apply each pass rule to each letter, and check the register for names, status and " +
      "waiting list positions. A new kind of fault can show up in a new batch.",
  },
  {
    says: "every label that differs from the key has a reason of 5 or more words",
    test: everyMissHasReason,
    tryNext:
      "Open world/keys/letters-b.csv. For each letter where you disagree, write in note why " +
      "you chose your label.",
  },
  {
    says: "own-test-set.csv has the columns case, right_answer, ai_answer, pass, note",
    test: (folder) => csv(folder, OWN_FILE).header.join(",") === OWN_COLUMNS,
    tryNext: "Keep the first line of own-test-set.csv exactly as it is.",
  },
  {
    says: "own-test-set.csv has 6 or more different cases from your own work, all filled in",
    test: ownCasesAreFilled,
    tryNext:
      "Add one row for each real case from your own task. Write the right answer first, " +
      "then what the AI gave back.",
  },
  {
    says: "every pass in own-test-set.csv is yes or no, and every no says why in 5 or more words",
    test: ownLabelsAreHonest,
    tryNext: "Write yes if the AI matched your right answer. For each no, say what it got wrong.",
  },
] satisfies Rule[];
