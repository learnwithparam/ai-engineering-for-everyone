// price-the-season: what one admissions season costs on three models, from the learner's own assumptions.
import type { Rule } from "../scripts/verify";
import { has, text, section, within } from "./lib/handin";
import { SEASON_FILE as F, assumptions, referenceInput, seasonTotals, perSeason, PRICES } from "./lib/season";

const md = (d: string) => text(d, F);

export default [
  { says: "season-cost.md is in the folder", test: (d) => has(d, F), tryNext: "Save season-cost.md in this step's problem folder." },
  {
    says: "it has the sections Assumptions, Per application and Per season",
    test: (d) => ["Assumptions", "Per application", "Per season"].every((h) => section(md(d), h) !== undefined),
    tryNext: "Keep the three ## headings from the starter: Assumptions, Per application, Per season.",
  },
  {
    says: "Assumptions give 1,200 applications and the input and output tokens for each",
    test: (d) => {
      const a = assumptions(md(d));
      return a.applications === 1200 && a.inputTokens > 0 && a.outputTokens > 0;
    },
    tryNext: "Fill in the numbers after each colon under ## Assumptions. A season is 1,200 applications.",
  },
  {
    says: "input tokens per application include one form and the whole policy",
    test: (d) => within(assumptions(md(d)).inputTokens, referenceInput(), 0.25),
    tryNext: "Each call sends the policy and one form. Add the policy tokens to the form tokens from count-the-tokens.",
  },
  {
    says: "Per season gives a cost for Haiku, Sonnet and Opus",
    test: (d) => {
      const t = seasonTotals(md(d));
      return PRICES.every((p) => Number.isFinite(t.get(p)));
    },
    tryNext: "In the Per season table, put a dollar cost in each row: Haiku, Sonnet and Opus.",
  },
  {
    says: "each season cost matches your assumptions and the price list, within 20%",
    test: (d) => {
      const a = assumptions(md(d));
      const t = seasonTotals(md(d));
      return PRICES.every((p) => within(t.get(p) ?? NaN, perSeason(p, a), 0.2));
    },
    tryNext: "Prices are per million tokens. Do input tokens times input price, plus output tokens times output price, then divide by 1,000,000 and times 1,200.",
  },
] satisfies Rule[];
