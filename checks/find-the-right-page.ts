// find-the-right-page: for ten questions, the learner picks the document and clause
// that hold the answer, then marks where Claude's citation hit the same clause.
import type { Rule } from "../scripts/verify";
import { csv, has } from "./lib/handin";
import { keyCsv } from "./lib/world";

const RETRIEVAL_FILE = "retrieval.csv";
const COLUMNS = ["question_id", "question", "document", "clause", "claude_clause", "claude_hit"];
const MATCHES_NEEDED = 8;

type Row = Record<string, string>;

const keyRows = () => keyCsv("retrieval.csv");

function rowFor(folder: string, questionId: string): Row | undefined {
  const wanted = questionId.toUpperCase();
  const rows = csv(folder, RETRIEVAL_FILE).rows;
  return rows.find((row) => row.question_id?.toUpperCase() === wanted);
}

// "policy/appeals-guide.md", "appeals-guide.md" and "Appeals-guide.md" are the same document.
const documentName = (written: string | undefined) =>
  (written ?? "").trim().toLowerCase().replace(/^.*\//, "");

const clauseIn = (written: string | undefined) =>
  (written ?? "")
    .replace(/clause/i, "")
    .trim()
    .toUpperCase();

function picksMatchingTheKey(folder: string): number {
  const matching = keyRows().filter((keyRow) => {
    const row = rowFor(folder, keyRow.question_id);
    const sameDocument = documentName(row?.document) === keyRow.document;
    return sameDocument && clauseIn(row?.clause) === keyRow.clause;
  });
  return matching.length;
}

// claude_hit is yes exactly when Claude cited the clause the answer is in.
function hitsAreHonest(folder: string): boolean {
  return keyRows().every((keyRow) => {
    const row = rowFor(folder, keyRow.question_id);
    const hit = (row?.claude_hit ?? "").toLowerCase();
    if (!row?.claude_clause?.trim() || !["yes", "no"].includes(hit)) return false;
    const claudeWasRight = clauseIn(row.claude_clause) === keyRow.clause;
    return (hit === "yes") === claudeWasRight;
  });
}

export default [
  {
    says: "retrieval.csv is in the folder",
    test: (folder) => has(folder, RETRIEVAL_FILE),
    tryNext: "Save retrieval.csv in this step's problem folder.",
  },
  {
    says: "the first line is the six column names, in order",
    test: (folder) => csv(folder, RETRIEVAL_FILE).header.join(",") === COLUMNS.join(","),
    tryNext: "Keep the first line of the starter file as it is.",
  },
  {
    says: "there is a row for each of the ten questions, R1 to R10",
    test: (folder) => keyRows().every((keyRow) => rowFor(folder, keyRow.question_id)),
    tryNext: "Keep all ten rows from the starter. Fill in the empty cells.",
  },
  {
    says: "your document and clause match the answer key on at least 8 of 10",
    test: (folder) => picksMatchingTheKey(folder) >= MATCHES_NEEDED,
    tryNext:
      "Some answers are in the appeals guide or the key dates, not in the policy. " +
      "Check the document as well as the clause.",
  },
  {
    says: "claude_hit is yes only where Claude cited the right clause",
    test: hitsAreHonest,
    tryNext:
      "Write the clause Claude quoted in claude_clause. " +
      "Write yes in claude_hit only if it is the clause that holds the answer.",
  },
] satisfies Rule[];
