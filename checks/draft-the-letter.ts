// draft-the-letter: a letter template with five fields, and three letters filled in from it.
// Each letter cites the child's real clause and reads at grade 8 or lower.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Rule } from "../scripts/verify";
import { grade } from "../tests/readability";
import { has, text } from "./lib/handin";
import { readRegister, worldFile } from "./lib/world";

const TEMPLATE_FILE = "letters/offer-template.md";
const FIELDS = ["{child}", "{decision}", "{clause}", "{next step}", "{signed by}"];
const LETTERS_NEEDED = 3;
const HIGHEST_GRADE = 8;

// The clause numbers in this year's policy, such as 4.3, read from lines like "4.3 **Siblings.**".
function policyClauses(): Set<string> {
  const policy = worldFile("policy/admissions-policy-2027.md");
  const numbers = [...policy.matchAll(/^(\d+\.\d+) /gm)].map((match) => match[1]);
  return new Set(numbers);
}

// Every .md file in letters/ except the template.
function filledLetters(folder: string): string[] {
  const lettersFolder = join(folder, "letters");
  if (!existsSync(lettersFolder)) return [];
  const files = readdirSync(lettersFolder).filter((file) => file.endsWith(".md"));
  const letters = files.filter((file) => file !== "offer-template.md");
  return letters.map((file) => text(folder, join("letters", file)));
}

// A letter cites a clause as "clause 4.3".
const citedClauses = (letter: string) =>
  [...letter.matchAll(/\bclause\s+(\d+\.\d+)/gi)].map((match) => match[1]);

// The register row for the child the letter is about, found by the child's full name.
function childIn(letter: string) {
  const applicants = readRegister().applicants;
  return applicants.find((applicant) => letter.includes(applicant.child_name));
}

function citesTheChildsClause(letter: string): boolean {
  const child = childIn(letter);
  return child !== undefined && citedClauses(letter).includes(child.clause);
}

function everyCitedClauseExists(letter: string): boolean {
  const clauses = policyClauses();
  const cited = citedClauses(letter);
  return cited.length > 0 && cited.every((clause) => clauses.has(clause));
}

// Run a test on every filled letter. No letters is never a pass.
function everyLetter(folder: string, test: (letter: string) => boolean): boolean {
  const letters = filledLetters(folder);
  return letters.length > 0 && letters.every(test);
}

export default [
  {
    says: "letters/offer-template.md is in the folder",
    test: (folder) => has(folder, TEMPLATE_FILE),
    tryNext: "Keep the template at letters/offer-template.md inside this step's problem folder.",
  },
  {
    says: "the template has the five fields: child, decision, clause, next step, signed by",
    test: (folder) => FIELDS.every((field) => text(folder, TEMPLATE_FILE).includes(field)),
    tryNext: "Put each field in the template with its curly brackets, for example {next step}.",
  },
  {
    says: "there are three filled letters next to the template",
    test: (folder) => filledLetters(folder).length >= LETTERS_NEEDED,
    tryNext: "Save three letters in the letters folder, such as HH-0101.md, next to the template.",
  },
  {
    says: "no filled letter still has a {field} in it",
    test: (folder) => everyLetter(folder, (letter) => !/\{[a-z ]+\}/i.test(letter)),
    tryNext: "Swap every field for real words. Search each letter for a { to find any left.",
  },
  {
    says: "each letter names a child from the register and cites that child's clause",
    test: (folder) => everyLetter(folder, citesTheChildsClause),
    tryNext:
      "Use the child's full name. Look up the child's clause in register.json " +
      "and write it as: clause 4.4.",
  },
  {
    says: "every clause a letter cites is in the 2027 policy",
    test: (folder) => everyLetter(folder, everyCitedClauseExists),
    tryNext: "Open policy/admissions-policy-2027.md and check each clause number you used.",
  },
  {
    says: "each letter reads at grade 8 or lower",
    test: (folder) => everyLetter(folder, (letter) => grade(letter) <= HIGHEST_GRADE),
    tryNext: "Use short sentences and short words. Ask Claude to rewrite it for a 12-year-old.",
  },
] satisfies Rule[];
