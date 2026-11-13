// write-the-project-brief: a one-page plan for one AI task, with a cost worked out from
// tokens and a test set to measure it.

import { priceByMenu } from "../config/prices";
import type { Rule } from "../scripts/verify";
import { field, filled, has, readNumber, section, text, within } from "./lib/handin";

const BRIEF_FILE = "project-brief.md";
const BRIEF_SECTIONS = [
  "Problem and cost today",
  "Source of truth",
  "What AI does",
  "What a person does",
  "Cost estimate",
  "How we will measure it",
  "Guardrails",
  "Model choice",
];
const TEST_SET =
  /(\d[\d,]*)\s+(\w+\s+)?(cases|forms|letters|examples|items|questions|emails|records)/gi;

const briefText = (folder: string) => text(folder, BRIEF_FILE);
const costSection = (folder: string) => section(briefText(folder), "Cost estimate");

function costInputs(folder: string) {
  const written = costSection(folder);
  const modelName = field(written, /^model/i) ?? "";
  return {
    runs: readNumber(field(written, /runs/i)),
    inputTokens: readNumber(field(written, /input tokens/i)),
    outputTokens: readNumber(field(written, /output tokens/i)),
    price: priceByMenu(modelName.split(/\s+/)[0] ?? ""),
    cost: readNumber(field(written, /^(total )?cost/i)),
  };
}

function givesTheTokenMaths(folder: string): boolean {
  const given = costInputs(folder);
  const numbers = [given.runs, given.inputTokens, given.outputTokens];
  return numbers.every((number) => number > 0) && given.price !== undefined;
}

// Work the cost out again from the learner's own numbers and the price list.
function costMatches(folder: string): boolean {
  const given = costInputs(folder);
  if (!given.price) return false;
  const inputCost = given.inputTokens * given.price.input;
  const outputCost = given.outputTokens * given.price.output;
  const expected = ((inputCost + outputCost) / 1e6) * given.runs;
  return within(given.cost, expected, 0.2);
}

function testSetSize(folder: string): number {
  const measure = section(briefText(folder), "How we will measure it") ?? "";
  const sizes = [...measure.matchAll(TEST_SET)].map((found) => readNumber(found[1]));
  return Math.max(0, ...sizes);
}

export default [
  {
    says: "project-brief.md is in the folder",
    test: (folder) => has(folder, BRIEF_FILE),
    tryNext: "Save project-brief.md in this step's problem folder.",
  },
  {
    says: "project-brief.md has all 8 sections, each filled in",
    test: (folder) =>
      BRIEF_SECTIONS.every((heading) => filled(section(briefText(folder), heading))),
    tryNext: "Keep the 8 ## headings from the starter, and write under each one.",
  },
  {
    says: "Cost estimate gives the runs, the input and output tokens, and a model",
    test: givesTheTokenMaths,
    tryNext:
      "Fill in each line under Cost estimate: runs, input tokens per run, output tokens per run, " +
      "and the model: Haiku, Sonnet or Opus.",
  },
  {
    says: "the cost matches your token numbers and the price list, within 20%",
    test: costMatches,
    tryNext:
      "Input tokens times the input price, plus output tokens times the output price. " +
      "Divide by 1,000,000, then times the runs.",
  },
  {
    says: "How we will measure it names a test set of at least 20 cases",
    test: (folder) => testSetSize(folder) >= 20,
    tryNext: "Say how many real cases you will label, like: a test set of 20 letters.",
  },
  {
    says: "What a person does says who signs or approves",
    test: (folder) => /(sign|approv)/i.test(section(briefText(folder), "What a person does") ?? ""),
    tryNext: "Name the person, by role, who approves or signs what the AI drafts.",
  },
] satisfies Rule[];
