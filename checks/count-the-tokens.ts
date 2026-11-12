// count-the-tokens: a word count and a token estimate for three office files.
import type { Rule } from "../scripts/verify";
import { csv, has, readNumber, within } from "./lib/handin";
import { tokensIn, wordsIn } from "./lib/world";

const ANSWER_FILE = "token-count.csv";
export const FILES = ["policy/admissions-policy-2027.md", "applications/03.md", "inbox/04.md"];

// The learner's row for one office file. The path may start with world/harbour-hill/ or not.
function rowFor(folder: string, file: string): Record<string, string> | undefined {
  const rows = csv(folder, ANSWER_FILE).rows;
  return rows.find((row) => row.file?.replace(/^world\/harbour-hill\//, "") === file);
}

const wordsFor = (folder: string, file: string) => readNumber(rowFor(folder, file)?.words);
const tokensFor = (folder: string, file: string) => readNumber(rowFor(folder, file)?.tokens);

export default [
  {
    says: "token-count.csv is in the folder",
    test: (folder) => has(folder, ANSWER_FILE),
    tryNext: "Save token-count.csv in this step's problem folder.",
  },
  {
    says: "the first line is file,words,tokens",
    test: (folder) => csv(folder, ANSWER_FILE).header.join(",") === "file,words,tokens",
    tryNext: "Keep the first line exactly as it was: file,words,tokens",
  },
  {
    says: "there is a row for each of the three files",
    test: (folder) => FILES.every((file) => rowFor(folder, file)),
    tryNext: "Keep the three file names in the first column as they were in the starter.",
  },
  {
    says: "each word count is within 10% of the real count",
    test: (folder) => FILES.every((file) => within(wordsFor(folder, file), wordsIn(file), 0.1)),
    tryNext: "Count again with bun run words and the file path, or your editor's word count.",
  },
  {
    says: "each token count is more than its word count",
    test: (folder) => FILES.every((file) => tokensFor(folder, file) > wordsFor(folder, file)),
    tryNext:
      "A token is often a piece of a word, so there are more tokens than words. " +
      "Multiply words by 1.8.",
  },
  {
    says: "each token count is within 25% of the course count",
    test: (folder) => FILES.every((file) => within(tokensFor(folder, file), tokensIn(file), 0.25)),
    tryNext:
      "Use the rule from Claude's docs: about 1.8 tokens per word. Words times 1.8, rounded.",
  },
] satisfies Rule[];
