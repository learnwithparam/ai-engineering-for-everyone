// find-the-right-page: for ten questions, the learner picks the document and clause
// that hold the answer, then marks where Claude's citation hit the same clause.
import type { Rule } from "../scripts/verify";
import { csv, filled, has, section, text } from "./lib/handin";
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

const HABITS_FILE = "checking-habits.md";

// The questions the learner marked as a miss in retrieval.csv, like R7.
function missedQuestions(folder: string): string[] {
  const rows = csv(folder, RETRIEVAL_FILE).rows;
  const misses = rows.filter((row) => (row.claude_hit ?? "").toLowerCase() === "no");
  return misses.map((row) => (row.question_id ?? "").toUpperCase());
}

// Checking habits: the write-up must name the real misses, not a guess.
function namesTheMisses(folder: string): boolean {
  const written = (section(text(folder, HABITS_FILE), "Where Claude missed") ?? "").toUpperCase();
  const misses = missedQuestions(folder);
  return misses.length > 0 && misses.every((id) => new RegExp(`\\b${id}\\b`).test(written));
}

function ruleIsReal(folder: string): boolean {
  const rule = section(text(folder, HABITS_FILE), "My rule for when to check") ?? "";
  const words = rule
    .replace(/\(write[^)]*\)/gi, "")
    .split(/\s+/)
    .filter(Boolean);
  return words.length >= 8;
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
  {
    says: "checking-habits.md names each question where Claude missed",
    test: namesTheMisses,
    tryNext:
      "Open retrieval.csv. List every question where claude_hit is no, like R7, under " +
      "## Where Claude missed.",
  },
  {
    says: "checking-habits.md says how you caught the miss",
    test: (folder) => filled(section(text(folder, HABITS_FILE), "How I caught it")),
    tryNext: "Under ## How I caught it, say what you did that showed the answer was wrong.",
  },
  {
    says: "checking-habits.md has your own rule for when to check, in a full sentence",
    test: ruleIsReal,
    tryNext: "Under ## My rule for when to check, write one rule of 8 words or more.",
  },
] satisfies Rule[];
