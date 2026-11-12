// spot-the-hidden-cost: name what the first sheet left out, and price the season with the policy cached.

import { priceByMenu } from "../config/prices";
import type { Rule } from "../scripts/verify";
import { has, names, num, section, text, within } from "./lib/handin";
import { assumptions, cachedSeason, SEASON_FILE as F, seasonTotals } from "./lib/season";

const md = (d: string) => text(d, F);
const hidden = (d: string) => section(md(d), "Hidden costs") ?? "";

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
const named = (d: string) => Object.values(HIDDEN).filter((ways) => names(hidden(d), ways)).length;

function cached(d: string) {
  const m = hidden(d).match(/cached season total for\s+\**([A-Za-z]+)\**\s*:\s*(.+)/i);
  const p = m ? priceByMenu(m[1]) : undefined;
  return { p, total: num(m?.[2]) };
}

export default [
  {
    says: "season-cost.md is in the folder",
    test: (d) => has(d, F),
    tryNext:
      "Use the season-cost.md that is in this folder, or copy yours in from price-the-season.",
  },
  {
    says: "it has a ## Hidden costs section",
    test: (d) => section(md(d), "Hidden costs") !== undefined,
    tryNext: "Add a heading line: ## Hidden costs",
  },
  {
    says: "Hidden costs names at least three costs the first sheet left out",
    test: (d) => named(d) >= 3,
    tryNext:
      "Look for: the policy sent every time, output tokens, retries, caching and batch. Write a line for each one you find.",
  },
  {
    says: "it gives a cached season total for Haiku, Sonnet or Opus",
    test: (d) => !!cached(d).p && Number.isFinite(cached(d).total),
    tryNext: "Add a line like: Cached season total for Sonnet: $0.00 (with your own number).",
  },
  {
    says: "the cached total is lower than that model's total in Per season",
    test: (d) => {
      const c = cached(d);
      const full = c.p ? seasonTotals(md(d)).get(c.p) : undefined;
      return !!full && c.total < full;
    },
    tryNext:
      "Reading the policy from the cache costs less than sending it fresh, so the cached total must be lower.",
  },
  {
    says: "the cached total matches your assumptions within 20%, with only the policy cached",
    test: (d) => {
      const c = cached(d);
      return !!c.p && within(c.total, cachedSeason(c.p, assumptions(md(d))), 0.2);
    },
    tryNext:
      "Only the policy is the same each time. Price the policy tokens at the cache read price, and the form and the reply at full price.",
  },
] satisfies Rule[];
