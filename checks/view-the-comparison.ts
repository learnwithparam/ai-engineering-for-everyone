// view-the-comparison: pick a winner for every prompt in the recorded two-model table.
// The same rules back assignment/check.ts, which a grader reruns on a learner's branch.

import { hasRowPerPrompt, hasVerdict, winnersAreNamed } from "../assignment/check";
import type { Rule } from "../scripts/verify";

export default [
  {
    says: "verdict.md is in the folder",
    test: hasVerdict,
    tryNext: "Save verdict.md in this step's problem folder.",
  },
  {
    says: "verdict.md has a row for every prompt in the table",
    test: hasRowPerPrompt,
    tryNext: "Fill in the Winner cell on all six rows, HH-0116 to HH-0130.",
  },
  {
    says: "every winner is Small model, Middle model or Tie",
    test: winnersAreNamed,
    tryNext: "Write exactly Small model, Middle model or Tie under Winner.",
  },
] satisfies Rule[];
