// Judge behaviour that depends on a model over 3 fresh runs, always in replay mode,
// so checks need no key. A result counts only if it holds on every run.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ask, RUNS_PER_RECORDING } from "../../world/lib/llm";
import { guard, OFFICE_SAMPLE, parseRow } from "../../world/lib/office";
import { extractionPrompt } from "../../world/lib/prompts";
import { HARBOUR_HILL } from "../../world/lib/state";

export async function threeRuns<T>(oneRun: (run: number) => Promise<T>): Promise<T[]> {
  const providerBefore = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "replay";
  try {
    const results: T[] = [];
    for (let run = 0; run < RUNS_PER_RECORDING; run++) results.push(await oneRun(run));
    return results;
  } finally {
    // Put the learner's own setting back, so a check never changes it.
    if (providerBefore === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = providerBefore;
  }
}

// The forms the office flags for a person on one run.
async function flaggedOnRun(run: number): Promise<string[]> {
  const flagged: string[] = [];
  for (const id of OFFICE_SAMPLE) {
    const form = readFileSync(join(HARBOUR_HILL, "applications", `${id.slice(-2)}.md`), "utf8");
    const reading = await ask("fast", extractionPrompt(form), run);
    const reasons = guard(form, parseRow(reading.text));
    if (reasons.length > 0) flagged.push(id);
  }
  return flagged;
}

// The forms the finished office flags for a person, on every one of 3 runs.
export async function officeFlags(): Promise<string[]> {
  const runs = await threeRuns(flaggedOnRun);
  return runs[0].filter((id) => runs.every((flagged) => flagged.includes(id)));
}
