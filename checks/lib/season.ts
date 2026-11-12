// Reading and recomputing a season cost sheet (parts/01-price-the-work).
import { PRICES, type Price, priceByMenu } from "../../config/prices";
import { field, readNumber, section, table } from "./handin";
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

export function assumptions(sheet: string): Assumptions {
  const written = section(sheet, "Assumptions");
  return {
    applications: readNumber(field(written, /applications in a season/i)),
    formTokens: readNumber(field(written, /tokens in one (application|form)/i)),
    policyTokens: readNumber(field(written, /tokens in the policy/i)),
    inputTokens: readNumber(field(written, /input tokens per application/i)),
    outputTokens: readNumber(field(written, /output tokens per application/i)),
  };
}

// The input tokens one call really needs: an average form plus the whole policy.
export const referenceInput = () => tokenKey().average_application.tokens + tokensIn(POLICY);

// Prices are per million tokens, so every cost is divided by 1,000,000.
export function perApplication(price: Price, given: Assumptions): number {
  return (given.inputTokens * price.input + given.outputTokens * price.output) / 1e6;
}

export function perSeason(price: Price, given: Assumptions): number {
  return perApplication(price, given) * given.applications;
}

// The policy is the same in every call, so it can be read from the cache.
// The form and the reply cannot.
export function cachedSeason(price: Price, given: Assumptions): number {
  const formCost = given.formTokens * price.input;
  const policyCost = given.policyTokens * price.cacheHit;
  const replyCost = given.outputTokens * price.output;
  return ((formCost + policyCost + replyCost) / 1e6) * given.applications;
}

// The learner's season cost for each model, from the Per season table.
// The first column names the model, and the cost is in a column called season, cost or total.
export function seasonTotals(sheet: string): Map<Price, number> {
  const totals = new Map<Price, number>();
  for (const row of table(section(sheet, "Per season"))) {
    const headers = Object.keys(row);
    const modelName = (Object.values(row)[0] ?? "").replace(/[*_]/g, "");
    const price = priceByMenu(modelName.split(/\s+/)[0] ?? "");
    const costHeader = headers.find(
      (header) => /season|cost|total/.test(header) && header !== headers[0],
    );
    if (price && costHeader) totals.set(price, readNumber(row[costHeader]));
  }
  return totals;
}

export { PRICES };
