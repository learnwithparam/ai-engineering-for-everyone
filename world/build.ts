// bun run world build: write the practice folder, the seed register, the keys and the replay files.
// Course authors run this after changing world/data.ts or world/texts.ts. Learners never need to.
// The PNG scans are drawn by world/draw-scans.mjs (needs a browser), from the HTML this writes.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROLES } from "../config/models";
import { TOKENS_PER_WORD } from "../config/prices";
import { APPLICANTS, type Applicant, byId, criterion } from "./data";
import { type Recorded, saveRecording } from "./lib/llm";
import { guard, OFFICE_SAMPLE, parseRow } from "./lib/office";
import { extractionPrompt, FIELDS, letterPrompt, PING } from "./lib/prompts";
import { countWords } from "./lib/words";
import {
  applicationForm,
  type Email,
  inbox,
  type Letter,
  letter,
  scanHtml,
  vendorPitch,
} from "./texts";

const WORLD = import.meta.dir;
const HARBOUR_HILL = join(WORLD, "harbour-hill");
const KEYS = join(WORLD, "keys");
const SCANS = join(KEYS, "scans");
const SEED = join(WORLD, "seed");

const OFFICE_FOLDERS = ["applications", "inbox", "letters/batch-a", "letters/batch-b", "policy"];
for (const folder of OFFICE_FOLDERS) mkdirSync(join(HARBOUR_HILL, folder), { recursive: true });
mkdirSync(SCANS, { recursive: true });
mkdirSync(SEED, { recursive: true });

// ---------- Small helpers for writing files ----------

type CsvRow = Record<string, string | number>;

// A cell that holds a comma, a quote or a new line goes in quotes, as the CSV format asks.
function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function csv(rows: CsvRow[]): string {
  const columns = Object.keys(rows[0]);
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((column) => csvCell(row[column])).join(","));
  return `${[header, ...lines].join("\n")}\n`;
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Our code uses camelCase names, but the files learners open use snake_case, like application_id.
function snakeCaseName(name: string): string {
  return name.replace(/[A-Z]/g, (capital) => `_${capital.toLowerCase()}`);
}

function withSnakeCaseKeys<Value>(record: Record<string, Value>): Record<string, Value> {
  const entries = Object.entries(record).map(([name, value]) => [snakeCaseName(name), value]);
  return Object.fromEntries(entries);
}

function yesOrNo(isTrue: boolean): string {
  return isTrue ? "yes" : "no";
}

function formFile(applicant: Applicant): string {
  if (applicant.file === null) throw new Error(`${applicant.id} has no form in the folder`);
  return applicant.file;
}

// ---------- 1. Applications: markdown forms, and HTML for the scanned ones ----------

const applicantsWithForms = APPLICANTS.filter((applicant) => applicant.file);

function writeApplicationForms() {
  applicantsWithForms.forEach((applicant, i) => {
    const file = formFile(applicant);
    const text = applicationForm(applicant, i);
    if (file.endsWith(".md")) {
      writeFileSync(join(HARBOUR_HILL, "applications", file), text);
      return;
    }
    // A scan's text and HTML go in the keys; draw-scans.mjs turns the HTML into the PNG.
    writeFileSync(join(SCANS, file.replace(".png", ".md")), text);
    writeFileSync(join(SCANS, file.replace(".png", ".html")), scanHtml(applicant, i));
  });
}

// ---------- 2. The answer key for every form ----------

// A person must look when the form leaves something out, gives two homes or hides an order.
function needsPerson(applicant: Applicant): boolean {
  const leftOut = applicant.dob === null || applicant.distance === null || applicant.rank === null;
  return leftOut || Boolean(applicant.secondAddress) || Boolean(applicant.attack);
}

