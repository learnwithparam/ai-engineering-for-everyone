// bun run check: the repo standard. CI runs this; any failure stops the build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { allSteps, type Part, parts, ROOT, type Step } from "./structure";

const problems: string[] = [];

function fail(where: string, what: string): void {
  const place = relative(ROOT, where) || ".";
  problems.push(`${place}: ${what}`);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const STEP_SECTIONS = [
  "## The problem",
  "## Your challenge",
  "## Done when",
  "## If you get stuck",
  "## Words you will use",
];
const HYPE = new RegExp(
  "\\b(supercharge|unleash|unlock|seamless(ly)?|leverage|dive into|game[- ]changer|" +
    "revolutioni[sz]e|magic(al)?|cutting[- ]edge|AI-powered)\\b",
  "i",
);
const TIME_WORDS = /\b(week|day|hour)\s+\d+\b/i;
const VERB_THING = /^[a-z]+(-[a-z0-9]+)+$/;
const IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g;
const MERMAID = /```mermaid\n/;
const MODEL_ID = /\b(claude-[a-z0-9-]+-\d|gpt-\d[\w.-]*|gemini-\d[\w.-]*|o\d-(mini|pro)\b)/i;

function everyFile(folder: string, found: string[] = []): string[] {
  for (const entry of readdirSync(folder)) {
    if (entry === "node_modules" || entry === ".git") continue;
    const path = join(folder, entry);
    if (statSync(path).isDirectory()) everyFile(path, found);
    else found.push(path);
  }
  return found;
}

function hasImage(text: string): boolean {
  const images = [...text.matchAll(IMAGE)];
  return images.length > 0;
}

function sectionText(text: string, heading: string): string | undefined {
  const afterHeading = text.split(heading)[1];
  return afterHeading?.split("\n## ")[0];
}

// 1. No Makefile anywhere.
function checkNoMakefile(files: string[]): void {
  for (const file of files) {
    if (/(^|\/)(GNU)?[Mm]akefile$/.test(file)) {
      fail(file, "a Makefile is not allowed; use a Bun or uv script");
    }
  }
}

// 2. Prose rules on every Markdown file.
function checkProseLine(file: string, line: string, lineNumber: number): void {
  if (line.includes("—")) fail(file, `line ${lineNumber}: em dash`);
  const hypeWord = line.match(HYPE);
  if (hypeWord) fail(file, `line ${lineNumber}: hype word "${hypeWord[0]}"`);
  const timeWord = line.match(TIME_WORDS);
  if (timeWord && !file.includes("schedules")) {
    fail(file, `line ${lineNumber}: "${timeWord[0]}"; content is in parts, schedules map time`);
  }
  if (/\bM=\d+|verify \d+/.test(line)) {
    fail(file, `line ${lineNumber}: numeric step command; name the step`);
  }
}

function checkProse(markdownFiles: string[]): void {
  for (const file of markdownFiles) {
    const lines = read(file).split("\n");
    for (let i = 0; i < lines.length; i++) checkProseLine(file, lines[i], i + 1);
  }
}

// 2b. Every page shows, not only tells: images it names exist, and the key pages carry a picture.
function checkImagesExist(markdownFiles: string[]): void {
  for (const file of markdownFiles) {
    for (const image of read(file).matchAll(IMAGE)) {
      const imagePath = image[1];
      if (/^https?:/.test(imagePath)) continue;
      if (!existsSync(join(dirname(file), imagePath))) {
        fail(file, `image "${imagePath}" does not exist`);
      }
    }
  }
}

type PictureNeeds = { what: string; mermaid: boolean; image: boolean };

function checkPicture(file: string, needs: PictureNeeds): void {
  if (!existsSync(file)) {
    fail(file, "missing");
    return;
  }
  const text = read(file);
  if (needs.mermaid && !MERMAID.test(text)) fail(file, `${needs.what} needs a Mermaid diagram`);
  if (needs.image && !hasImage(text)) fail(file, `${needs.what} needs a screenshot`);
}

function checkKeyPictures(): void {
  const rootReadme = join(ROOT, "README.md");
  checkPicture(rootReadme, { what: "the root README", mermaid: true, image: true });
  const orientation = join(ROOT, "00-orientation", "README.md");
  checkPicture(orientation, { what: "the orientation", mermaid: false, image: true });
}

// 3. Parts and steps.
function checkPartReadme(part: Part, readme: string): void {
  const text = read(readme);
  if (!MERMAID.test(text)) fail(readme, "part README needs a Mermaid diagram");
  const walkthrough = sectionText(text, "## Walkthrough");
  // A skeleton part (no steps yet, its walkthrough marked TODO(part session))
  // waits for its part session.
  const markedTodo = (walkthrough ?? "").includes("TODO(part session)");
  const skeleton = part.steps.length === 0 && markedTodo;
  if (walkthrough === undefined) {
    fail(readme, `part README needs a "## Walkthrough" section`);
  } else if (!walkthrough.includes("```bash") && !skeleton) {
    fail(readme, "the walkthrough needs the commands, each with an Expect: line");
  }
  if (part.steps.length === 0 && !skeleton) fail(part.dir, "part has no steps");
}

