// extract-the-fields: one clean row for each of the 12 typed forms, checked against the answer key.
// fix-the-messy-ones uses the same table rules, so they are exported from here.
import type { Rule } from "../scripts/verify";
import { csv, has } from "./lib/handin";
import { keyCsv } from "./lib/world";

export const TABLE_FILE = "applications.csv";
export const HEADER = [
  "application_id",
  "child_name",
  "date_of_birth",
  "sibling_on_roll",
  "distance_km",
  "looked_after",
  "ehcp_names_school",
  "preference_rank",
  "needs_person",
];
// Every column the check marks right or wrong. The id only says which form the row is for.
const MARKED_FIELDS = HEADER.slice(1);
const SHARE_THAT_MUST_MATCH = 0.9;

type Row = Record<string, string>;

export const tableRows = (folder: string): Row[] => csv(folder, TABLE_FILE).rows;

// The answer key rows for one set of forms, for example "extract" or "messy".
export function keyRowsFor(sets: string[]): Row[] {
  return keyCsv("applications.csv").filter((row) => sets.includes(row.set));
}

export function rowFor(folder: string, applicationId: string): Row | undefined {
  const wanted = applicationId.toUpperCase();
  return tableRows(folder).find((row) => row.application_id?.toUpperCase() === wanted);
}

export function hasTheHeader(folder: string): boolean {
  const header = csv(folder, TABLE_FILE).header;
  return header.join(",") === HEADER.join(",");
}

export function hasEveryForm(folder: string, sets: string[]): boolean {
  return keyRowsFor(sets).every((keyRow) => rowFor(folder, keyRow.application_id));
}

// People write the same answer in different ways: "Yes", " yes ", "0.840".
function sameAnswer(written: string | undefined, wanted: string): boolean {
  const cleanWritten = (written ?? "").trim().toLowerCase();
  const cleanWanted = wanted.trim().toLowerCase();
  const writtenIsNumber = cleanWritten !== "" && !Number.isNaN(Number(cleanWritten));
  const wantedIsNumber = cleanWanted !== "" && !Number.isNaN(Number(cleanWanted));
  if (writtenIsNumber && wantedIsNumber) {
    return Math.abs(Number(cleanWritten) - Number(cleanWanted)) < 0.011;
  }
  return cleanWritten === cleanWanted;
}

// How many of the marked cells match the key, out of how many, across the given sets.
export function matchingCells(folder: string, sets: string[]): { right: number; total: number } {
  let right = 0;
  let total = 0;
  for (const keyRow of keyRowsFor(sets)) {
    const learnerRow = rowFor(folder, keyRow.application_id);
    for (const field of MARKED_FIELDS) {
      total += 1;
      if (sameAnswer(learnerRow?.[field], keyRow[field])) right += 1;
    }
  }
  return { right, total };
}

export function mostCellsMatch(folder: string, sets: string[]): boolean {
  const cells = matchingCells(folder, sets);
  return cells.total > 0 && cells.right >= cells.total * SHARE_THAT_MUST_MATCH;
}

// unknown is allowed: a gap is not a wrong format.
function writtenAs(folder: string, field: string, shape: RegExp): boolean {
  const rows = tableRows(folder);
  const filledCells = rows.map((row) => (row[field] ?? "").trim());
  const known = filledCells.filter((cell) => cell.toLowerCase() !== "unknown");
  return rows.length > 0 && known.every((cell) => shape.test(cell));
}

export const distancesAreNumbers = (folder: string) =>
  writtenAs(folder, "distance_km", /^\d+(\.\d+)?$/);

export const datesAreIso = (folder: string) =>
  writtenAs(folder, "date_of_birth", /^\d{4}-\d{2}-\d{2}$/);

// The sibling traps: a stepsister counts under the 2027 policy.
// A sister at the primary school does not.
function siblingTrapsRight(folder: string): boolean {
  const stepsister = rowFor(folder, "HH-0104")?.sibling_on_roll?.toLowerCase();
  const atThePrimary = rowFor(folder, "HH-0108")?.sibling_on_roll?.toLowerCase();
  return stepsister === "yes" && atThePrimary === "no";
}

export const headerRule: Rule = {
  says: "the first line is the nine column names, in order",
  test: hasTheHeader,
  tryNext: "Copy the first line from the starter file. Do not rename or move any column.",
};

export default [
  {
    says: "applications.csv is in the folder",
    test: (folder) => has(folder, TABLE_FILE),
    tryNext: "Save applications.csv in this step's problem folder.",
  },
  headerRule,
  {
    says: "there is a row for each of the 12 typed forms, HH-0101 to HH-0112",
    test: (folder) => hasEveryForm(folder, ["extract"]),
    tryNext: "Add one row for each form from 01.md to 12.md. Start each row with its HH number.",
  },
  {
    says: "every distance is a plain number of km, like 0.84",
    test: distancesAreNumbers,
    tryNext: 'Write 0.84, not "0.84 km". Ask Claude to leave out the units.',
  },
  {
    says: "every date of birth is written YYYY-MM-DD",
    test: datesAreIso,
    tryNext: "The forms write 02/03/2015. Write it as 2015-03-02: the year first, then the month.",
  },
  {
    says: "the sibling traps are right: HH-0104 yes, HH-0108 no",
    test: siblingTrapsRight,
    tryNext:
      "Read clause 4.3 of the 2027 policy. A stepsister counts. " +
      "A sister at Harbour Hill Primary does not.",
  },
  {
    says: "at least 90% of the fields match the answer key",
    test: (folder) => mostCellsMatch(folder, ["extract"]),
    tryNext: "Check each column against the form. Run the step again to see how many still differ.",
  },
] satisfies Rule[];
