// bun run words <file>: count the words in one file, the way the course counts them.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { countWords } from "./lib/words";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log(
    "Name a file. For example: bun run words world/harbour-hill/policy/admissions-policy-2027.md",
  );
  process.exit(1);
}
// bun run moves into the repo folder, so a path is read from the folder the learner typed it in.
const typedIn = process.env.INIT_CWD ?? process.cwd();
for (const file of files) {
  const path = resolve(typedIn, file);
  if (!existsSync(path)) {
    console.log(`There is no file at ${file}. Check the path and try again.`);
    process.exit(1);
  }
  const words = countWords(readFileSync(path, "utf8"));
  console.log(`${file}: ${words} words`);
}