function checkPart(part: Part, seenNames: Set<string>): void {
  const readme = join(part.dir, "README.md");
  const hasReadme = existsSync(readme);
  if (hasReadme) checkPartReadme(part, readme);
  else fail(part.dir, "part has no README.md");
  if (part.steps.length === 0 && !hasReadme) fail(part.dir, "part has no steps");
  for (const step of part.steps) checkStep(step, seenNames);
}

function checkStepName(step: Step, seenNames: Set<string>): void {
  if (!VERB_THING.test(step.name)) {
    fail(step.dir, `step name "${step.name}" must be verb-thing in lower case`);
  }
  if (seenNames.has(step.name)) fail(step.dir, `step name "${step.name}" is used twice`);
  seenNames.add(step.name);
}

function checkStepMeta(step: Step): void {
  if (!existsSync(join(step.dir, "step.toml"))) fail(step.dir, "missing step.toml");
  const minutes = step.meta.minutes;
  if (minutes < 5 || minutes > 30) {
    fail(step.dir, `step is ${minutes} min; keep a step between 5 and 30, split it if longer`);
  }
}

function checkStepReadme(step: Step, readme: string): void {
  const text = read(readme);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 600) fail(readme, `${words} words; a step README stays under 600, split the step`);
  for (const heading of STEP_SECTIONS) {
    if (!text.includes(heading)) fail(readme, `missing section "${heading}"`);
  }
  if (!MERMAID.test(text) && !hasImage(text)) {
    fail(readme, "a step shows a picture: a screenshot or a Mermaid diagram");
  }
  const doneWhen = sectionText(text, "## Done when") ?? "";
  if (!/^- /m.test(doneWhen)) fail(readme, "Done when needs at least one bullet");
  if (step.meta.screen) checkScreenStep(step, readme, text);
}

function checkScreenStep(step: Step, readme: string, text: string): void {
  const expectedImage = join(step.dir, "images", "expected.png");
  if (!existsSync(expectedImage)) fail(step.dir, "screen step needs images/expected.png");
  if (!text.includes("images/expected.png")) {
    fail(readme, "screen step must show ../images/expected.png");
  }
}

function checkStepFiles(step: Step): void {
  if (step.meta.solution && !existsSync(join(step.dir, "solution"))) {
    fail(step.dir, "step.toml says solution but there is no solution/");
  }
  const typescriptCheck = join(ROOT, "checks", `${step.name}.ts`);
  const pythonCheck = join(ROOT, "checks", `${step.name}.py`);
  if (!existsSync(typescriptCheck) && !existsSync(pythonCheck)) {
    fail(step.dir, `no check at checks/${step.name}.ts`);
  }
}

function checkStep(step: Step, seenNames: Set<string>): void {
  checkStepName(step, seenNames);
  checkStepMeta(step);
  const readme = join(step.dir, "problem", "README.md");
  if (!existsSync(readme)) {
    fail(step.dir, "missing problem/README.md");
    return;
  }
  checkStepReadme(step, readme);
  checkStepFiles(step);
}

function checkParts(allParts: Part[]): void {
  if (allParts.length === 0) fail(join(ROOT, "parts"), "no parts");
  const seenNames = new Set<string>();
  for (const part of allParts) checkPart(part, seenNames);
}

// 4. Commands: the README runs the finished system first,
// and every command block says what to expect.
function checkRootReadmeRunsFirst(): void {
  const rootReadme = join(ROOT, "README.md");
  if (!existsSync(rootReadme)) {
    fail(ROOT, "missing README.md");
    return;
  }
  const text = read(rootReadme);
  const firstCode = text.indexOf("```bash");
  const firstConcept = text.search(/^## (How it works|Concepts|Background|Why)/m);
  if (firstCode < 0) {
    fail(rootReadme, "the README needs a bash block that runs the finished system");
  } else if (firstConcept >= 0 && firstConcept < firstCode) {
    fail(rootReadme, "run the finished system before any concept section");
  }
}

function checkExpectLines(file: string): void {
  const lines = read(file).split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "```bash") continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "```") j++;
    const linesAfterBlock = lines.slice(j + 1);
    const nextText = linesAfterBlock.find((line) => line.trim() !== "");
    if (!nextText?.startsWith("Expect:")) {
      fail(file, `line ${i + 1}: a bash block must be followed by an Expect: line`);
    }
    i = j;
  }
}

