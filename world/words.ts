// bun run words <file>: count the words in one file, the way the course counts them.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { countWords } from "./lib/words";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log("Name a file. For example: bun run words world/harbour-hill/policy/admissions-policy-2027.md");
  process.exit(1);
}
for (const f of files) {
  const p = resolve(process.env.INIT_CWD ?? process.cwd(), f);
  if (!existsSync(p)) {
    console.log(`There is no file at ${f}. Check the path and try again.`);
    process.exit(1);
  }
  console.log(`${f}: ${countWords(readFileSync(p, "utf8"))} words`);
}
