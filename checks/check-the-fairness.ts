// check-the-fairness: a short fairness plan. Two parts are only shape checks: the groups and the
// family letter. One part is a real test: the check runs your name swap on the office rules
// (guard and policy place) and compares its own answer with the verdict you wrote.
// It never tests the AI model, so it cannot show that the model is fair.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Rule } from "../scripts/verify";
import { guard, policyPlace, type Row } from "../world/lib/office";
import { FIELDS } from "../world/lib/prompts";
import { field, filled, has, section, table, text } from "./lib/handin";
import { HARBOUR_HILL, keyCsv } from "./lib/world";

const FILE = "fairness.md";
const BANNED = /\b(name|gender|race|religion|disabilit\w*|health|ehcp)\b/i;
const SWAP = /\b(swap|change only|changed only|only one|one detail|compare|same form)\b/i;

const fileText = (folder: string) => text(folder, FILE);
const groupRows = (folder: string) =>
  table(section(fileText(folder), "Who could be treated worse")).filter(
    (row) => filled(row.group) && filled(row["how it could happen"]),
  );

function namesBannedThing(folder: string): boolean {
  return groupRows(folder).some((row) => BANNED.test(`${row.group} ${row["how it could happen"]}`));
}

function describesSwap(folder: string): boolean {
  const body = section(fileText(folder), "How I would test it") ?? "";
  return filled(body) && SWAP.test(body) && /\b(compare|differ|same|match)\w*\b/i.test(body);
}

// The value of one "- Label: value" line, without the "(write here ...)" hints.
function mineField(folder: string, label: RegExp): string {
  const value = field(section(fileText(folder), "My swap test"), label) ?? "";
  return value.replace(/\(write[^)]*\)/gi, "").trim();
}

// What the office rules give a form: the reasons for a person, and the policy place.
function officeResult(formText: string, row: Row): string {
  return JSON.stringify([guard(formText, row), policyPlace(row)]);
}

// Run the learner's swap for real. Returns undefined if the form or the name is not usable.
function swapIsSame(folder: string): boolean | undefined {
  const number = mineField(folder, /^form$/i).match(/\d{1,2}/)?.[0]?.padStart(2, "0");
  const newName = mineField(folder, /name/i);
  const key = keyCsv("applications.csv").find((row) => row.file === `${number}.md`);
  if (!number || !newName || !key) return undefined;
  const formText = readFileSync(join(HARBOUR_HILL, "applications", `${number}.md`), "utf8");
  const oldName = key.child_name;
  if (!formText.includes(oldName) || newName === oldName) return undefined;
  const row = Object.fromEntries(FIELDS.map((name) => [name, key[name]])) as Row;
  const swapped = formText.split(oldName).join(newName);
  return officeResult(formText, row) === officeResult(swapped, row);
}

// The verdict you wrote must match what the swap really gave.
function verdictMatchesTheRun(folder: string): boolean {
  const same = swapIsSame(folder);
  const written = mineField(folder, /same result/i).toLowerCase().match(/\b(yes|no)\b/)?.[1];
  if (same === undefined || !written) return false;
  return (written === "yes") === same;
}

// Disclosure has three parts: an AI helped, a person decides, and how to appeal.
function disclosesProperly(folder: string): boolean {
  const body = section(fileText(folder), "What we tell families") ?? "";
  const saysAi = /\b(ai|computer|automated)\b/i.test(body);
  const saysPerson = /\b(person|officer|team|someone)\b/i.test(body);
  return saysAi && saysPerson && /\bappeal\b/i.test(body);
}

export default [
  {
    says: "fairness.md is in the folder",
    test: (folder) => has(folder, FILE),
    tryNext: "Save fairness.md in this step's problem folder.",
  },
  {
    says: "Who could be treated worse has two or more filled rows",
    test: (folder) => groupRows(folder).length >= 2,
    tryNext: "Fill in two rows. Name a group, then say how the office could treat it worse.",
  },
  {
    says: "one row names a detail clause 11.1 bans (a word check, not a judgement)",
    test: namesBannedThing,
    tryNext: "Add a row for a banned detail: a name, gender, race, religion or disability.",
  },
  {
    says: "How I would test it describes a swap and a compare",
    test: describesSwap,
    tryNext: "Say you change only one detail on a copy of the form, then compare the two results.",
  },
  {
    says: "What we tell families says an AI helped, a person decides, and how to appeal",
    test: disclosesProperly,
    tryNext: "Write lines that name the AI, the person who decides, and the right to appeal.",
  },
  {
    says: "My swap test names a real form and a new name, and your verdict matches the run",
    test: verdictMatchesTheRun,
    tryNext:
      "Under My swap test write Form: 13, Name swapped in: a different name, and Same result: " +
      "yes or no. The check runs the swap on the office rules and compares.",
  },
  {
    says: "What I saw has your own words from one real try",
    test: (folder) => {
      const body = section(fileText(folder), "What I saw") ?? "";
      return (
        filled(body) &&
        body
          .replace(/\(write[^)]*\)/gi, "")
          .split(/\s+/)
          .filter(Boolean).length >= 8
      );
    },
    tryNext: "Try the swap test once in Claude, then write what happened in a few lines.",
  },
] satisfies Rule[];