// What a careful person would put in each column for this form.
function answerKeyRow(applicant: Applicant): Record<string, string> {
  const distance = applicant.distance;
  const rank = applicant.rank;
  return withSnakeCaseKeys({
    file: formFile(applicant),
    set: applicant.set,
    applicationId: applicant.id,
    childName: applicant.child,
    dateOfBirth: applicant.dob ?? "unknown",
    siblingOnRoll: applicant.sibling,
    distanceKm: distance === null ? "unknown" : distance.toFixed(2),
    lookedAfter: yesOrNo(applicant.lookedAfter),
    ehcpNamesSchool: yesOrNo(applicant.ehcp),
    preferenceRank: rank === null ? "unknown" : String(rank),
    needsPerson: yesOrNo(needsPerson(applicant)),
    trap: applicant.trap,
  });
}

function writeApplicationsKey() {
  const rows = applicantsWithForms.map(answerKeyRow);
  writeFileSync(join(KEYS, "applications.csv"), csv(rows));
}

// ---------- 3. The register, the system of record ----------

// These three forms have arrived but nobody has decided on them yet.
const NOT_DECIDED = new Set(["HH-0113", "HH-0114", "HH-0115"]);
// HH-0137 joined late and was put at the bottom by hand. Clause 7.2 puts siblings above distance.
const LATE_SIBLING = "HH-0137";
// A missing distance sorts as very far away.
const FAR_AWAY_KM = 99;
const OFFER_DISTANCE_KM = 1.5;

type RegisterEntry = {
  applicantId: string;
  childName: string;
  parentName: string;
  parentEmail: string;
  criterion: string;
  clause: string;
  distanceKm: number | null;
  status: string;
  waitlistPosition: number | null;
};

function distanceOrFar(applicant: Applicant): number {
  return applicant.distance ?? FAR_AWAY_KM;
}

// Offers follow clause 4: everyone above distance, then children who live close enough.
function isOffered(applicant: Applicant): boolean {
  const aboveDistance = criterion(applicant).rank <= 3;
  if (aboveDistance && applicant.id !== LATE_SIBLING) return true;
  return distanceOrFar(applicant) <= OFFER_DISTANCE_KM;
}

function inPolicyOrder(first: Applicant, second: Applicant): number {
  const byCriterion = criterion(first).rank - criterion(second).rank;
  return byCriterion || distanceOrFar(first) - distanceOrFar(second);
}

const waiting = APPLICANTS.filter(
  (applicant) => !NOT_DECIDED.has(applicant.id) && !isOffered(applicant),
);
const waitingInPolicyOrder = [...waiting].sort(inPolicyOrder);
// The one planted fault on the waiting list: the late sibling sits at the bottom.
const waitingAsKept = [
  ...waitingInPolicyOrder.filter((applicant) => applicant.id !== LATE_SIBLING),
  byId(LATE_SIBLING),
];

function registerStatus(applicant: Applicant, i: number): string {
  if (NOT_DECIDED.has(applicant.id)) return "received";
  if (!isOffered(applicant)) return "waitlisted";
  // Every other offered family has said yes already, so the register shows both.
  if (i % 2 === 1) return "accepted";
  return "offered";
}

function waitlistPosition(applicant: Applicant): number | null {
  const index = waitingAsKept.findIndex((entry) => entry.id === applicant.id);
  if (index === -1) return null;
  return index + 1;
}

function registerEntry(applicant: Applicant, i: number): RegisterEntry {
  const place = criterion(applicant);
  return {
    applicantId: applicant.id,
    childName: applicant.child,
    parentName: applicant.parent,
    parentEmail: applicant.email,
    criterion: place.name,
    clause: place.clause,
    distanceKm: applicant.distance,
    status: registerStatus(applicant, i),
    waitlistPosition: waitlistPosition(applicant),
  };
}

const register = APPLICANTS.map(registerEntry);

function findRegisterEntry(applicantId: string): RegisterEntry {
  const entry = register.find((candidate) => candidate.applicantId === applicantId);
  if (!entry) throw new Error(`${applicantId} is not in the register`);
  return entry;
}

function writeRegister() {
  const registerFile = {
    school: "Harbour Hill School",
    places: 180,
    note: "Fictional. A sample of the register.",
    applicants: register.map((entry) => withSnakeCaseKeys(entry)),
  };
  const text = jsonText(registerFile);
  writeFileSync(join(HARBOUR_HILL, "register.json"), text);
  writeFileSync(join(SEED, "register.json"), text);
}

