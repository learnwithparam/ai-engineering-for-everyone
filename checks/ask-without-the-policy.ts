// ask-without-the-policy: five parent questions asked with no documents,
// and the learner's own mark of which answers were right.
// load-the-policy-project reads the same file, so its helpers are exported from here.
import type { Rule } from "../scripts/verify";
import { csv, filled, has } from "./lib/handin";
import { keyCsv } from "./lib/world";

export const ANSWERS_FILE = "answers.csv";
const WRONG_ANSWERS_EXPECTED = 3;

type Row = Record<string, string>;

export const questionIds = () => keyCsv("questions.csv").map((row) => row.question_id);
export const answerRows = (folder: string): Row[] => csv(folder, ANSWERS_FILE).rows;

export function answerFor(folder: string, questionId: string): Row | undefined {
  const wanted = questionId.toUpperCase();
  return answerRows(folder).find((row) => row.question_id?.toUpperCase() === wanted);
}

// Run a test on the learner's row for every question. A missing row fails.
export function everyQuestion(folder: string, test: (row: Row) => boolean): boolean {
  return questionIds().every((questionId) => {
    const row = answerFor(folder, questionId);
    return row !== undefined && test(row);
  });
}

export const hasColumns = (folder: string, columns: string[]) =>
  columns.every((column) => csv(folder, ANSWERS_FILE).header.includes(column));

const markedYesOrNo = (row: Row) => ["yes", "no"].includes((row.right ?? "").toLowerCase());

function markedWrong(folder: string): number {
  const marks = answerRows(folder).map((row) => (row.right ?? "").toLowerCase());
  return marks.filter((mark) => mark === "no").length;
}

export default [
  {
    says: "answers.csv is in the folder",
    test: (folder) => has(folder, ANSWERS_FILE),
    tryNext: "Save answers.csv in this step's problem folder.",
  },
  {
    says: "it has the columns question_id, question, without_policy and right",
    test: (folder) => hasColumns(folder, ["question_id", "question", "without_policy", "right"]),
    tryNext: "Keep the first line of the starter file as it is.",
  },
  {
    says: "there is an answer from Claude for each of Q1 to Q5",
    test: (folder) => everyQuestion(folder, (row) => filled(row.without_policy)),
    tryNext: "Paste Claude's answer for each question into the without_policy column.",
  },
  {
    says: "each answer is marked yes or no in the right column",
    test: (folder) => everyQuestion(folder, markedYesOrNo),
    tryNext: "Read each answer next to the 2027 policy. Write yes if it is right, no if not.",
  },
  {
    says: "at least three answers are marked no",
    test: (folder) => markedWrong(folder) >= WRONG_ANSWERS_EXPECTED,
    tryNext:
      "Check each answer against the clause in the policy. " +
      "Claude cannot know this school's own rules, so most answers miss something.",
  },
] satisfies Rule[];
