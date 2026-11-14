// run-your-own-task: the capstone. The learner runs one task from their own work through
// a small test set. The check reads only their two files, never the course world.
// It proves the shape and that the evidence adds up.

import type { Rule } from "../scripts/verify";
import { csv, filled, has, readNumber, section, text } from "./lib/handin";

const TASK_FILE = "my-task.md";
const SET_FILE = "my-test-set.csv";
const COLUMNS = "case,right_answer,ai_answer,pass,note";
const PARTS = [
  "Task",
  "Pass rule",
  "Result",
  "Hand to AI",
  "Keep for a person",
  "What I tell people",
];
const COURSE_WORLD = /\b(harbour hill|HH-\d{4}|admissions)\b/i;

const taskText = (folder: string) => text(folder, TASK_FILE);
const rowsIn = (folder: string) => csv(folder, SET_FILE).rows;
const words = (written: string) => written.split(/\s+/).filter(Boolean).length;

function casesAreReal(folder: string): boolean {
  const rows = rowsIn(folder);
  const names = rows.map((row) => (row.case ?? "").toLowerCase());
  const filledIn = rows.every((row) => row.case && row.right_answer && row.ai_answer);
  return rows.length >= 6 && filledIn && new Set(names).size === names.length;
}

function labelsAreHonest(folder: string): boolean {
  const rows = rowsIn(folder);
  const labelled = rows.every((row) => row.pass === "yes" || row.pass === "no");
  const noHaveReasons = rows
    .filter((row) => row.pass === "no")
    .every((row) => words(row.note ?? "") >= 5);
  return rows.length > 0 && labelled && noHaveReasons;
}

// "4 of 6 passed": the first number is the yes rows, the second is every row.
function resultMatches(folder: string): boolean {
  const written = section(taskText(folder), "Result") ?? "";
  const found = written.match(/(\d+)\s*(?:of|out of|\/)\s*(\d+)/i);
  if (!found) return false;
  const rows = rowsIn(folder);
  const passed = rows.filter((row) => row.pass === "yes").length;
  return readNumber(found[1]) === passed && readNumber(found[2]) === rows.length;
}

function passRuleIsQuestion(folder: string): boolean {
  const rule = (section(taskText(folder), "Pass rule") ?? "").trim();
  return /^(does|is|are|do|did|has|have|can|will)\b/i.test(rule) && rule.endsWith("?");
}

export default [
  {
    says: "my-task.md and my-test-set.csv are in the folder",
    test: (folder) => has(folder, TASK_FILE) && has(folder, SET_FILE),
    tryNext: "Save my-task.md and my-test-set.csv in this step's problem folder.",
  },
  {
    says: "my-task.md has all six parts filled in",
    test: (folder) => PARTS.every((part) => filled(section(taskText(folder), part))),
    tryNext: "Keep the six ## headings. Write at least a short line under each one.",
  },
  {
    says: "the pass rule is a yes or no question",
    test: passRuleIsQuestion,
    tryNext: "Start with Does, Is or Are, and end with a question mark.",
  },
  {
    says: "my-test-set.csv has the columns case, right_answer, ai_answer, pass, note",
    test: (folder) => csv(folder, SET_FILE).header.join(",") === COLUMNS,
    tryNext: "Keep the first line of my-test-set.csv exactly as it is.",
  },
  {
    says: "there are 6 or more different cases, all filled in",
    test: casesAreReal,
    tryNext:
      "Add one row for each real case. Fill in the case, the right answer and the AI answer.",
  },
  {
    says: "every pass is yes or no, and every no says why in 5 or more words",
    test: labelsAreHonest,
    tryNext: "Write yes if the AI matched your right answer. For each no, say what went wrong.",
  },
  {
    says: "Result matches the count in the file",
    test: resultMatches,
    tryNext: "Count the yes rows and all the rows, then write it like 4 of 6 passed.",
  },
  {
    says: "nothing in either file is about the course school",
    test: (folder) => !COURSE_WORLD.test(`${taskText(folder)}\n${text(folder, SET_FILE)}`),
    tryNext: "Use a task from your own work. Take Harbour Hill and its forms out.",
  },
  {
    says: "Keep for a person is not the same as Hand to AI",
    test: (folder) => {
      const hand = (section(taskText(folder), "Hand to AI") ?? "").trim();
      const keep = (section(taskText(folder), "Keep for a person") ?? "").trim();
      return filled(keep) && keep !== hand;
    },
    tryNext: "Say what you would keep for a person, in words that differ from what you hand to AI.",
  },
] satisfies Rule[];