// ---------- 4. Inbox ----------

const OFFICE_EMAIL = "admissions@harbourhill.example.org";

function emailText(email: Email): string {
  const header = `From: ${email.from}\nTo: ${OFFICE_EMAIL}\nSubject: ${email.subject}`;
  return `${header}\n\n${email.body}\n`;
}

function writeInbox(emails: Email[]) {
  for (const email of emails) {
    writeFileSync(join(HARBOUR_HILL, "inbox", `${email.fileNumber}.md`), emailText(email));
  }
}

// ---------- 5. Drafted letters with planted faults, and their keys ----------

type BatchName = "a" | "b";
// Which letter number gets which planted fault.
type Faults = Record<number, string>;

const LETTERS_PER_BATCH = 20;
const FAULTS_IN_BATCH_A: Faults = {
  3: "bad-clause",
  7: "wrong-name",
  11: "ai-decided",
  15: "offer-to-waitlisted",
  18: "no-appeal",
};
const FAULTS_IN_BATCH_B: Faults = {
  2: "no-appeal",
  5: "bad-clause",
  9: "ai-decided",
  12: "wrong-name",
  16: "offer-to-waitlisted",
  19: "wrong-position",
};
// These faults only make sense in a letter to a child on the waiting list.
const WAITLIST_FAULTS = new Set(["offer-to-waitlisted", "no-appeal", "wrong-position"]);

const familiesWhoGetLetters = APPLICANTS.filter(
  (applicant) => !NOT_DECIDED.has(applicant.id) && applicant.set !== "attack",
);

// The planted fault "wrong-position" moves the child four places down the list.
function positionInLetter(fault: string, position: number | null): number | null {
  if (fault === "wrong-position" && position) return position + 4;
  return position;
}

function letterKind(fault: string, status: string): Letter["kind"] {
  if (fault === "offer-to-waitlisted") return "offer";
  if (status === "waitlisted") return "waitlist";
  return "offer";
}

function draftLetter(batchName: BatchName, letterNumber: number, fault: string): Letter {
  // Batch b starts three families further on, so the two batches hold different letters.
  const offset = batchName === "b" ? 3 : 0;
  const familyIndex = (letterNumber * 7 + offset) % familiesWhoGetLetters.length;
  const applicant = familiesWhoGetLetters[familyIndex];
  const entry = findRegisterEntry(applicant.id);
  const kind = letterKind(fault, entry.status);
  const position = positionInLetter(fault, entry.waitlistPosition);
  let swapName: string | undefined;
  if (fault === "wrong-name") swapName = APPLICANTS[(letterNumber + 11) % 30].child;
  const text = letter({ applicant, kind, fault, position, swapName });
  const fileNumber = String(letterNumber).padStart(2, "0");
  return { fileNumber, applicant, kind, fault, text };
}

function firstWaitlistedWithoutLetter(letters: Letter[]): RegisterEntry {
  const hasLetter = (entry: RegisterEntry) =>
    letters.some((draft) => draft.applicant.id === entry.applicantId);
  const found = register.find((entry) => entry.status === "waitlisted" && !hasLetter(entry));
  if (!found) throw new Error("Every child on the waiting list already has a letter");
  return found;
}

// Make sure a waiting-list fault lands on a child who really is on the waiting list.
function moveToWaitlistedChild(draft: Letter, letters: Letter[]) {
  if (findRegisterEntry(draft.applicant.id).status === "waitlisted") return;
  const replacement = firstWaitlistedWithoutLetter(letters);
  draft.applicant = byId(replacement.applicantId);
  draft.kind = draft.fault === "offer-to-waitlisted" ? "offer" : "waitlist";
  const position = positionInLetter(draft.fault, replacement.waitlistPosition);
  const fault = draft.fault;
  draft.text = letter({ applicant: draft.applicant, kind: draft.kind, fault, position });
}

