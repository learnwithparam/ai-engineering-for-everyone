// price-the-season: what one admissions season costs on three models,
// from the learner's own assumptions.
import type { Rule } from "../scripts/verify";
import { has, section, text, within } from "./lib/handin";
import {
  assumptions,
  PRICES,
  perSeason,
  referenceInput,
  SEASON_FILE,
  seasonTotals,
} from "./lib/season";

const sheetIn = (folder: string) => text(folder, SEASON_FILE);
const HEADINGS = ["Assumptions", "Per application", "Per season"];

function givesTheBasics(folder: string): boolean {
  const given = assumptions(sheetIn(folder));
  return given.applications === 1200 && given.inputTokens > 0 && given.outputTokens > 0;
}

function costsEveryModel(folder: string): boolean {
  const totals = seasonTotals(sheetIn(folder));
  return PRICES.every((price) => Number.isFinite(totals.get(price)));
}

// Recompute each season cost from the learner's own assumptions and the price list.
function costsMatch(folder: string): boolean {
  const given = assumptions(sheetIn(folder));
  const totals = seasonTotals(sheetIn(folder));
  return PRICES.every((price) => within(totals.get(price) ?? NaN, perSeason(price, given), 0.2));
}

export default [
  {
    says: "season-cost.md is in the folder",
    test: (folder) => has(folder, SEASON_FILE),
    tryNext: "Save season-cost.md in this step's problem folder.",
  },
  {
    says: "it has the sections Assumptions, Per application and Per season",
    test: (folder) => HEADINGS.every((heading) => section(sheetIn(folder), heading) !== undefined),
    tryNext:
      "Keep the three ## headings from the starter: Assumptions, Per application, Per season.",
  },
  {
    says: "Assumptions give 1,200 applications and the input and output tokens for each",
    test: givesTheBasics,
    tryNext:
      "Fill in the numbers after each colon under ## Assumptions. A season is 1,200 applications.",
  },
  {
    says: "input tokens per application include one form and the whole policy",
    test: (folder) => within(assumptions(sheetIn(folder)).inputTokens, referenceInput(), 0.25),
    tryNext:
      "Each call sends the policy and one form. " +
      "Add the policy tokens to the form tokens from count-the-tokens.",
  },
  {
    says: "Per season gives a cost for Haiku, Sonnet and Opus",
    test: costsEveryModel,
    tryNext: "In the Per season table, put a dollar cost in each row: Haiku, Sonnet and Opus.",
  },
  {
    says: "each season cost matches your assumptions and the price list, within 20%",
    test: costsMatch,
    tryNext:
      "Prices are per million tokens. " +
      "Do input tokens times input price, plus output tokens times output price, " +
      "then divide by 1,000,000 and times 1,200.",
  },
] satisfies Rule[];
