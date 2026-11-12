import { describe, expect, test } from "bun:test";
import { num, within, sections, field, table, filled, names } from "../checks/lib/handin";
import { assumptions, perSeason, cachedSeason, seasonTotals, referenceInput } from "../checks/lib/season";
import { PRICES, priceByMenu } from "../config/prices";
import { officeFlags, threeRuns } from "../checks/lib/runs";
import { countWords } from "../world/lib/words";
import { readRegister } from "../world/lib/state";
import { keyJson } from "../checks/lib/world";

describe("reading hand-ins", () => {
  test("num reads numbers the way people write them", () => {
    expect(num("$1,234.50")).toBe(1234.5);
    expect(num("about 2 400 tokens")).toBe(2400);
    expect(num("0.0036")).toBe(0.0036);
    expect(num("")).toBeNaN();
    expect(num("none")).toBeNaN();
  });
  test("within allows a share either way", () => {
    expect(within(110, 100, 0.1)).toBe(true);
    expect(within(111, 100, 0.1)).toBe(false);
    expect(within(NaN, 100, 0.5)).toBe(false);
  });
  test("sections, fields and tables", () => {
    const md = "# T\n\n## Assumptions\n\n- Applications in a season: 1,200\n\n## Per season\n\n| Model | Season cost |\n|---|---|\n| Haiku | $0.50 |\n";
    expect(Object.keys(sections(md))).toEqual(["assumptions", "per season"]);
    expect(field(sections(md).assumptions, /applications/i)).toBe("1,200");
    expect(table(sections(md)["per season"])).toEqual([{ model: "Haiku", "season cost": "$0.50" }]);
  });
  test("filled ignores placeholders", () => {
    expect(filled("(write here)\n")).toBe(false);
    expect(filled("I run the office.")).toBe(true);
  });
  test("names finds any of the words", () => {
    expect(names("We could use the Batch API", ["batch"])).toBe(true);
    expect(names("nothing here", ["batch", /cach/i])).toBe(false);
  });
});

describe("season maths", () => {
  const a = { applications: 1200, formTokens: 600, policyTokens: 1800, inputTokens: 2400, outputTokens: 300 };
  test("a season on the small model", () => {
    expect(perSeason(priceByMenu("Haiku")!, a)).toBeCloseTo(1200 * (2400 * 0.1 + 300 * 0.5) / 1e6, 8);
  });
  test("caching the policy is cheaper on every model", () => {
    for (const p of PRICES) expect(cachedSeason(p, a)).toBeLessThan(perSeason(p, a));
  });
  test("assumptions and totals are read from a sheet", () => {
    const md = "## Assumptions\n- Applications in a season: 1200\n- Input tokens per application: 2400\n- Output tokens per application: 300\n## Per season\n| Model | Season cost |\n|---|---|\n| Sonnet | $9.36 |\n";
    expect(assumptions(md).inputTokens).toBe(2400);
    expect(seasonTotals(md).get(priceByMenu("Sonnet")!)).toBe(9.36);
  });
  test("the reference input is a form plus the policy", () => {
    expect(referenceInput()).toBeGreaterThan(2000);
  });
});

describe("the world", () => {
  test("words are counted the same way everywhere", () => {
    expect(countWords("Hello, world. 12 km - ok")).toBe(5);
  });
  test("the register starts with the planted waiting list fault", () => {
    const w = keyJson("waitlist.json");
    const list = readRegister().applicants.filter((r) => r.waitlist_position).sort((x, y) => x.waitlist_position! - y.waitlist_position!);
    expect(list[0].applicant_id).toBe(w.naive_next_offer);
    expect(list.at(-1)!.applicant_id).toBe(w.next_offer);
  });
  test("the finished office flags the same three forms on 3 replay runs", async () => {
    expect(await officeFlags()).toEqual(["HH-0113", "HH-0114", "HH-0117"]);
  });
  test("threeRuns forces replay and puts the provider back", async () => {
    process.env.LLM_PROVIDER = "anthropic";
    const seen = await threeRuns(async () => process.env.LLM_PROVIDER);
    expect(seen).toEqual(["replay", "replay", "replay"]);
    expect(process.env.LLM_PROVIDER).toBe("anthropic");
    delete process.env.LLM_PROVIDER;
  });
});
