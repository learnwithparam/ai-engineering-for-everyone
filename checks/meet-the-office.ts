// meet-the-office: the learner ran the finished office and wrote down who they are and what it flagged.
import type { Rule } from "../scripts/verify";
import { filled, has, section, text } from "./lib/handin";
import { officeFlags } from "./lib/runs";

const F = "about-me.md";
const md = (d: string) => text(d, F);
const PLANS = /\b(free|pro|max|ultra|team|enterprise)\b/i;

export default [
  {
    says: "about-me.md is in the folder",
    test: (d) => has(d, F),
    tryNext: "Save about-me.md in this step's problem folder.",
  },
  {
    says: "Plan names your Claude plan",
    test: (d) => PLANS.test((section(md(d), "Plan") ?? "").replace(/\(write[^)]*\)/gi, "")),
    tryNext: "Under ## Plan, write the plan you use: Free, Pro, Max, Ultra, Team or Enterprise.",
  },
  {
    says: "Role says what you do",
    test: (d) => filled(section(md(d), "Role")),
    tryNext: "Under ## Role, write your job in a few words.",
  },
  {
    says: "A task I want help with names one task",
    test: (d) => filled(section(md(d), "A task I want help with")),
    tryNext: "Under ## A task I want help with, write one real task from your work.",
  },
  {
    says: "What the office flagged lists the forms the office flagged, and no others",
    test: async (d) => {
      const got = new Set(
        (section(md(d), "What the office flagged") ?? "").match(/HH-\d{4}/g) ?? [],
      );
      const want = await officeFlags();
      return got.size === want.length && want.every((id) => got.has(id));
    },
    tryNext:
      "Run bun run office and copy the form numbers from its last line into ## What the office flagged.",
  },
] satisfies Rule[];
