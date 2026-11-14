// check-the-fairness: a short fairness plan that names who could be treated worse,
// a swap test, and what families are told. It checks shape, not whether the test is good.
import type { Rule } from "../scripts/verify";
import { filled, has, section, table, text } from "./lib/handin";

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
    says: "one row is a thing clause 11.1 bans",
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
