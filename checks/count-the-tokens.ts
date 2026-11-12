// count-the-tokens: a word count and a token estimate for three office files.
import type { Rule } from "../scripts/verify";
import { csv, has, num, within } from "./lib/handin";
import { tokensIn, wordsIn } from "./lib/world";

const F = "token-count.csv";
export const FILES = ["policy/admissions-policy-2027.md", "applications/03.md", "inbox/04.md"];
const rows = (d: string) => csv(d, F).rows;
const rowFor = (d: string, f: string) =>
  rows(d).find((r) => r.file?.replace(/^world\/harbour-hill\//, "") === f);

export default [
  {
    says: "token-count.csv is in the folder",
    test: (d) => has(d, F),
    tryNext: "Save token-count.csv in this step's problem folder.",
  },
  {
    says: "the first line is file,words,tokens",
    test: (d) => csv(d, F).header.join(",") === "file,words,tokens",
    tryNext: "Keep the first line exactly as it was: file,words,tokens",
  },
  {
    says: "there is a row for each of the three files",
    test: (d) => FILES.every((f) => rowFor(d, f)),
    tryNext: "Keep the three file names in the first column as they were in the starter.",
  },
  {
    says: "each word count is within 10% of the real count",
    test: (d) => FILES.every((f) => within(num(rowFor(d, f)?.words), wordsIn(f), 0.1)),
    tryNext: "Count again with bun run words and the file path, or your editor's word count.",
  },
  {
    says: "each token count is more than its word count",
    test: (d) => FILES.every((f) => num(rowFor(d, f)?.tokens) > num(rowFor(d, f)?.words)),
    tryNext:
      "A token is often a piece of a word, so there are more tokens than words. Multiply words by 1.8.",
  },
  {
    says: "each token count is within 25% of the course count",
    test: (d) => FILES.every((f) => within(num(rowFor(d, f)?.tokens), tokensIn(f), 0.25)),
    tryNext:
      "Use the rule from Claude's docs: about 1.8 tokens per word. Words times 1.8, rounded.",
  },
] satisfies Rule[];