// 5. One model config, exact pins, a troubleshooting table.
function mayNameModels(file: string): boolean {
  return file.includes("/config/models.") || file.includes("/scripts/check.ts");
}

function checkModelIds(files: string[]): void {
  const textFiles = files.filter((file) => /\.(ts|py|md|json|toml|ya?ml)$/.test(file));
  for (const file of textFiles) {
    if (mayNameModels(file)) continue;
    const modelId = read(file).match(MODEL_ID);
    if (modelId) {
      fail(file, `model id "${modelId[0]}" outside config/models; name models in one place`);
    }
  }
}

function checkPackagePins(): void {
  const packageFile = join(ROOT, "package.json");
  if (!existsSync(packageFile)) return;
  const packageJson = JSON.parse(read(packageFile));
  const dependencies: Record<string, string> = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  for (const [name, version] of Object.entries(dependencies)) {
    if (!/^\d+\.\d+\.\d+$/.test(version))
      fail(packageFile, `${name}@${version}: pin an exact version`);
  }
}

function checkPythonPins(): void {
  const pyproject = join(ROOT, "pyproject.toml");
  if (!existsSync(pyproject)) return;
  const loosePin = /"([A-Za-z0-9_.\-[\]]+)\s*(>=|~=|\^|>|<)[^"]*"/g;
  for (const match of read(pyproject).matchAll(loosePin)) {
    fail(pyproject, `${match[1]}: pin with == not ${match[2]}`);
  }
}

function checkTroubleshooting(): void {
  const trouble = join(ROOT, "00-orientation", "troubleshooting.md");
  const tableHeader = /\| *What you see *\| *What it means *\| *Fix *\|/;
  if (!existsSync(trouble) || !tableHeader.test(read(trouble))) {
    fail(
      ROOT,
      "00-orientation/troubleshooting.md needs a table: What you see | What it means | Fix",
    );
  }
}

// 6. Every schedule covers every part, and the minutes add up.
type Schedule = { sessions: { parts: string[]; minutes: number }[] };

function minutesPerPart(allParts: Part[]): Record<string, number> {
  const minutes: Record<string, number> = {};
  for (const part of allParts) {
    minutes[part.name] = part.steps.reduce((total, step) => total + step.meta.minutes, 0);
  }
  return minutes;
}

function checkSchedule(name: string, schedule: Schedule, allParts: Part[], path: string): void {
  const partMinutes = minutesPerPart(allParts);
  const listed = schedule.sessions.flatMap((session) => session.parts);
  for (const part of allParts) {
    if (!listed.includes(part.name)) fail(path, `${name} leaves out part "${part.name}"`);
  }
  for (const session of schedule.sessions) {
    const need = session.parts.reduce((total, part) => total + (partMinutes[part] ?? 0), 0);
    if (need > session.minutes) {
      fail(path, `${name}: a session needs ${need} min but has ${session.minutes}`);
    }
  }
}

function checkSchedules(allParts: Part[]): void {
  const schedulesPath = join(ROOT, "schedules.toml");
  if (!existsSync(schedulesPath)) {
    fail(ROOT, "missing schedules.toml");
    return;
  }
  const schedules = Bun.TOML.parse(read(schedulesPath)) as Record<string, Schedule>;
  for (const [name, schedule] of Object.entries(schedules)) {
    checkSchedule(name, schedule, allParts, schedulesPath);
  }
}

const files = everyFile(ROOT);
const markdownFiles = files.filter((file) => file.endsWith(".md"));
const allParts = parts();

checkNoMakefile(files);
checkProse(markdownFiles);
checkImagesExist(markdownFiles);
checkKeyPictures();
checkParts(allParts);
checkRootReadmeRunsFirst();
for (const file of markdownFiles) checkExpectLines(file);
checkModelIds(files);
checkPackagePins();
checkPythonPins();
checkTroubleshooting();
checkSchedules(allParts);

if (problems.length) {
  console.log(`The repo does not meet the standard. ${problems.length} problem(s):`);
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}
console.log(
  `The repo meets the standard: ${allParts.length} part(s), ${allSteps().length} step(s).`,
);
