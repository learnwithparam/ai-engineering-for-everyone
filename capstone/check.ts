// bun capstone/check.ts <your-folder>: judges your own folder only, never the course files.
import { runCapstoneCheck } from "../checks/capstone";
import rules from "../checks/run-your-own-task";

runCapstoneCheck(rules);
