// read-twenty-outputs: a pass label and a note for each of the 20 letters in batch A.

import {
  coversBatch,
  everyFailHasNote,
  expertAnswers,
  isYesOrNo,
  lettersWithFaults,
  readLabels,
} from "../parts/05-measure-the-letters/labels";
import type { Rule } from "../scripts/verify";
import { csv, has } from "./lib/handin";

const NOTES_FILE = "letter-notes.csv";
const labelsIn = (folder: string) => readLabels(folder, NOTES_FILE);

function faultsCaught(folder: string): number {
  const faulty = lettersWithFaults("a");
  const caught = labelsIn(folder).filter(
    (label) => faulty.includes(label.letter) && label.pass === "no",
  );
  return caught.length;
}

// Marking every letter "no" would catch every fault, so good letters must mostly pass too.
function goodLettersPassed(folder: string): number {
  const answers = expertAnswers("a");
  const passed = labelsIn(folder).filter(
    (label) => answers.get(label.letter) === "yes" && label.pass === "yes",
  );
  return passed.length;
}

export default [
  {
    says: "letter-notes.csv is in the folder",
    test: (folder) => has(folder, NOTES_FILE),
    tryNext: "Save letter-notes.csv in this step's problem folder.",
  },
  {
    says: "the first line is letter,pass,note",
    test: (folder) => csv(folder, NOTES_FILE).header.join(",") === "letter,pass,note",
    tryNext: "Keep the first line exactly as it was: letter,pass,note",
  },
  {
    says: "there is one row for each letter from A01 to A20",
    test: (folder) => coversBatch(labelsIn(folder), "a"),
    tryNext: "Keep the 20 letter names from the starter, A01 to A20, one per row.",
  },
  {
    says: "every pass cell says yes or no",
    test: (folder) => labelsIn(folder).every((label) => isYesOrNo(label.pass)),
    tryNext: "Write yes if the letter can go out as it is. Write no if anything is wrong.",
  },
  {
    says: "every no has a note of 5 or more words",
    test: (folder) => everyFailHasNote(labelsIn(folder)),
    tryNext: "For each no, write the first thing wrong, for example: cites clause 4.6, not real.",
  },
  {
    says: "at least 4 of the 5 letters with a fault are marked no",
    test: (folder) => faultsCaught(folder) >= 4,
    tryNext:
      "Check each letter against the policy and the register, not only by reading it. " +
      "Does the clause exist? Does the register agree with the offer?",
  },
  {
    says: "at least 12 of the 15 good letters are marked yes",
    test: (folder) => goodLettersPassed(folder) >= 12,
    tryNext: "Mark a letter no only when you can name what is wrong with it.",
  },
] satisfies Rule[];
