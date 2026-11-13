// Helpers for compare-two-models: score a model's CSV of fields against the answer key.
// The supervisor may move this file to checks/lib/.
import { csv, readNumber } from "../../checks/lib/handin";
import { keyCsv } from "../../checks/lib/world";
import { FIELDS } from "../../world/lib/prompts";

// The six forms both models read: four typed and two scanned.
export const TEST_FORMS = ["HH-0116", "HH-0118", "HH-0120", "HH-0122", "HH-0128", "HH-0130"];
export const HEADER = FIELDS.join(",");
// Every field but the reference number is scored, so 6 forms give 42 fields.
export const SCORED_FIELDS = FIELDS.filter((field) => field !== "application_id");
export const FIELDS_CHECKED = TEST_FORMS.length * SCORED_FIELDS.length;

function sameAnswer(given: string, expected: string): boolean {
  const givenNumber = readNumber(given);
  const expectedNumber = Number(expected);
  const bothNumbers = /^\d+(\.\d+)?$/.test(expected.trim()) && Number.isFinite(givenNumber);
  if (bothNumbers) return Math.abs(givenNumber - expectedNumber) < 0.005;
  const givenWord = given.trim().toLowerCase();
  const expectedWord = expected.trim().toLowerCase();
  return givenWord === expectedWord;
}

function rowFor(rows: Record<string, string>[], applicationId: string) {
  return rows.find((row) => (row.application_id ?? "").toUpperCase() === applicationId);
}

// Does the CSV have the header and exactly one row for each test form?
export function coversTheForms(folder: string, file: string): boolean {
  const sheet = csv(folder, file);
  const hasHeader = sheet.header.join(",") === HEADER;
  const oneRowEach = TEST_FORMS.every((applicationId) => rowFor(sheet.rows, applicationId));
  return hasHeader && oneRowEach && sheet.rows.length === TEST_FORMS.length;
}

// How many of the 42 fields in the CSV match the answer key.
export function fieldsRight(folder: string, file: string): number {
  const rows = csv(folder, file).rows;
  const keyRows = keyCsv("applications.csv");
  let right = 0;
  for (const applicationId of TEST_FORMS) {
    const given = rowFor(rows, applicationId);
    const expected = rowFor(keyRows, applicationId);
    if (!given || !expected) continue;
    const matching = SCORED_FIELDS.filter((field) =>
      sameAnswer(given[field] ?? "", expected[field]),
    );
    right += matching.length;
  }
  return right;
}
