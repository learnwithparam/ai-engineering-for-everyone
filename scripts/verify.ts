// bun run verify <step-name>            check your work on one step, then show progress
// bun run verify <step-name> solution   check the sample solution instead
// bun run verify part <part-name>      check every step in one part (a deliverable)
// bun run verify --report               write verify-report.json for cohort grading
// bun run verify --all                  CI: each check fails on its starter and wrong answers,
//                                       and passes on its solution
// Exit codes: 0 pass, 1 fail, 2 the check could not run.

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { allSteps, findStep, type Part, parts, ROOT, type Step } from "./structure";

export type Rule = {
  says: string;
  test: (dir: string) => boolean | Promise<boolean>;
  tryNext: string;
};
type Result = {
  step: string;
  status: "pass" | "fail" | "error";
  passed: number;
  total: number;
  failed: string[];
};
type WrongAnswer = { name: string; dir: string };

async function rulesFor(step: Step): Promise<Rule[]> {
  const checkModule = await import(join(ROOT, "checks", `${step.name}.ts`));
  return checkModule.default;
}

async function rulePasses(rule: Rule, dir: string): Promise<boolean> {
  try {
    return await rule.test(dir);
  } catch {
    return false;
  }
}

function printRule(rule: Rule, ok: boolean): void {
  if (ok) console.log(`  PASS  ${rule.says}`);
  else console.log(`  FAIL  ${rule.says}\n        Try next: ${rule.tryNext}`);
}

async function run(step: Step, dir: string, print = false): Promise<Result> {
  let rules: Rule[];
  try {
    rules = await rulesFor(step);
  } catch (error) {
    if (print) {
      const reason = (error as Error).message;
      console.log(`  ERROR  the check for ${step.name} could not load: ${reason}`);
    }
    return { step: step.name, status: "error", passed: 0, total: 0, failed: [] };
  }
  const failed: string[] = [];
  for (const rule of rules) {
    const ok = await rulePasses(rule, dir);
    if (!ok) failed.push(rule.says);
    if (print) printRule(rule, ok);
  }
  return {
    step: step.name,
    status: failed.length ? "fail" : "pass",
    passed: rules.length - failed.length,
    total: rules.length,
    failed,
  };
}

function learnerWork(step: Step): string {
  return join(step.dir, "problem");
}

function wrongAnswers(step: Step): WrongAnswer[] {
  const wrongFolder = join(step.dir, "wrong");
  if (!existsSync(wrongFolder)) return [];
  return readdirSync(wrongFolder).map((name) => ({ name, dir: join(wrongFolder, name) }));
}

function countPassing(results: Result[]): number {
  return results.filter((result) => result.status === "pass").length;
}

async function workResults(steps: Step[]): Promise<Result[]> {
  const results: Result[] = [];
  for (const step of steps) results.push(await run(step, learnerWork(step)));
  return results;
}

// --all: prove each check can tell a right answer from a wrong one.
function tryNextProblems(step: Step, rules: Rule[]): string[] {
  const problems: string[] = [];
  for (const rule of rules) {
    const tryNextWords = rule.tryNext.trim().split(/\s+/);
    if (tryNextWords.length < 3) {
      problems.push(`${step.name}: rule "${rule.says}" needs a try-next sentence`);
    }
  }
  return problems;
}

async function solutionProblems(step: Step): Promise<string[]> {
  const solution = join(step.dir, "solution");
  if (!existsSync(solution)) {
    return [`${step.name}: needs solution/ so CI can prove the check can pass`];
  }
  const result = await run(step, solution);
  if (result.status === "pass") return [];
  return [`${step.name}: the sample solution fails: ${result.failed.join("; ")}`];
}

async function wrongAnswerProblems(step: Step): Promise<string[]> {
  const wrong = wrongAnswers(step);
  const problems: string[] = [];
  if (wrong.length === 0) {
    problems.push(
      `${step.name}: needs at least one wrong/<mistake>/ answer that the check must reject`,
    );
  }
  for (const answer of wrong) {
    const result = await run(step, answer.dir);
    if (result.status === "pass") {
      problems.push(`${step.name}: wrong answer "${answer.name}" passes the check`);
    }
  }
  return problems;
}

