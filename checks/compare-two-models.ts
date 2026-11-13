// compare-two-models: run the same prompt on 6 forms with two models, score both
// against the key, price a season on each, and decide.

import { priceByMenu } from "../config/prices";
import { coversTheForms, FIELDS_CHECKED, fieldsRight } from "../parts/07-choose-and-argue/accuracy";
import type { Rule } from "../scripts/verify";
import { has, readNumber, section, table, text, within } from "./lib/handin";
import { perSeason, referenceInput } from "./lib/season";

const CHOICE_FILE = "model-choice.md";
const MODELS = [
  { menu: "Haiku", file: "haiku.csv" },
  { menu: "Sonnet", file: "sonnet.csv" },
];

const choiceText = (folder: string) => text(folder, CHOICE_FILE);

// The table row whose first cell names the model, for example "Haiku".
function rowFor(folder: string, heading: string, menu: string): Record<string, string> {
  const rows = table(section(choiceText(folder), heading));
  const wanted = menu.toLowerCase();
  const found = rows.find((row) => {
    const firstCell = Object.values(row)[0] ?? "";
    return firstCell.toLowerCase().includes(wanted);
  });
  return found ?? {};
}

function countsMatch(folder: string): boolean {
  return MODELS.every((model) => {
    const row = rowFor(folder, "Accuracy", model.menu);
    return readNumber(row["fields right"]) === fieldsRight(folder, model.file);
  });
}

function percentsMatch(folder: string): boolean {
  return MODELS.every((model) => {
    const row = rowFor(folder, "Accuracy", model.menu);
    const percent = (100 * fieldsRight(folder, model.file)) / FIELDS_CHECKED;
    return Math.abs(readNumber(row.accuracy) - percent) <= 1;
  });
}

// The season from part one: 1,200 forms, each with the policy, and 300 output tokens.
function seasonCostsMatch(folder: string): boolean {
  const usage = {
    applications: 1200,
    formTokens: 0,
    policyTokens: 0,
    inputTokens: referenceInput(),
    outputTokens: 300,
  };
  return MODELS.every((model) => {
    const price = priceByMenu(model.menu);
    const row = rowFor(folder, "Season cost", model.menu);
    const written = readNumber(row["season cost"]);
    return price !== undefined && within(written, perSeason(price, usage), 0.25);
  });
}

function decisionCitesNumbers(folder: string): boolean {
  const decision = section(choiceText(folder), "Decision") ?? "";
  const namesModel = /\b(haiku|sonnet)\b/i.test(decision);
  const citesAccuracy = /\d+(\.\d+)?\s*%|\d+\s*of\s*42/i.test(decision);
  const citesCost = /\$\s*\d/.test(decision);
  return namesModel && citesAccuracy && citesCost;
}

export default [
  {
    says: "model-choice.md is in the folder",
    test: (folder) => has(folder, CHOICE_FILE),
    tryNext: "Save model-choice.md in this step's problem folder.",
  },
  {
    says: "haiku.csv and sonnet.csv each have the header and one row per test form",
    test: (folder) => MODELS.every((model) => coversTheForms(folder, model.file)),
    tryNext: "Keep the first line and the six application ids from the starter CSVs.",
  },
  {
    says: "Fields right for each model matches its CSV and the answer key",
    test: countsMatch,
    tryNext:
      "Compare each CSV with world/keys/applications.csv, field by field. " +
      "Count the fields that match. There are 42 in each CSV.",
  },
  {
    says: "each accuracy is fields right out of 42, as a percent",
    test: percentsMatch,
    tryNext: "Accuracy is fields right divided by 42, times 100. For example, 39 of 42 is 92.9%.",
  },
  {
    says: "the season cost for each model matches part one, within 25%",
    test: seasonCostsMatch,
    tryNext:
      "Use your Per season costs from price-the-season: one form plus the policy, 1,200 times.",
  },
  {
    says: "Decision names a model and cites an accuracy and a cost",
    test: decisionCitesNumbers,
    tryNext:
      "Name the model you pick. Give its accuracy, like 100%, and its season cost, like $9.36.",
  },
] satisfies Rule[];
