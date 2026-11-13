// load-the-policy-project: the same five questions, asked again in a Claude Project
// that holds this year's policy. Every answer cites a clause that exists.
import type { Rule } from "../scripts/verify";
import { ANSWERS_FILE, answerFor, everyQuestion, hasColumns } from "./ask-without-the-policy";
import { filled, has } from "./lib/handin";
import { keyCsv, worldFile } from "./lib/world";

const MATCHES_NEEDED = 4;

// The clause numbers in this year's policy, such as 4.3, read from lines like "4.3 **Siblings.**".
export function policyClauses(): Set<string> {
  const policy = worldFile("policy/admissions-policy-2027.md");
  const numbers = [...policy.matchAll(/^(\d+\.\d+) /gm)].map((match) => match[1]);
  return new Set(numbers);
}

// "clause 4.3", "4.3" and " 4.3 " all mean 4.3.
const clauseIn = (written: string | undefined) => (written ?? "").replace(/clause/i, "").trim();

function everyClauseExists(folder: string): boolean {
  const clauses = policyClauses();
  return everyQuestion(folder, (row) => clauses.has(clauseIn(row.clause)));
}

function clausesMatchingTheKey(folder: string): number {
  const keyRows = keyCsv("questions.csv");
  const matching = keyRows.filter((keyRow) => {
    const row = answerFor(folder, keyRow.question_id);
    return clauseIn(row?.clause) === keyRow.clause;
  });
  return matching.length;
}

export default [
  {
    says: "answers.csv is in the folder",
    test: (folder) => has(folder, ANSWERS_FILE),
    tryNext: "Use the answers.csv in this folder, or copy yours in from ask-without-the-policy.",
  },
  {
    says: "it has the new columns with_project and clause",
    test: (folder) => hasColumns(folder, ["with_project", "clause"]),
    tryNext: "Add ,with_project,clause to the end of the first line.",
  },
  {
    says: "there is an answer from the Project for each of Q1 to Q5",
    test: (folder) => everyQuestion(folder, (row) => filled(row.with_project)),
    tryNext: "Ask each question in your Project. Paste the answer into the with_project column.",
  },
  {
    says: "every clause is a clause that exists in the 2027 policy",
    test: everyClauseExists,
    tryNext:
      "Write the clause as a number like 4.3. " +
      "Find it in policy/admissions-policy-2027.md before you write it down.",
  },
  {
    says: "at least 4 of the 5 clauses match the answer key",
    test: (folder) => clausesMatchingTheKey(folder) >= MATCHES_NEEDED,
    tryNext:
      "Read the clause Claude quoted. Does it answer the question? If not, find the one that does.",
  },
] satisfies Rule[];
