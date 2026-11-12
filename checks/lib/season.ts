// Reading and recomputing a season cost sheet (parts/01-price-the-work).
import { PRICES, type Price, priceByMenu } from "../../config/prices";
import { field, num, section, table } from "./handin";
import { tokenKey, tokensIn } from "./world";

export const SEASON_FILE = "season-cost.md";
export const POLICY = "policy/admissions-policy-2027.md";

export type Assumptions = {
  applications: number;
  formTokens: number;
  policyTokens: number;
  inputTokens: number;
  outputTokens: number;
};

export function assumptions(md: string): Assumptions {
  const a = section(md, "Assumptions");
  return {
    applications: num(field(a, /applications in a season/i)),
    formTokens: num(field(a, /tokens in one (application|form)/i)),
    policyTokens: num(field(a, /tokens in the policy/i)),
    inputTokens: num(field(a, /input tokens per application/i)),
    outputTokens: num(field(a, /output tokens per application/i)),
  };
}

// The input tokens one call really needs: an average form plus the whole policy.
export const referenceInput = () => tokenKey().average_application.tokens + tokensIn(POLICY);

export const perApplication = (p: Price, a: Assumptions) =>
  (a.inputTokens * p.input + a.outputTokens * p.output) / 1e6;
export const perSeason = (p: Price, a: Assumptions) => perApplication(p, a) * a.applications;

// The policy is the same in every call, so it can be read from the cache. The form and the reply cannot.
export const cachedSeason = (p: Price, a: Assumptions) =>
  ((a.formTokens * p.input + a.policyTokens * p.cacheHit + a.outputTokens * p.output) / 1e6) *
  a.applications;

// The learner's season cost for each model, from the Per season table.
export function seasonTotals(md: string): Map<Price, number> {
  const out = new Map<Price, number>();
  for (const row of table(section(md, "Per season"))) {
    const name = Object.values(row)[0] ?? "";
    const p = priceByMenu(name.replace(/[*_]/g, "").split(/\s+/)[0] ?? "");
    const costKey = Object.keys(row).find(
      (k) => /season|cost|total/.test(k) && k !== Object.keys(row)[0],
    );
    if (p && costKey) out.set(p, num(row[costKey]));
  }
  return out;
}

export { PRICES };
