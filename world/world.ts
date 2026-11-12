// bun run world          a short tour of the office: its folders and what the register says
// bun run world reset    put the register back to how it started and clear the logs
// bun run world build    (course authors) write the folder, keys and replies from world/data.ts
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { HARBOUR_HILL, readRegister, STATE } from "./lib/state";

const SEED = join(import.meta.dir, "seed", "register.json");
const command = process.argv[2] ?? "tour";

if (command === "build") {
  await import("./build");
  process.exit(0);
}

if (command === "reset") {
  copyFileSync(SEED, join(HARBOUR_HILL, "register.json"));
  if (existsSync(STATE)) rmSync(STATE, { recursive: true, force: true });
  mkdirSync(STATE, { recursive: true });
  console.log(
    "The office is reset: the register is back to its first state and the logs are empty.",
  );
  process.exit(0);
}

if (command !== "tour") {
  console.log(`There is no world command "${command}". Use: bun run world, bun run world reset`);
  process.exit(1);
}

// How many files in one office folder end with this extension, for example ".md".
function countFiles(folder: string, extension: string): number {
  const files = readdirSync(join(HARBOUR_HILL, folder));
  return files.filter((file) => file.endsWith(extension)).length;
}

const register = readRegister();
const applicants = register.applicants;

function countWithStatus(status: string): number {
  return applicants.filter((applicant) => applicant.status === status).length;
}

const waiting = applicants.filter((applicant) => applicant.waitlist_position);
waiting.sort((first, second) => (first.waitlist_position ?? 0) - (second.waitlist_position ?? 0));
const topThree = waiting.slice(0, 3);
const topThreeText = topThree
  .map((applicant) => `${applicant.waitlist_position}. ${applicant.applicant_id}`)
  .join("   ");

const typedForms = countFiles("applications", ".md");
const scannedForms = countFiles("applications", ".png");
const policies = countFiles("policy", ".md");
const emails = countFiles("inbox", ".md");
const letters = countFiles("letters/batch-a", ".md") + countFiles("letters/batch-b", ".md");
const offered = countWithStatus("offered") + countWithStatus("accepted");
const waitlisted = countWithStatus("waitlisted");
const undecided = countWithStatus("received");

console.log("Harbour Hill School admissions office (fictional)");
console.log(
  `  Forms:     ${typedForms} typed, ${scannedForms} scanned   world/harbour-hill/applications/`,
);
console.log(`  Policy:    ${policies} documents                world/harbour-hill/policy/`);
console.log(`  Inbox:     ${emails} emails                   world/harbour-hill/inbox/`);
console.log(`  Letters:   ${letters} drafts by AI, not checked   world/harbour-hill/letters/`);
console.log(
  `  Register:  ${applicants.length} children: ${offered} offered, ` +
    `${waitlisted} waiting, ${undecided} not decided`,
);
console.log(`  Top of the waiting list: ${topThreeText}`);
console.log("The office is ready. Next: bun run office");
