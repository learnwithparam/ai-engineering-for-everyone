// bun run world          a short tour of the office: what is in the folder and what the register says
// bun run world reset    put the register back to how it started and clear the logs
// bun run world build    (course authors) write the folder, keys and replies from world/data.ts
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { HH, readRegister, STATE } from "./lib/state";

const SEED = join(import.meta.dir, "seed", "register.json");
const cmd = process.argv[2] ?? "tour";

if (cmd === "build") {
  await import("./build");
  process.exit(0);
}

if (cmd === "reset") {
  copyFileSync(SEED, join(HH, "register.json"));
  if (existsSync(STATE)) rmSync(STATE, { recursive: true, force: true });
  mkdirSync(STATE, { recursive: true });
  console.log(
    "The office is reset: the register is back to its first state and the logs are empty.",
  );
  process.exit(0);
}

if (cmd !== "tour") {
  console.log(`There is no world command "${cmd}". Use: bun run world, bun run world reset`);
  process.exit(1);
}

const count = (d: string, ext: string) =>
  readdirSync(join(HH, d)).filter((f) => f.endsWith(ext)).length;
const reg = readRegister();
const by = (s: string) => reg.applicants.filter((a) => a.status === s).length;
const list = reg.applicants
  .filter((a) => a.waitlist_position)
  .sort((a, b) => a.waitlist_position! - b.waitlist_position!);

console.log("Harbour Hill School admissions office (fictional)");
console.log(
  `  Forms:     ${count("applications", ".md")} typed, ${count("applications", ".png")} scanned   world/harbour-hill/applications/`,
);
console.log(
  `  Policy:    ${count("policy", ".md")} documents                world/harbour-hill/policy/`,
);
console.log(
  `  Inbox:     ${count("inbox", ".md")} emails                   world/harbour-hill/inbox/`,
);
console.log(
  `  Letters:   ${count("letters/batch-a", ".md") + count("letters/batch-b", ".md")} drafts by AI, not checked   world/harbour-hill/letters/`,
);
console.log(
  `  Register:  ${reg.applicants.length} children: ${by("offered") + by("accepted")} offered, ${by("waitlisted")} waiting, ${by("received")} not decided`,
);
console.log(
  `  Top of the waiting list: ${list
    .slice(0, 3)
    .map((a) => `${a.waitlist_position}. ${a.applicant_id}`)
    .join("   ")}`,
);
console.log("The office is ready. Next: bun run office");
