import { describe, expect, test } from "bun:test";
import { field, filled, names, readNumber, sections, table, within } from "../checks/lib/handin";
import { officeFlags, threeRuns } from "../checks/lib/runs";
import {
  assumptions,
  cachedSeason,
  perSeason,
  referenceInput,
  seasonTotals,
} from "../checks/lib/season";
import { keyJson } from "../checks/lib/world";
import { PRICES, priceByMenu } from "../config/prices";
import { readRegister } from "../world/lib/state";
import { countWords } from "../world/lib/words";

describe("reading hand-ins", () => {
  test("readNumber reads numbers the way people write them", () => {
    expect(readNumber("$1,234.50")).toBe(1234.5);
    expect(readNumber("about 2 400 tokens")).toBe(2400);
    expect(readNumber("0.0036")).toBe(0.0036);
    expect(readNumber("")).toBeNaN();
    expect(readNumber("none")).toBeNaN();
  });
  test("within allows a share either way", () => {
    expect(within(110, 100, 0.1)).toBe(true);
    expect(within(111, 100, 0.1)).toBe(false);
    expect(within(NaN, 100, 0.5)).toBe(false);
  });
  test("sections, fields and tables", () => {
    const handIn = [
      "# T",
      "",
      "## Assumptions",
      "",
      "- Applications in a season: 1,200",
      "",
      "## Per season",
      "",
      "| Model | Season cost |",
      "|---|---|",
      "| Haiku | $0.50 |",
      "",
    ].join("\n");
    const found = sections(handIn);
    expect(Object.keys(found)).toEqual(["assumptions", "per season"]);
    expect(field(found.assumptions, /applications/i)).toBe("1,200");
    expect(table(found["per season"])).toEqual([{ model: "Haiku", "season cost": "$0.50" }]);
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
  const usage = {
    applications: 1200,
    formTokens: 600,
    policyTokens: 1800,
    inputTokens: 2400,
    outputTokens: 300,
  };
  test("a season on the small model", () => {
    const haiku = priceByMenu("Haiku");
    expect(haiku).toBeDefined();
    if (!haiku) return;
    expect(perSeason(haiku, usage)).toBeCloseTo((1200 * (2400 * 0.1 + 300 * 0.5)) / 1e6, 8);
  });
  test("caching the policy is cheaper on every model", () => {
    for (const price of PRICES) {
      expect(cachedSeason(price, usage)).toBeLessThan(perSeason(price, usage));
    }
  });
  test("assumptions and totals are read from a sheet", () => {
    const sheet = [
      "## Assumptions",
      "- Applications in a season: 1200",
      "- Input tokens per application: 2400",
      "- Output tokens per application: 300",
      "## Per season",
      "| Model | Season cost |",
      "|---|---|",
      "| Sonnet | $9.36 |",
      "",
    ].join("\n");
    expect(assumptions(sheet).inputTokens).toBe(2400);
    const sonnet = priceByMenu("Sonnet");
    expect(sonnet).toBeDefined();
    if (!sonnet) return;
    expect(seasonTotals(sheet).get(sonnet)).toBe(9.36);
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
    const waitlistKey = keyJson("waitlist.json");
    const applicants = readRegister().applicants;
    const waiting = applicants.filter((applicant) => applicant.waitlist_position);
    const inLine = waiting.sort(
      (first, second) => (first.waitlist_position ?? 0) - (second.waitlist_position ?? 0),
    );
    const last = inLine.at(-1);
    expect(inLine[0].applicant_id).toBe(waitlistKey.naive_next_offer);
    expect(last).toBeDefined();
    expect(last?.applicant_id).toBe(waitlistKey.next_offer);
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

describe("troubleshooting", () => {
  test("every rule a check can fail is listed in 00-orientation/troubleshooting.md", async () => {
    const { allSteps } = await import("../scripts/structure");
    const troubleshootingUrl = new URL("../00-orientation/troubleshooting.md", import.meta.url);
    const troubleshooting = await Bun.file(troubleshootingUrl).text();
    for (const step of allSteps()) {
      const checkModule = await import(`../checks/${step.name}.ts`);
      const rules = checkModule.default as { says: string }[];
      for (const rule of rules) expect(troubleshooting).toContain(rule.says);
    }
  });
});
