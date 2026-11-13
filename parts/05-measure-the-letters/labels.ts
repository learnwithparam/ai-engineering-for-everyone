// Helpers the measure-the-letters checks share: reading a sheet of pass labels
// and comparing it with the expert key. The supervisor may move this file to checks/lib/.
import { csv } from "../../checks/lib/handin";
import { keyCsv } from "../../checks/lib/world";

export type Label = { letter: string; pass: string; note: string; row: Record<string, string> };

// The expert's answer for every letter in one batch, for example "A03" gives "no".
export function expertAnswers(batch: "a" | "b"): Map<string, string> {
  const answers = new Map<string, string>();
  for (const row of keyCsv(`letters-${batch}.csv`)) answers.set(row.letter, row.pass);
  return answers;
}

export function lettersWithFaults(batch: "a" | "b"): string[] {
  const keyRows = keyCsv(`letters-${batch}.csv`);
  const faulty = keyRows.filter((row) => row.pass === "no");
  return faulty.map((row) => row.letter);
}

// The learner's labels. Letter names are upper case and yes or no is lower case,
// so "a03" and "No" still count.
export function readLabels(folder: string, file: string): Label[] {
  return csv(folder, file).rows.map((row) => ({
    letter: (row.letter ?? "").toUpperCase(),
    pass: (row.pass ?? "").toLowerCase(),
    note: row.note ?? "",
    row,
  }));
}

export const wordCount = (text: string) =>
  text.split(/\s+/).filter((word) => /\w/.test(word)).length;

export const isYesOrNo = (answer: string) => answer === "yes" || answer === "no";

// Does the sheet have exactly one row for every letter in the batch?
export function coversBatch(labels: Label[], batch: "a" | "b"): boolean {
  const wanted = [...expertAnswers(batch).keys()];
  const given = labels.map((label) => label.letter);
  const sameCount = given.length === wanted.length;
  return sameCount && wanted.every((letter) => given.includes(letter));
}

// How many labels match the expert key.
export function agreement(labels: Label[], batch: "a" | "b"): number {
  const answers = expertAnswers(batch);
  const matching = labels.filter((label) => answers.get(label.letter) === label.pass);
  return matching.length;
}

// Every letter marked no has a note of at least 5 words saying what is wrong.
export function everyFailHasNote(labels: Label[]): boolean {
  const failed = labels.filter((label) => label.pass === "no");
  return failed.every((label) => wordCount(label.note) >= 5);
}