function draftBatch(batchName: BatchName, faults: Faults): Letter[] {
  const letters: Letter[] = [];
  for (let letterNumber = 1; letterNumber <= LETTERS_PER_BATCH; letterNumber++) {
    letters.push(draftLetter(batchName, letterNumber, faults[letterNumber] ?? ""));
  }
  for (const draft of letters) {
    if (WAITLIST_FAULTS.has(draft.fault)) moveToWaitlistedChild(draft, letters);
  }
  return letters;
}

function writeLetterBatch(batchName: BatchName, faults: Faults) {
  const letters = draftBatch(batchName, faults);
  const label = batchName.toUpperCase();
  const folder = join(HARBOUR_HILL, "letters", `batch-${batchName}`);
  for (const draft of letters) {
    const warning = "Drafted by AI. Not yet checked by a person.";
    const heading = `Draft letter ${label}${draft.fileNumber}. ${warning}`;
    writeFileSync(join(folder, `${draft.fileNumber}.md`), `${heading}\n\n${draft.text}`);
  }
  const keyRows = letters.map((draft) =>
    withSnakeCaseKeys({
      letter: `${label}${draft.fileNumber}`,
      applicantId: draft.applicant.id,
      kind: draft.kind,
      pass: draft.fault ? "no" : "yes",
      fault: draft.fault,
    }),
  );
  writeFileSync(join(KEYS, `letters-${batchName}.csv`), csv(keyRows));
}

// ---------- 7. Keys for later parts ----------

function writeWaitlistKey() {
  const waitlistKey = withSnakeCaseKeys<unknown>({
    withdrawal: withSnakeCaseKeys({ email: "inbox/07.md", applicantId: "HH-0102" }),
    nextOffer: LATE_SIBLING,
    naiveNextOffer: waitingAsKept[0].id,
    why:
      "HH-0137 is a sibling (clause 4.3) but was put at the bottom of the list because the " +
      "family joined late. Clause 7.2 keeps the list in policy order, so HH-0137 goes first.",
    correctOrder: waitingInPolicyOrder.map((applicant) => applicant.id),
    fakeWithdrawal: withSnakeCaseKeys({
      email: "inbox/09.md",
      applicantId: "HH-0110",
      why: "sent from an address not on file (clause 9.1)",
    }),
  });
  writeFileSync(join(KEYS, "waitlist.json"), jsonText(waitlistKey));
}

const QUESTIONS_KEY: CsvRow[] = [
  {
    questionId: "Q1",
    email: "inbox/01.md",
    question: "Does a stepdaughter who lives with us count as a sibling?",
    clause: "4.3",
    answer: "yes, under the 2027 policy (the 2026 policy said no)",
  },
  {
    questionId: "Q2",
    email: "inbox/02.md",
    question: "Which address is used for a child with two homes?",
    clause: "5.2",
    answer:
      "where the child sleeps most school nights; if equal, a person decides " +
      "(2026 used the Child Benefit address)",
  },
  {
    questionId: "Q3",
    email: "inbox/03.md",
    question: "Does joining the waiting list first put us at the top?",
    clause: "7.2",
    answer: "no, the list is kept in policy order",
  },
  {
    questionId: "Q4",
    email: "inbox/05.md",
    question: "Can we apply late if we move to Kestrel Bay?",
    clause: "8.1",
    answer: "yes, late; moving into the area can be a good reason",
  },
  {
    questionId: "Q5",
    email: "inbox/08.md",
    question: "What happens to a twin if the other gets the last place?",
    clause: "6.2",
    answer: "both twins are offered a place",
  },
];

