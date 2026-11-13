// fix-the-messy-ones: the six scanned and messy forms join the table.
// A gap says unknown, never a guess, and the child with two homes goes to a person.
import type { Rule } from "../scripts/verify";
import { hasEveryForm, headerRule, mostCellsMatch, rowFor, TABLE_FILE } from "./extract-the-fields";
import { has } from "./lib/handin";

const ALL_SETS = ["extract", "messy"];

// Each form leaves one thing out. The row must say unknown in that field.
const GAPS = [
  { applicationId: "HH-0113", field: "date_of_birth" },
  { applicationId: "HH-0115", field: "distance_km" },
  { applicationId: "HH-0127", field: "preference_rank" },
];

function gapsSayUnknown(folder: string): boolean {
  return GAPS.every((gap) => {
    const cell = rowFor(folder, gap.applicationId)?.[gap.field] ?? "";
    return cell.trim().toLowerCase() === "unknown";
  });
}

function twoHomesGoToSomeone(folder: string): boolean {
  const needsPerson = rowFor(folder, "HH-0114")?.needs_person ?? "";
  return needsPerson.trim().toLowerCase() === "yes";
}

export default [
  {
    says: "applications.csv is in the folder",
    test: (folder) => has(folder, TABLE_FILE),
    tryNext: "Use the applications.csv in this folder, or copy yours in from extract-the-fields.",
  },
  headerRule,
  {
    says: "there is a row for each of the 18 forms: the 12 typed ones and the 6 messy ones",
    test: (folder) => hasEveryForm(folder, ALL_SETS),
    tryNext: "Add rows for forms 13, 14 and 15, and for the scans 25.png, 26.png and 27.png.",
  },
  {
    says: "the three gaps say unknown: HH-0113 date of birth, HH-0115 distance, HH-0127 preference",
    test: gapsSayUnknown,
    tryNext: "When a form does not say, or you cannot read it, write unknown. Never a guess.",
  },
  {
    says: "HH-0114, the child with two homes, has needs_person set to yes",
    test: twoHomesGoToSomeone,
    tryNext: "Finn lives half the time at each home. Clause 5.2 says a person decides. Write yes.",
  },
  {
    says: "at least 90% of the fields match the answer key, across all 18 rows",
    test: (folder) => mostCellsMatch(folder, ALL_SETS),
    tryNext: "Check the new rows against the forms. A row with a gap also needs needs_person yes.",
  },
] satisfies Rule[];
