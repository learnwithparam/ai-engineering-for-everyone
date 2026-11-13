// be-the-tool: the learner plays the office's tools by hand in a plain chat,
// writes down each tool request in order, and says where they would stop it.
import type { Rule } from "../scripts/verify";
import { filled, has, section, text } from "./lib/handin";
import { keyJson } from "./lib/world";

const NOTES_FILE = "tool-calls.md";
const TOOLS = ["read_register", "next_on_waitlist", "withdraw", "offer_place", "draft_letter"];
const CALLS_NEEDED = 3;

const notesSection = (folder: string, heading: string) =>
  section(text(folder, NOTES_FILE), heading) ?? "";

// The tool named on each list line under Tool calls, in order.
function toolsInOrder(folder: string): string[] {
  const lines = notesSection(folder, "Tool calls").split("\n");
  const listLines = lines.filter((line) => /^\s*([-*]|\d+[.)])\s+/.test(line));
  const named = listLines.map((line) => TOOLS.find((tool) => line.includes(tool)));
  return named.filter((tool): tool is string => tool !== undefined);
}

// A child is offered a place only after the free place is known and the list was read.
function sensibleOrder(folder: string): boolean {
  const tools = toolsInOrder(folder);
  const offer = tools.indexOf("offer_place");
  if (offer === -1) return false;
  const before = tools.slice(0, offer);
  return (
    before.includes("withdraw") &&
    (before.includes("read_register") || before.includes("next_on_waitlist"))
  );
}

function namesTheRightChild(folder: string): boolean {
  const firstId = notesSection(folder, "Next child").match(/HH-\d{4}/);
  return firstId?.[0] === keyJson("waitlist.json").next_offer;
}

function stopNamesSomeChange(folder: string): boolean {
  const stop = notesSection(folder, "Where I would stop it");
  return filled(stop) && /\b(withdraw|offer_place|offer|letter|send)\b/i.test(stop);
}

export default [
  {
    says: "tool-calls.md is in the folder",
    test: (folder) => has(folder, NOTES_FILE),
    tryNext: "Save tool-calls.md in this step's problem folder.",
  },
  {
    says: "Tool calls lists at least three requests, each naming one of the five tools",
    test: (folder) => toolsInOrder(folder).length >= CALLS_NEEDED,
    tryNext: "Under ## Tool calls, write one list line for each tool Claude asked you to run.",
  },
  {
    says: "the withdrawal and a look at the list come before the offer",
    test: sensibleOrder,
    tryNext: "Write the calls in the order Claude asked for them, from first to last.",
  },
  {
    says: "Next child names HH-0137, the child first in policy order",
    test: namesTheRightChild,
    tryNext:
      "Position 1 on the list is not the answer. Clause 7.2 keeps the list in policy order. " +
      "Look for a sibling (clause 4.3) lower down.",
  },
  {
    says: "Where I would stop it names the change you would check first",
    test: stopNamesSomeChange,
    tryNext: "Under ## Where I would stop it, name the call you would not let run without you.",
  },
] satisfies Rule[];