const POLICY_2027 = "admissions-policy-2027.md";
const RETRIEVAL_KEY: CsvRow[] = [
  {
    questionId: "R1",
    question: "How many places are there in Year 7?",
    document: POLICY_2027,
    clause: "2.1",
  },
  {
    questionId: "R2",
    question: "Does a sibling at Harbour Hill Primary count?",
    document: POLICY_2027,
    clause: "4.3",
  },
  {
    questionId: "R3",
    question: "Who decides when a child has two homes with equal time?",
    document: POLICY_2027,
    clause: "5.2",
  },
  {
    questionId: "R4",
    question: "How is a tie on distance broken?",
    document: POLICY_2027,
    clause: "6.1",
  },
  {
    questionId: "R5",
    question: "When does the waiting list close?",
    document: POLICY_2027,
    clause: "7.5",
  },
  {
    questionId: "R6",
    question: "Can we act on a withdrawal from a new email address?",
    document: POLICY_2027,
    clause: "9.1",
  },
  {
    questionId: "R7",
    question: "How long do families have to appeal?",
    document: "appeals-guide.md",
    clause: "A2",
  },
  {
    questionId: "R8",
    question: "Does appealing change a waiting list position?",
    document: "appeals-guide.md",
    clause: "A7",
  },
  {
    questionId: "R9",
    question: "When are offers sent?",
    document: "term-dates.md",
    clause: "T2",
  },
  {
    questionId: "R10",
    question: "Can an AI system decide who gets a place?",
    document: POLICY_2027,
    clause: "1.2",
  },
];

// Which column the hidden instruction in a form tries to change.
function fieldTargeted(instruction: string): string {
  if (instruction.includes("sibling")) return "sibling_on_roll";
  if (instruction.includes("distance")) return "distance_km";
  if (instruction.includes("looked after")) return "looked_after";
  return "letter";
}

function attackRow(applicant: Applicant): CsvRow {
  const instruction = applicant.attack ?? "";
  return withSnakeCaseKeys({
    file: formFile(applicant),
    applicationId: applicant.id,
    fieldTargeted: fieldTargeted(instruction),
    instruction,
  });
}

function writeLaterKeys() {
  writeWaitlistKey();
  writeFileSync(join(KEYS, "questions.csv"), csv(QUESTIONS_KEY.map(withSnakeCaseKeys)));
  writeFileSync(join(KEYS, "retrieval.csv"), csv(RETRIEVAL_KEY.map(withSnakeCaseKeys)));
  const attackRows = APPLICANTS.filter((applicant) => applicant.attack).map(attackRow);
  writeFileSync(join(KEYS, "attacks.csv"), csv(attackRows));
}

// ---------- 8. Token counts for every text file ----------

// Estimated from the docs ratio (1M tokens is about 555k words). bun run measure-tokens
// replaces "estimated" with counts from the token counting API when a key is set.
type TokenCount = { words: number; tokens: number; method: string };

const TOKENS_FILE = join(KEYS, "tokens.json");

function allFilesIn(folder: string): string[] {
  const entries = readdirSync(folder, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return allFilesIn(path);
    return [path];
  });
}

function readOldTokenCounts(): Record<string, TokenCount> {
  if (!existsSync(TOKENS_FILE)) return {};
  return JSON.parse(readFileSync(TOKENS_FILE, "utf8")).files;
}

function estimatedTokens(text: string): number {
  return Math.round(countWords(text) * TOKENS_PER_WORD);
}

// A measured count is kept for as long as the file still has the same number of words.
function countTokensInFolder(): Record<string, TokenCount> {
  const oldCounts = readOldTokenCounts();
  const counts: Record<string, TokenCount> = {};
  const markdownFiles = allFilesIn(HARBOUR_HILL).filter((file) => file.endsWith(".md"));
  for (const file of markdownFiles.sort()) {
    const name = file.slice(HARBOUR_HILL.length + 1);
    const words = countWords(readFileSync(file, "utf8"));
    const old = oldCounts[name];
    const tokens = Math.round(words * TOKENS_PER_WORD);
    if (old?.method === "measured" && old.words === words) counts[name] = old;
    else counts[name] = { words, tokens, method: "estimated" };
  }
  return counts;
}

function roundedAverage(numbers: number[]): number {
  const total = numbers.reduce((sum, value) => sum + value, 0);
  return Math.round(total / numbers.length);
}

function writeTokenCounts() {
  const counts = countTokensInFolder();
  const forms = Object.entries(counts)
    .filter(([name]) => name.startsWith("applications/"))
    .map(([, count]) => count);
  const summary = withSnakeCaseKeys<unknown>({
    note:
      "words: what bun run words counts. tokens: estimated at 1.8 tokens per word, " +
      "or measured with the token counting API.",
    averageApplication: {
      words: roundedAverage(forms.map((count) => count.words)),
      tokens: roundedAverage(forms.map((count) => count.tokens)),
    },
  });
  writeFileSync(TOKENS_FILE, jsonText({ ...summary, files: counts }));
}