async function checkProblems(step: Step): Promise<string[]> {
  let rules: Rule[] = [];
  try {
    rules = await rulesFor(step);
  } catch (error) {
    return [`${step.name}: the check could not load: ${(error as Error).message}`];
  }
  const problems = tryNextProblems(step, rules);
  const starter = await run(step, learnerWork(step));
  if (starter.status === "pass") {
    problems.push(`${step.name}: the check passes on the starter, so it checks nothing`);
  }
  problems.push(...(await solutionProblems(step)));
  problems.push(...(await wrongAnswerProblems(step)));
  return problems;
}

async function verifyAllChecks(): Promise<never> {
  const problems: string[] = [];
  for (const step of allSteps()) problems.push(...(await checkProblems(step)));
  for (const problem of problems) console.log(`  ${problem}`);
  if (problems.length) {
    console.log(`${problems.length} check problem(s).`);
    process.exit(1);
  }
  console.log("Every check rejects its starter and wrong answers, and passes its solution.");
  process.exit(0);
}

// --report: one JSON file a teacher can collect from every learner.
async function writeReport(): Promise<never> {
  const results = await workResults(allSteps());
  const reportPath = join(ROOT, "verify-report.json");
  const report = { version: 1, at: new Date().toISOString(), results };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const passing = countPassing(results);
  console.log(`Wrote verify-report.json: ${passing} of ${results.length} steps pass.`);
  process.exit(0);
}

// part <part-name>: every step in one part, one line each.
function listParts(partName: string | undefined): never {
  if (partName) console.log(`There is no part called "${partName}". Parts:`);
  else console.log("Name a part. Parts:");
  for (const part of parts()) console.log(`  bun run verify part ${part.name}`);
  process.exit(1);
}

async function verifyPartSteps(part: Part): Promise<Result[]> {
  const results: Result[] = [];
  for (const step of part.steps) {
    const result = await run(step, learnerWork(step));
    results.push(result);
    const status = result.status.toUpperCase().padEnd(5);
    console.log(`  ${status}  ${step.name}  (${result.passed}/${result.total} rules)`);
  }
  return results;
}

function partExitCode(results: Result[]): number {
  if (results.some((result) => result.status === "error")) return 2;
  if (countPassing(results) === results.length) return 0;
  return 1;
}

async function verifyPart(partName: string | undefined): Promise<never> {
  const part = parts().find((candidate) => candidate.name === partName);
  if (!part) return listParts(partName);
  console.log(`Part ${part.name}:`);
  const results = await verifyPartSteps(part);
  const done = countPassing(results);
  const total = results.length;
  if (done === total) {
    console.log(`Part ${part.name} is done: ${done}/${total} steps pass.`);
  } else {
    console.log(
      `${done}/${total} steps pass. Run bun run verify <step-name> on a FAIL line to see why.`,
    );
  }
  process.exit(partExitCode(results));
}

// <step-name>: the learner's everyday command.
function listSteps(stepName: string | undefined): never {
  if (stepName) console.log(`There is no step called "${stepName}". Steps:`);
  else console.log("Name a step. Steps:");
  for (const step of allSteps()) console.log(`  bun run verify ${step.name}`);
  process.exit(1);
}

async function printProgress(): Promise<void> {
  // Done is recomputed from the checks every time, never read from a saved flag.
  const results = await workResults(allSteps());
  console.log(`Progress: ${countPassing(results)}/${results.length} steps pass.`);
}

async function verifyStep(stepName: string | undefined, which: string | undefined) {
  const step = stepName ? findStep(stepName) : undefined;
  if (!step) return listSteps(stepName);
  const asSolution = which === "solution";
  const whose = asSolution ? "sample solution" : "your work";
  console.log(`Checking ${step.name} (${whose}):`);
  const folder = asSolution ? join(step.dir, "solution") : learnerWork(step);
  const result = await run(step, folder, true);
  if (result.status === "error") process.exit(2);
  if (result.status === "pass") console.log(`Done. All ${result.total} rules pass.`);
  else {
    console.log(
      `${result.passed} of ${result.total} rules pass. Fix the FAIL lines and run it again.`,
    );
  }
  if (!asSolution) await printProgress();
  process.exit(result.status === "pass" ? 0 : 1);
}

const [command, which] = process.argv.slice(2);

if (command === "--all") await verifyAllChecks();
else if (command === "--report") await writeReport();
else if (command === "part") await verifyPart(which);
else await verifyStep(command, which);
