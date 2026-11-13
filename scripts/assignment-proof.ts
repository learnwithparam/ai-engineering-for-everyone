// Proof for the closing assignment: its check passes on the reference solution
// and fails on the starter.
import { join } from "node:path";
import { runCheck } from "../assignment/check";
import { ROOT } from "./structure";

const starter = runCheck(join(ROOT, "assignment"));
const solution = runCheck(
  join(ROOT, "parts", "08-compare-prompts", "01-view-the-comparison", "solution"),
);
console.log(`assignment starter: ${starter.pass ? "pass" : "fail"} (must fail)`);
console.log(`assignment reference solution: ${solution.pass ? "pass" : "fail"} (must pass)`);
if (starter.pass || !solution.pass) process.exit(1);
console.log("The assignment check tells the starter from the solution.");
