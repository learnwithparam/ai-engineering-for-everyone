// write-the-brief-prompt: a prompt with a role, a task, the input, rules and an exact output shape.
import type { Rule } from "../scripts/verify";
import { filled, has, section, text } from "./lib/handin";

const PROMPT_FILE = "prompts/summary.md";
const SECTIONS = ["Role", "Task", "Input", "Rules", "Output format"];
const LINES_IN_THE_SUMMARY = 5;

const promptIn = (folder: string) => text(folder, PROMPT_FILE);
const sectionIn = (folder: string, heading: string) => section(promptIn(folder), heading);

// A line of the summary is one list item: "- Child: ..." or "1. Child: ...".
function summaryLines(folder: string): string[] {
  const outputFormat = sectionIn(folder, "Output format") ?? "";
  const lines = outputFormat.split("\n");
  const listItems = lines.filter((line) => /^\s*([-*]|\d+[.)])\s+\S/.test(line));
  return listItems.filter((line) => !/\(write[^)]*\)/i.test(line));
}

function saysUnknown(folder: string): boolean {
  const rules = sectionIn(folder, "Rules") ?? "";
  return /\bunknown\b/i.test(rules);
}

// The form goes in the Input section, so the prompt must say where it goes.
function inputNamesTheForm(folder: string): boolean {
  const input = sectionIn(folder, "Input") ?? "";
  return filled(input) && /\b(form|application)\b/i.test(input);
}

export default [
  {
    says: "prompts/summary.md is in the folder",
    test: (folder) => has(folder, PROMPT_FILE),
    tryNext: "Keep the file at prompts/summary.md inside this step's problem folder.",
  },
  {
    says: "it has the sections Role, Task, Input, Rules and Output format, each filled in",
    test: (folder) => SECTIONS.every((heading) => filled(sectionIn(folder, heading))),
    tryNext: "Keep the five ## headings from the starter and write at least one line under each.",
  },
  {
    says: "Input says where the form goes",
    test: inputNamesTheForm,
    tryNext: "Under ## Input, say that the form text goes there, for example: the form is below.",
  },
  {
    says: "Output format lists exactly five lines",
    test: (folder) => summaryLines(folder).length === LINES_IN_THE_SUMMARY,
    tryNext: "Under ## Output format, write one list line for each of the five summary lines.",
  },
  {
    says: "Rules tell the AI to write unknown when the form does not say",
    test: saysUnknown,
    tryNext: "Add a rule like: If the form does not say, write unknown. Never guess.",
  },
] satisfies Rule[];
