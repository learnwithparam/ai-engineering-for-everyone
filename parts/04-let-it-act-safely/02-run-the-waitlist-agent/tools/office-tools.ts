// The office's five tools. Claude Desktop calls them through server.ts.
// Without Claude Desktop, you run them by hand with paper.ts. Both write the same two files:
// register.json (the register after each change) and action-log.jsonl (one line per tool call).
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RegisterRow } from "../../../../world/lib/state";

const STEP_FOLDER = join(import.meta.dir, "..");
const COURSE_FOLDER = join(STEP_FOLDER, "..", "..", "..");
const SEED_REGISTER = join(COURSE_FOLDER, "world", "seed", "register.json");

// The tools write into run-the-waitlist-agent's problem folder unless told otherwise.
export const DEFAULT_FOLDER = join(STEP_FOLDER, "problem");

export const TOOL_NAMES = [
  "read_register",
  "next_on_waitlist",
  "withdraw",
  "offer_place",
  "draft_letter",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

// biome-ignore-start lint/style/useNamingConvention: these names are the tool contract's own fields
export type ToolCall = {
  tool: ToolName;
  applicant_id?: string;
  from_email?: string;
  approved_by?: string | null;
  text?: string;
};
// biome-ignore-end lint/style/useNamingConvention: end of the tool contract's fields

export type Outcome = { result: "ok" | "refused"; message: string };
type Register = { applicants: RegisterRow[] } & Record<string, unknown>;

function registerIn(folder: string): Register {
  const file = join(folder, "register.json");
  const source = existsSync(file) ? file : SEED_REGISTER;
  return JSON.parse(readFileSync(source, "utf8"));
}

function saveRegister(folder: string, register: Register): void {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "register.json"), `${JSON.stringify(register, null, 2)}\n`);
}

function logCall(folder: string, call: ToolCall, outcome: Outcome): void {
  const line = {
    at: new Date().toISOString(),
    tool: call.tool,
    // biome-ignore lint/style/useNamingConvention: the action log's own field name
    applicant_id: call.applicant_id ?? null,
    // biome-ignore lint/style/useNamingConvention: the action log's own field name
    approved_by: approverOf(call),
    result: outcome.result,
  };
  mkdirSync(folder, { recursive: true });
  appendFileSync(join(folder, "action-log.jsonl"), `${JSON.stringify(line)}\n`);
}

// A name counts only if it has real letters in it. "", " " and null are not a person.
function approverOf(call: ToolCall): string | null {
  const name = (call.approved_by ?? "").trim();
  if (/[a-z]/i.test(name)) return name;
  return null;
}

function findApplicant(register: Register, applicantId: string | undefined) {
  const wanted = (applicantId ?? "").trim().toUpperCase();
  return register.applicants.find((applicant) => applicant.applicant_id === wanted);
}

const refused = (message: string): Outcome => ({ result: "refused", message });
const done = (message: string): Outcome => ({ result: "ok", message });

// The order in section 4 of the 2027 policy. A lower number comes first.
const CLAUSE_ORDER: Record<string, number> = { "3.4": 0, "4.1": 1, "4.2": 2, "4.3": 3, "4.4": 4 };

function comesFirst(first: RegisterRow, second: RegisterRow): number {
  const byClause = (CLAUSE_ORDER[first.clause] ?? 9) - (CLAUSE_ORDER[second.clause] ?? 9);
  if (byClause !== 0) return byClause;
  return (first.distance_km ?? 99) - (second.distance_km ?? 99);
}

// Clause 7.2: the list is kept in policy order. A rule sorts it, never the AI.
function sortTheWaitingList(register: Register): void {
  const waiting = register.applicants.filter((applicant) => applicant.status === "waitlisted");
  waiting.sort(comesFirst);
  waiting.forEach((applicant, index) => {
    applicant.waitlist_position = index + 1;
  });
}

function waitingInStoredOrder(register: Register): RegisterRow[] {
  const waiting = register.applicants.filter((applicant) => applicant.waitlist_position);
  return waiting.sort(
    (first, second) => (first.waitlist_position ?? 0) - (second.waitlist_position ?? 0),
  );
}

function describe(applicant: RegisterRow): string {
  const place = applicant.waitlist_position ? `, position ${applicant.waitlist_position}` : "";
  const reason = `${applicant.criterion}, clause ${applicant.clause}`;
  const distance = `${applicant.distance_km ?? "unknown"} km`;
  const who = `${applicant.applicant_id} ${applicant.child_name}`;
  return `${who}: ${applicant.status}${place} (${reason}, ${distance})`;
}

