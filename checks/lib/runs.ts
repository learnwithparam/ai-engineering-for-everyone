// Judge behaviour that depends on a model over 3 fresh runs, always in replay mode, so checks need no key.
// A result counts only if it holds on every run.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ask, RUNS_PER_RECORDING } from "../../world/lib/llm";
import { guard, OFFICE_SAMPLE, parseRow } from "../../world/lib/office";
import { extractionPrompt } from "../../world/lib/prompts";
import { HH } from "../../world/lib/state";

export async function threeRuns<T>(fn: (run: number) => Promise<T>): Promise<T[]> {
  const before = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "replay";
  try {
    const out: T[] = [];
    for (let run = 0; run < RUNS_PER_RECORDING; run++) out.push(await fn(run));
    return out;
  } finally {
    if (before === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = before;
  }
}

// The forms the finished office flags for a person, on every one of 3 runs.
export async function officeFlags(): Promise<string[]> {
  const runs = await threeRuns(async (run) => {
    const ids: string[] = [];
    for (const id of OFFICE_SAMPLE) {
      const form = readFileSync(join(HH, "applications", `${id.slice(-2)}.md`), "utf8");
      const r = await ask("fast", extractionPrompt(form), run);
      if (guard(form, parseRow(r.text)).length) ids.push(id);
    }
    return ids;
  });
  return runs[0].filter((id) => runs.every((r) => r.includes(id)));
}
