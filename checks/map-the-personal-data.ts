// map-the-personal-data: list every kind of personal data in the office, where it is,
// whether it goes to the AI, and why.
import type { Rule } from "../scripts/verify";
import { has, names, section, table, text } from "./lib/handin";

const MAP_FILE = "data-map.md";
const COLUMNS = ["data", "where it is", "sent to ai", "why"];

// Each kind of data the map must name, and the words that count as naming it.
const KINDS: Record<string, RegExp[]> = {
  name: [/\bname/i],
  "date of birth": [/birth/i, /\bdob\b/i],
  "home address": [/address/i],
  email: [/e-?mail/i],
  health: [/health/i, /ehcp/i, /disab/i, /\bsen\b/i],
  "care status": [/looked[- ]after/i, /\bcare\b/i],
};

const mapText = (folder: string) => text(folder, MAP_FILE);
const mapRows = (folder: string) => table(section(mapText(folder), "Data map"));
const wordsIn = (cell: string) => cell.split(/\s+/).filter((word) => /\w/.test(word)).length;

function rowsAbout(folder: string, kind: string): Record<string, string>[] {
  return mapRows(folder).filter((row) => names(row.data ?? "", KINDS[kind]));
}

function hasTheColumns(folder: string): boolean {
  const firstRow = mapRows(folder)[0];
  if (!firstRow) return false;
  const headers = Object.keys(firstRow);
  return COLUMNS.every((column) => headers.some((header) => header.startsWith(column)));
}

const sentToAi = (row: Record<string, string>) => {
  const column = Object.keys(row).find((key) => key.startsWith("sent to ai")) ?? "";
  return (row[column] ?? "").toLowerCase().trim();
};

function careAndHealthExplained(folder: string): boolean {
  const sensitive = [...rowsAbout(folder, "health"), ...rowsAbout(folder, "care status")];
  return sensitive.length >= 2 && sensitive.every((row) => wordsIn(row.why ?? "") >= 8);
}

function namesPlanSettings(folder: string): boolean {
  const settings = section(mapText(folder), "My plan's data settings") ?? "";
  const namesPlan = /\b(free|pro|max|ultra|team|enterprise)\b/i.test(settings);
  return namesPlan && /(train|improve)/i.test(settings);
}

export default [
  {
    says: "data-map.md is in the folder",
    test: (folder) => has(folder, MAP_FILE),
    tryNext: "Save data-map.md in this step's problem folder.",
  },
  {
    says: "the Data map table has the columns Data, Where it is, Sent to AI and Why",
    test: hasTheColumns,
    tryNext:
      "Keep the table header from the starter: Data, Where it is, Sent to AI (yes, no), Why.",
  },
  {
    says: "the map has at least 6 kinds of data",
    test: (folder) => mapRows(folder).filter((row) => wordsIn(row.data ?? "") > 0).length >= 6,
    tryNext: "Read one form from top to bottom. Each thing about a person is one row.",
  },
  {
    says: "every Sent to AI cell says yes or no",
    test: (folder) => mapRows(folder).every((row) => ["yes", "no"].includes(sentToAi(row))),
    tryNext: "Write yes if the extraction prompt sends it to the AI. Write no if it stays out.",
  },
  {
    says: "every row has a Why of 4 or more words",
    test: (folder) => mapRows(folder).every((row) => wordsIn(row.why ?? "") >= 4),
    tryNext: "Say why it is sent, or why it stays out, in a short sentence.",
  },
  {
    says: "it names the child's name, date of birth, address, email, health and care status",
    test: (folder) => Object.keys(KINDS).every((kind) => rowsAbout(folder, kind).length > 0),
    tryNext: "Look at Parts A to D of a form. Health is the EHCP. Care status is looked-after.",
  },
  {
    says: "health and care status each give a reason of 8 or more words",
    test: careAndHealthExplained,
    tryNext: "These are the most private details. Say why the AI needs them, or why it does not.",
  },
  {
    says: "My plan's data settings names your plan and whether chats train the model",
    test: namesPlanSettings,
    tryNext:
      "Open Settings, then Privacy, in the Claude app. Write your plan and what it says about " +
      "using your chats to improve or train the models.",
  },
] satisfies Rule[];
