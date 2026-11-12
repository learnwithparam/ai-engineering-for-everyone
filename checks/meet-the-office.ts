// meet-the-office: the learner ran the finished office
// and wrote down who they are and what it flagged.
import type { Rule } from "../scripts/verify";
import { filled, has, section, text } from "./lib/handin";
import { officeFlags } from "./lib/runs";

const ANSWER_FILE = "about-me.md";
const PLANS = /\b(free|pro|max|ultra|team|enterprise)\b/i;

const answerIn = (folder: string) => text(folder, ANSWER_FILE);

function namesThePlan(folder: string): boolean {
  const plan = section(answerIn(folder), "Plan") ?? "";
  const withoutPlaceholder = plan.replace(/\(write[^)]*\)/gi, "");
  return PLANS.test(withoutPlaceholder);
}

// The form numbers the learner wrote must be exactly the ones the office flags.
async function listsTheFlags(folder: string): Promise<boolean> {
  const written = section(answerIn(folder), "What the office flagged") ?? "";
  const got = new Set(written.match(/HH-\d{4}/g) ?? []);
  const want = await officeFlags();
  return got.size === want.length && want.every((id) => got.has(id));
}

export default [
  {
    says: "about-me.md is in the folder",
    test: (folder) => has(folder, ANSWER_FILE),
    tryNext: "Save about-me.md in this step's problem folder.",
  },
  {
    says: "Plan names your Claude plan",
    test: namesThePlan,
    tryNext: "Under ## Plan, write the plan you use: Free, Pro, Max, Ultra, Team or Enterprise.",
  },
  {
    says: "Role says what you do",
    test: (folder) => filled(section(answerIn(folder), "Role")),
    tryNext: "Under ## Role, write your job in a few words.",
  },
  {
    says: "A task I want help with names one task",
    test: (folder) => filled(section(answerIn(folder), "A task I want help with")),
    tryNext: "Under ## A task I want help with, write one real task from your work.",
  },
  {
    says: "What the office flagged lists the forms the office flagged, and no others",
    test: listsTheFlags,
    tryNext:
      "Run bun run office and copy the form numbers from its last line " +
      "into ## What the office flagged.",
  },
] satisfies Rule[];