function readRegisterTool(folder: string, call: ToolCall): Outcome {
  const register = registerIn(folder);
  if (!call.applicant_id) return done(register.applicants.map(describe).join("\n"));
  const applicant = findApplicant(register, call.applicant_id);
  if (!applicant) return refused(`There is no applicant ${call.applicant_id} in the register.`);
  return done(`${describe(applicant)}. Parent email on file: ${applicant.parent_email}`);
}

// Returns the list exactly as the register stores it. If the register is out of order,
// so is this answer: checking it against clause 7.2 is the agent's job, and the approver's.
function nextOnWaitlistTool(folder: string, call: ToolCall): Outcome {
  const waiting = waitingInStoredOrder(registerIn(folder));
  if (waiting.length === 0) return refused("The waiting list is empty.");
  call.applicant_id = waiting[0].applicant_id;
  const lines = waiting.map(describe);
  return done(`Position 1 is ${waiting[0].applicant_id}. The whole list:\n${lines.join("\n")}`);
}

// Clause 9.1: only act on a withdrawal from the email address on file.
function withdrawTool(folder: string, call: ToolCall): Outcome {
  const register = registerIn(folder);
  const applicant = findApplicant(register, call.applicant_id);
  if (!applicant) return refused(`There is no applicant ${call.applicant_id} in the register.`);
  if (!approverOf(call)) return refused("A withdrawal needs approved_by: the name of the person.");
  const sender = (call.from_email ?? "").trim().toLowerCase();
  if (sender !== applicant.parent_email.toLowerCase()) {
    return refused(
      `${sender || "No email"} is not the email on file for ${applicant.applicant_id}. ` +
        "Clause 9.1: do not act. A person contacts the family on the details we have.",
    );
  }
  applicant.status = "withdrawn";
  applicant.waitlist_position = null;
  saveRegister(folder, register);
  return done(`${applicant.applicant_id} is withdrawn. One place is free.`);
}

// Only a waiting child can be offered a place, and only with a person's name on the offer.
function offerPlaceTool(folder: string, call: ToolCall): Outcome {
  const register = registerIn(folder);
  const applicant = findApplicant(register, call.applicant_id);
  if (!applicant) return refused(`There is no applicant ${call.applicant_id} in the register.`);
  if (!approverOf(call)) return refused("An offer needs approved_by: the name of the person.");
  if (applicant.status !== "waitlisted") {
    return refused(`${applicant.applicant_id} is ${applicant.status}, not on the waiting list.`);
  }
  applicant.status = "offered";
  applicant.waitlist_position = null;
  sortTheWaitingList(register);
  saveRegister(folder, register);
  return done(`${applicant.applicant_id} is offered a place. The list is now in policy order.`);
}

// A draft only. It is saved for a person to read and sign. Nothing is sent.
function draftLetterTool(folder: string, call: ToolCall): Outcome {
  const applicant = findApplicant(registerIn(folder), call.applicant_id);
  if (!applicant) return refused(`There is no applicant ${call.applicant_id} in the register.`);
  const letter = (call.text ?? "").trim();
  if (!letter)
    return refused(
      'draft_letter needs the text of the letter. Add it as "text":"..." in the call.',
    );
  const lettersFolder = join(folder, "letters");
  mkdirSync(lettersFolder, { recursive: true });
  writeFileSync(join(lettersFolder, `${applicant.applicant_id}.md`), `${letter}\n`);
  return done(`Saved letters/${applicant.applicant_id}.md as a draft. A person signs it.`);
}

const TOOLS: Record<ToolName, (folder: string, call: ToolCall) => Outcome> = {
  // biome-ignore-start lint/style/useNamingConvention: the tool names are part of the contract
  read_register: readRegisterTool,
  next_on_waitlist: nextOnWaitlistTool,
  withdraw: withdrawTool,
  offer_place: offerPlaceTool,
  draft_letter: draftLetterTool,
  // biome-ignore-end lint/style/useNamingConvention: end of the tool names
};

// Run one tool and write its line in the action log, whether it worked or was refused.
export function runTool(folder: string, call: ToolCall): Outcome {
  const tool = TOOLS[call.tool];
  if (!tool) return refused(`There is no tool called ${call.tool}.`);
  const outcome = tool(folder, call);
  logCall(folder, call, outcome);
  return outcome;
}
