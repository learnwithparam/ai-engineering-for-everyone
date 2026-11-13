// run-the-waitlist-agent: a family withdraws, the right child is offered the place,
// and a person's name is on every change. The check reads the action log and the register.
// stop-the-wrong-action reads the same log, so its helpers are exported from here.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Rule } from "../scripts/verify";
import { has } from "./lib/handin";
import { keyJson, readRegister } from "./lib/world";

export const LOG_FILE = "action-log.jsonl";
const REGISTER_FILE = "register.json";
const TOOLS = ["read_register", "next_on_waitlist", "withdraw", "offer_place", "draft_letter"];
const CHANGES = ["withdraw", "offer_place"];

// biome-ignore-start lint/style/useNamingConvention: the action log's own field names
export type LogLine = {
  at?: string;
  tool?: string;
  applicant_id?: string | null;
  approved_by?: string | null;
  result?: string;
};
// biome-ignore-end lint/style/useNamingConvention: end of the action log's field names

// Every line of the log as an object. A line that is not JSON becomes an empty object,
// so the format rule can point at it.
export function logLines(folder: string): LogLine[] {
  const file = join(folder, LOG_FILE);
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split("\n");
  const filledLines = lines.filter((line) => line.trim());
  return filledLines.map((line) => {
    try {
      return JSON.parse(line) as LogLine;
    } catch {
      return {};
    }
  });
}

const isWellFormed = (line: LogLine) =>
  typeof line.at === "string" &&
  TOOLS.includes(line.tool ?? "") &&
  "applicant_id" in line &&
  "approved_by" in line &&
  ["ok", "refused"].includes(line.result ?? "");

export function logIsWellFormed(folder: string): boolean {
  const lines = logLines(folder);
  return lines.length > 0 && lines.every(isWellFormed);
}

// Did this tool go through for this child? A refused call changed nothing.
export function wentThrough(folder: string, tool: string, applicantId: string): boolean {
  return logLines(folder).some(
    (line) => line.tool === tool && line.applicant_id === applicantId && line.result === "ok",
  );
}

const hasApprover = (line: LogLine) => /[a-z]/i.test(line.approved_by ?? "");

function everyChangeIsApproved(folder: string): boolean {
  const changes = logLines(folder).filter(
    (line) => CHANGES.includes(line.tool ?? "") && line.result === "ok",
  );
  return changes.length > 0 && changes.every(hasApprover);
}

const waitlistKey = () => keyJson("waitlist.json");

function onlyTheRightOffer(folder: string): boolean {
  const offers = logLines(folder).filter(
    (line) => line.tool === "offer_place" && line.result === "ok",
  );
  const offeredIds = offers.map((line) => line.applicant_id);
  return offeredIds.length === 1 && offeredIds[0] === waitlistKey().next_offer;
}

export function registerIn(folder: string) {
  const file = join(folder, REGISTER_FILE);
  if (!existsSync(file)) return undefined;
  return readRegister(file);
}

function statusesChanged(folder: string): boolean {
  const applicants = registerIn(folder)?.applicants ?? [];
  const statusOf = (id: string) => applicants.find((row) => row.applicant_id === id)?.status;
  const key = waitlistKey();
  return (
    statusOf(key.withdrawal.applicant_id) === "withdrawn" && statusOf(key.next_offer) === "offered"
  );
}

// After the offer, the list is the key's policy order without the child who got the place.
function listInPolicyOrder(folder: string): boolean {
  const applicants = registerIn(folder)?.applicants ?? [];
  const waiting = applicants.filter((row) => row.status === "waitlisted");
  waiting.sort((first, second) => (first.waitlist_position ?? 0) - (second.waitlist_position ?? 0));
  const key = waitlistKey();
  const wanted = key.correct_order.filter((id: string) => id !== key.next_offer);
  const positionsCountUp = waiting.every((row, index) => row.waitlist_position === index + 1);
  const ids = waiting.map((row) => row.applicant_id);
  return positionsCountUp && ids.join(",") === wanted.join(",");
}

export default [
  {
    says: "action-log.jsonl is in the folder",
    test: (folder) => has(folder, LOG_FILE),
    tryNext:
      "Run the tools from Claude Desktop or with paper.ts. They write the log in this folder.",
  },
  {
    says: "every log line has at, tool, applicant_id, approved_by and result",
    test: logIsWellFormed,
    tryNext: "Let the tools write the log. Do not edit it by hand.",
  },
  {
    says: "the place for HH-0102 was withdrawn",
    test: (folder) => wentThrough(folder, "withdraw", waitlistKey().withdrawal.applicant_id),
    tryNext: "Withdraw HH-0102 with the email from inbox/07.md and your name as approved_by.",
  },
  {
    says: "the only offer went to HH-0137, the child first in policy order",
    test: onlyTheRightOffer,
    tryNext:
      "Position 1 is not always first by the rules. Read clause 7.2 and each child's clause. " +
      "Then delete action-log.jsonl and register.json in this folder, and try again.",
  },
  {
    says: "a letter was drafted for HH-0137",
    test: (folder) => wentThrough(folder, "draft_letter", waitlistKey().next_offer),
    tryNext: "Ask Claude to draft the offer letter for HH-0137 with the draft_letter tool.",
  },
  {
    says: "every withdraw and offer_place that went through has a name in approved_by",
    test: everyChangeIsApproved,
    tryNext: "Put the name of the person who said yes in approved_by on every change.",
  },
  {
    says: "register.json shows HH-0102 withdrawn and HH-0137 offered",
    test: statusesChanged,
    tryNext: "The tools save register.json in this folder. Run them here, not in another folder.",
  },
  {
    says: "the waiting list in register.json is in policy order",
    test: listInPolicyOrder,
    tryNext: "Let offer_place change the register. It sorts the list by the rules in section 4.",
  },
] satisfies Rule[];
