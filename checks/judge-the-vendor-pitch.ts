// judge-the-vendor-pitch: list the pitch's claims, the evidence each needs,
// the questions to ask, and a verdict.
import type { Rule } from "../scripts/verify";
import { has, section, text } from "./lib/handin";

const REVIEW_FILE = "vendor-review.md";
const HEADINGS = ["Claims", "What evidence would prove each", "Questions to ask", "Verdict"];

// Each topic the questions must cover, and the words that count as asking about it.
const TOPICS: Record<string, RegExp> = {
  "test set": /(test set|tested|which forms|how many forms|sample)/i,
  "cost per application": /(cost|price|per application|per form|gbp|£)/i,
  "data handling": /(\bdata\b|stored|privacy|train)/i,
  "human approval": /(person|human|approv|sign)/i,
  "failure cases": /(wrong|fail|mistake|error)/i,
};

const reviewText = (folder: string) => text(folder, REVIEW_FILE);

function listLines(folder: string, heading: string): string[] {
  const body = section(reviewText(folder), heading) ?? "";
  const lines = body.split("\n").map((line) => line.trim());
  const items = lines.filter((line) => /^([-*]|\d+[.)])\s+\S/.test(line));
  return items.filter((line) => !/\(write[^)]*\)/i.test(line));
}

const questions = (folder: string) =>
  listLines(folder, "Questions to ask").filter((line) => line.endsWith("?"));

function claimsIncludeTheNumbers(folder: string): boolean {
  const claims = listLines(folder, "Claims");
  const joined = claims.join("\n");
  return claims.length >= 4 && joined.includes("95") && joined.includes("80");
}

function coversTheTopics(folder: string): boolean {
  const asked = questions(folder);
  const patterns = Object.values(TOPICS);
  return patterns.every((topic) => asked.some((question) => topic.test(question)));
}

function verdictIsFull(folder: string): boolean {
  const verdict = section(reviewText(folder), "Verdict") ?? "";
  const words = verdict.split(/\s+/).filter((word) => /\w/.test(word));
  return words.length >= 10;
}

export default [
  {
    says: "vendor-review.md is in the folder",
    test: (folder) => has(folder, REVIEW_FILE),
    tryNext: "Save vendor-review.md in this step's problem folder.",
  },
  {
    says: "vendor-review.md has the four sections from the starter",
    test: (folder) =>
      HEADINGS.every((heading) => section(reviewText(folder), heading) !== undefined),
    tryNext: "Keep the four ## headings from the starter.",
  },
  {
    says: "Claims lists at least 4 claims, with the 95% and the 80%",
    test: claimsIncludeTheNumbers,
    tryNext: "Copy each claim from the pitch as a list line, starting with the 95% and the 80%.",
  },
  {
    says: "What evidence would prove each has at least 4 lines",
    test: (folder) => listLines(folder, "What evidence would prove each").length >= 4,
    tryNext: "For each claim, write one line: what you would need to see to believe it.",
  },
  {
    says: "it says the claim that the tool makes the decisions breaks clause 1.2",
    test: (folder) => reviewText(folder).includes("1.2"),
    tryNext: "Read clause 1.2 of the 2027 policy. Then read the Fully automatic claim again.",
  },
  {
    says: "Questions to ask has at least 6 questions",
    test: (folder) => questions(folder).length >= 6,
    tryNext: "Write each question as a list line that ends with a question mark.",
  },
  {
    says: "a question asks what the 95% was measured on",
    test: (folder) => questions(folder).some((question) => question.includes("95")),
    tryNext: "Ask: 95% of what? On which forms, and how many?",
  },
  {
    says: "the questions cover the test set, cost, data, human approval and failure cases",
    test: coversTheTopics,
    tryNext:
      "Ask at least one question on each: the test set, the cost per application, " +
      "where the data goes, who approves, and what happens when it is wrong.",
  },
  {
    says: "Verdict gives your answer in 10 or more words",
    test: verdictIsFull,
    tryNext: "Say yes, no or not yet, and the one reason that matters most.",
  },
] satisfies Rule[];