// ---------- 9. Replay files for the finished office and for bun run models ----------

// These replies were written for the course, not recorded. bun run record replaces them.
const WRITTEN = "written for the course; replace with live replies using bun run record";
const RUNS = [0, 1, 2];

function writePingReplies() {
  for (const role of ROLES) {
    const replies = RUNS.map(() => ({ text: "OK", inputTokens: 14, outputTokens: 2 }));
    saveRecording(role, PING, replies, WRITTEN);
  }
}

// The three runs give the same answers written a little differently, as real runs do.
function extractionReplies(form: string, answers: Record<string, string>): Recorded[] {
  const prompt = extractionPrompt(form);
  return RUNS.map((run) => {
    const values = { ...answers };
    if (run === 1 && values.distance_km !== "unknown") {
      values.distance_km = String(Number(values.distance_km));
    }
    const text = JSON.stringify(values, null, run === 2 ? 0 : 2);
    return { text, inputTokens: estimatedTokens(prompt), outputTokens: estimatedTokens(text) + 20 };
  });
}

function replyMiddle(reasons: string[]): string {
  if (reasons.length === 0) {
    const complete = "Your application is complete.";
    const next = "We will look at it under our admissions policy, like every other application.";
    return `${complete} ${next}`;
  }
  const intro = "Before we can go on, a member of our team needs to check a few things:";
  const ask = "We will contact you. Please reply only from the email address on your form.";
  return `${intro} ${reasons.join("; ")}. ${ask}`;
}

function writtenLetterReply(applicant: Applicant, reasons: string[]): string {
  const firstName = applicant.child.split(" ")[0];
  return [
    `Dear ${applicant.parent},`,
    "",
    `Thank you for your application for ${firstName} (${applicant.id}).`,
    replyMiddle(reasons),
    "We have not made any decision yet. A person on our team makes every decision.",
    "",
    "Yours sincerely,",
    "",
    "Admissions Officer, Harbour Hill School",
  ].join("\n");
}

function writeOfficeReplies(applicantId: string) {
  const applicant = byId(applicantId);
  const form = readFileSync(join(HARBOUR_HILL, "applications", formFile(applicant)), "utf8");
  const key = answerKeyRow(applicant);
  const answers: Record<string, string> = Object.fromEntries(
    FIELDS.map((field) => [field, key[field]]),
  );
  // The model was fooled by the hidden line; the guard catches it.
  if (applicant.attack) answers.sibling_on_roll = "yes";
  const runs = extractionReplies(form, answers);
  saveRecording("fast", extractionPrompt(form), runs, WRITTEN);

  const reasons = guard(form, parseRow(runs[0].text));
  const reply = writtenLetterReply(applicant, reasons);
  const prompt = letterPrompt(applicant.child, applicant.parent, applicant.id, reasons);
  const tokens = { inputTokens: estimatedTokens(prompt), outputTokens: estimatedTokens(reply) };
  const replies = RUNS.map(() => ({ text: reply, ...tokens }));
  saveRecording("smart", prompt, replies, WRITTEN);
}

// ---------- Build everything, in order ----------

writeApplicationForms();
writeApplicationsKey();
writeRegister();
const emails = inbox(byId);
writeInbox(emails);
writeLetterBatch("a", FAULTS_IN_BATCH_A);
writeLetterBatch("b", FAULTS_IN_BATCH_B);
// 6. The vendor pitch.
writeFileSync(join(HARBOUR_HILL, "vendor-pitch.md"), vendorPitch());
writeLaterKeys();
// Token counts read the finished folder, so they come after every file is written.
writeTokenCounts();
writePingReplies();
for (const applicantId of OFFICE_SAMPLE) writeOfficeReplies(applicantId);

const forms = applicantsWithForms.length;
console.log(
  `Wrote ${forms} forms, ${emails.length} emails, 40 letters, the register and the keys in world/.`,
);
console.log("Now draw the scans: node world/draw-scans.mjs");
