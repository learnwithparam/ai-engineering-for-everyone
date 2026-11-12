// spot-the-hidden-cost: name what the first sheet left out,
// and price the season with the policy cached.

import { type Price, priceByMenu } from "../config/prices";
import type { Rule } from "../scripts/verify";
import { has, names, readNumber, section, text, within } from "./lib/handin";
import { assumptions, cachedSeason, SEASON_FILE, seasonTotals } from "./lib/season";

const sheetIn = (folder: string) => text(folder, SEASON_FILE);
const hiddenCostsIn = (folder: string) => section(sheetIn(folder), "Hidden costs") ?? "";

// The five costs a first sheet tends to leave out. Each is a list of ways to name it.
export const HIDDEN = {
  "the policy is sent every time": [
    /policy[^.\n]*(every|each|same|again|repeat)/i,
    /(every|each)[^.\n]*(call|form)[^.\n]*policy/i,
  ],
  "output costs more": [/output/i, /(long|longer) (letter|reply|answer)/i],
  retries: [/retr(y|ies)/i, /(run|ask|send)[^.\n]*again/i, /re-?run/i],
  caching: [/cach/i],
  batch: [/batch/i],
};

function countNamed(folder: string): number {
  const written = hiddenCostsIn(folder);
  return Object.values(HIDDEN).filter((ways) => names(written, ways)).length;
}

// The line "Cached season total for Sonnet: $123": which model, and the total.
function cachedTotal(folder: string): { price: Price | undefined; total: number } {
  const line = hiddenCostsIn(folder).match(
    /cached season total for\s+\**([A-Za-z]+)\**\s*:\s*(.+)/i,
  );
  const price = line ? priceByMenu(line[1]) : undefined;
  return { price, total: readNumber(line?.[2]) };
}

function lowerThanFull(folder: string): boolean {
  const cached = cachedTotal(folder);
  if (!cached.price) return false;
  const full = seasonTotals(sheetIn(folder)).get(cached.price);
  return !!full && cached.total < full;
}

function matchesAssumptions(folder: string): boolean {
  const cached = cachedTotal(folder);
  if (!cached.price) return false;
  const want = cachedSeason(cached.price, assumptions(sheetIn(folder)));
  return within(cached.total, want, 0.2);
}

export default [
  {
    says: "season-cost.md is in the folder",
    test: (folder) => has(folder, SEASON_FILE),
    tryNext:
      "Use the season-cost.md that is in this folder, or copy yours in from price-the-season.",
  },
  {
    says: "it has a ## Hidden costs section",
    test: (folder) => section(sheetIn(folder), "Hidden costs") !== undefined,
    tryNext: "Add a heading line: ## Hidden costs",
  },
  {
    says: "Hidden costs names at least three costs the first sheet left out",
    test: (folder) => countNamed(folder) >= 3,
    tryNext:
      "Look for: the policy sent every time, output tokens, retries, caching and batch. " +
      "Write a line for each one you find.",
  },
  {
    says: "it gives a cached season total for Haiku, Sonnet or Opus",
    test: (folder) => {
      const cached = cachedTotal(folder);
      return !!cached.price && Number.isFinite(cached.total);
    },
    tryNext: "Add a line like: Cached season total for Sonnet: $0.00 (with your own number).",
  },
  {
    says: "the cached total is lower than that model's total in Per season",
    test: lowerThanFull,
    tryNext:
      "Reading the policy from the cache costs less than sending it fresh, " +
      "so the cached total must be lower.",
  },
  {
    says: "the cached total matches your assumptions within 20%, with only the policy cached",
    test: matchesAssumptions,
    tryNext:
      "Only the policy is the same each time. Price the policy tokens at the cache read price, " +
      "and the form and the reply at full price.",
  },
] satisfies Rule[];
