// map-the-actions: every action the office might give an AI, whether it reads or changes things,
// its risk, and who approves it. Every change or send names a person by role.
import type { Rule } from "../scripts/verify";
import { has, table, text } from "./lib/handin";

const MAP_FILE = "tools.md";
const COLUMNS = ["action", "reads or changes", "risk", "approval"];
const ACTIONS_NEEDED = 5;
const ROLE = /\b(officer|head|teacher|manager|staff|clerk|governor|person|team|lead|admin)/i;
const NOT_A_PERSON = /\b(ai|claude|none|nobody|automatic|auto|no one|n\/a)\b/i;

const rowsIn = (folder: string) => table(text(folder, MAP_FILE));
const kindOf = (row: Record<string, string>) => (row["reads or changes"] ?? "").toLowerCase();
const isChangeOrSend = (row: Record<string, string>) => /chang|send/.test(kindOf(row));

function namesSomeRole(row: Record<string, string>): boolean {
  const approval = row.approval ?? "";
  return ROLE.test(approval) && !NOT_A_PERSON.test(approval);
}

function everyRowHasSomeKind(folder: string): boolean {
  const rows = rowsIn(folder);
  return rows.length > 0 && rows.every((row) => /read|chang|send/.test(kindOf(row)));
}

function coversSendAndChange(folder: string): boolean {
  const kinds = rowsIn(folder).map(kindOf);
  const sends = kinds.some((kind) => kind.includes("send"));
  const changes = kinds.some((kind) => kind.includes("chang"));
  return sends && changes;
}

export default [
  {
    says: "tools.md is in the folder",
    test: (folder) => has(folder, MAP_FILE),
    tryNext: "Save tools.md in this step's problem folder.",
  },
  {
    says: "the table has the columns Action, Reads or changes, Risk and Approval",
    test: (folder) => {
      const firstRow = rowsIn(folder)[0] ?? {};
      return COLUMNS.every((column) => column in firstRow);
    },
    tryNext: "Keep the first line of the table from the starter as it is.",
  },
  {
    says: "the table lists at least five actions",
    test: (folder) =>
      rowsIn(folder).filter((row) => /\w/.test(row.action ?? "")).length >= ACTIONS_NEEDED,
    tryNext: "Add a row for each action: read, draft, send, change the register, delete.",
  },
  {
    says: "each action says if it reads, changes or sends",
    test: everyRowHasSomeKind,
    tryNext: "In Reads or changes, write reads, changes or sends.",
  },
  {
    says: "the table has at least one action that sends and one that changes",
    test: coversSendAndChange,
    tryNext: "Add sending an email to a parent, and changing the register.",
  },
  {
    says: "every action that changes or sends names a person by role in Approval",
    test: (folder) => rowsIn(folder).filter(isChangeOrSend).every(namesSomeRole),
    tryNext:
      "Write a job, such as Admissions Officer or Head teacher. The AI never approves itself.",
  },
] satisfies Rule[];
