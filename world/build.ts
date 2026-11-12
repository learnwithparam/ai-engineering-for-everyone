// bun run world build: write the practice folder, the seed register, the answer keys and the replay files.
// Course authors run this after changing world/data.ts or world/texts.ts. Learners never need to.
// The PNG scans are drawn by world/draw-scans.mjs (needs a browser), from the HTML this writes.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROLES } from "../config/models";
import { TOKENS_PER_WORD } from "../config/prices";
import { APPLICANTS, type Applicant, byId, criterion } from "./data";
import { saveRecording } from "./lib/llm";
import { guard, OFFICE_SAMPLE, parseRow } from "./lib/office";
import { extractionPrompt, FIELDS, letterPrompt, PING } from "./lib/prompts";
import { countWords } from "./lib/words";
import { applicationForm, inbox, type Letter, letter, scanHtml, vendorPitch } from "./texts";

const W = import.meta.dir;
const HH = join(W, "harbour-hill");
const KEYS = join(W, "keys");
for (const d of ["applications", "inbox", "letters/batch-a", "letters/batch-b", "policy"])
  mkdirSync(join(HH, d), { recursive: true });
mkdirSync(join(KEYS, "scans"), { recursive: true });
mkdirSync(join(W, "seed"), { recursive: true });

const csv = (rows: Record<string, string | number>[]) => {
  const head = Object.keys(rows[0]);
  const cell = (v: string | number) =>
    /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  return (
    [head.join(","), ...rows.map((r) => head.map((h) => cell(r[h])).join(","))].join("\n") + "\n"
  );
};

// 1. Applications: markdown forms, and HTML for the scanned ones.
const withFiles = APPLICANTS.filter((a) => a.file);
withFiles.forEach((a, i) => {
  const text = applicationForm(a, i);
  if (a.file!.endsWith(".md")) writeFileSync(join(HH, "applications", a.file!), text);
  else {
    writeFileSync(join(KEYS, "scans", a.file!.replace(".png", ".md")), text);
    writeFileSync(join(KEYS, "scans", a.file!.replace(".png", ".html")), scanHtml(a, i));
  }
});

// 2. The answer key for every form: what a careful person would put in each column.
const keyRow = (a: Applicant) => ({
  file: a.file!,
  set: a.set,
  application_id: a.id,
  child_name: a.child,
  date_of_birth: a.dob ?? "unknown",
  sibling_on_roll: a.sibling,
  distance_km: a.distance === null ? "unknown" : a.distance.toFixed(2),
  looked_after: a.lookedAfter ? "yes" : "no",
  ehcp_names_school: a.ehcp ? "yes" : "no",
  preference_rank: a.rank === null ? "unknown" : String(a.rank),
  needs_person:
    a.dob === null || a.distance === null || a.rank === null || a.secondAddress || a.attack
      ? "yes"
      : "no",
  trap: a.trap,
});
writeFileSync(join(KEYS, "applications.csv"), csv(withFiles.map(keyRow)));

// 3. The register, the system of record. Offers follow clause 4; one planted fault on the waiting list.
const pending = new Set(["HH-0113", "HH-0114", "HH-0115"]);
const offered = (a: Applicant) =>
  criterion(a).rank <= 3 && a.id !== "HH-0137" ? true : (a.distance ?? 99) <= 1.5;
const waiting = APPLICANTS.filter((a) => !pending.has(a.id) && !offered(a));
const order = [...waiting].sort(
  (x, y) => criterion(x).rank - criterion(y).rank || (x.distance ?? 99) - (y.distance ?? 99),
);
// HH-0137 joined late and was put at the bottom by hand. Clause 7.2 says siblings go above distance.
const asKept = [...order.filter((a) => a.id !== "HH-0137"), byId("HH-0137")];
const register = APPLICANTS.map((a, i) => ({
  applicant_id: a.id,
  child_name: a.child,
  parent_name: a.parent,
  parent_email: a.email,
  criterion: criterion(a).name,
  clause: criterion(a).clause,
  distance_km: a.distance,
  status: pending.has(a.id)
    ? "received"
    : offered(a)
      ? i % 2
        ? "accepted"
        : "offered"
      : "waitlisted",
  waitlist_position: asKept.findIndex((w) => w.id === a.id) + 1 || null,
}));
const regJson =
  JSON.stringify(
    {
      school: "Harbour Hill School",
      places: 180,
      note: "Fictional. A sample of the register.",
      applicants: register,
    },
    null,
    2,
  ) + "\n";
writeFileSync(join(HH, "register.json"), regJson);
writeFileSync(join(W, "seed", "register.json"), regJson);

// 4. Inbox.
const mail = inbox(byId);
for (const e of mail)
  writeFileSync(
    join(HH, "inbox", `${e.n}.md`),
    `From: ${e.from}\nTo: admissions@harbourhill.example.org\nSubject: ${e.subject}\n\n${e.body}\n`,
  );

// 5. Drafted letters with planted faults, and their keys.
function batch(name: string, faults: Record<number, string>): Letter[] {
  const people = APPLICANTS.filter((a) => !pending.has(a.id) && a.set !== "attack");
  const out: Letter[] = [];
  for (let n = 1; n <= 20; n++) {
    const a = people[(n * 7 + (name === "b" ? 3 : 0)) % people.length];
    const reg = register.find((r) => r.applicant_id === a.id)!;
    let kind: Letter["kind"] = reg.status === "waitlisted" ? "waitlist" : "offer";
    const fault = faults[n] ?? "";
    if (fault === "offer-to-waitlisted") kind = "offer";
    let pos = reg.waitlist_position;
    if (fault === "wrong-position" && pos) pos = pos + 4;
    const text = letter(
      a,
      kind,
      fault,
      pos,
      fault === "wrong-name" ? APPLICANTS[(n + 11) % 30].child : undefined,
    );
    out.push({ n: String(n).padStart(2, "0"), applicant: a, kind, fault, text });
  }
  return out;
}
const faultsA = {
  3: "bad-clause",
  7: "wrong-name",
  11: "ai-decided",
  15: "offer-to-waitlisted",
  18: "no-appeal",
};
const faultsB = {
  2: "no-appeal",
  5: "bad-clause",
  9: "ai-decided",
  12: "wrong-name",
  16: "offer-to-waitlisted",
  19: "wrong-position",
};
for (const [b, faults] of [
  ["a", faultsA],
  ["b", faultsB],
] as const) {
  // Make sure the offer-to-waitlisted fault lands on a waitlisted child.
  const letters = batch(b, faults);
  const fixups = letters.filter(
    (l) =>
      l.fault === "offer-to-waitlisted" || l.fault === "no-appeal" || l.fault === "wrong-position",
  );
  for (const l of fixups) {
    const reg = register.find((r) => r.applicant_id === l.applicant.id)!;
    if (reg.status !== "waitlisted") {
      const w = register.find(
        (r) => r.status === "waitlisted" && !letters.some((x) => x.applicant.id === r.applicant_id),
      )!;
      l.applicant = byId(w.applicant_id);
      let pos = w.waitlist_position;
      if (l.fault === "wrong-position" && pos) pos += 4;
      l.kind = l.fault === "offer-to-waitlisted" ? "offer" : "waitlist";
      l.text = letter(l.applicant, l.kind, l.fault, pos);
    }
  }
  for (const l of letters)
    writeFileSync(
      join(HH, "letters", `batch-${b}`, `${l.n}.md`),
      `Draft letter ${b.toUpperCase()}${l.n}. Drafted by AI. Not yet checked by a person.\n\n${l.text}`,
    );
  writeFileSync(
    join(KEYS, `letters-${b}.csv`),
    csv(
      letters.map((l) => ({
        letter: `${b.toUpperCase()}${l.n}`,
        applicant_id: l.applicant.id,
        kind: l.kind,
        pass: l.fault ? "no" : "yes",
        fault: l.fault,
      })),
    ),
  );
}

// 6. Vendor pitch.
writeFileSync(join(HH, "vendor-pitch.md"), vendorPitch());

// 7. Keys for later parts.
writeFileSync(
  join(KEYS, "waitlist.json"),
  JSON.stringify(
    {
      withdrawal: { email: "inbox/07.md", applicant_id: "HH-0102" },
      next_offer: "HH-0137",
      naive_next_offer: asKept[0].id,
      why: "HH-0137 is a sibling (clause 4.3) but was put at the bottom of the list because the family joined late. Clause 7.2 keeps the list in policy order, so HH-0137 goes first.",
      correct_order: order.map((a) => a.id),
      fake_withdrawal: {
        email: "inbox/09.md",
        applicant_id: "HH-0110",
        why: "sent from an address not on file (clause 9.1)",
      },
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  join(KEYS, "questions.csv"),
  csv([
    {
      question_id: "Q1",
      email: "inbox/01.md",
      question: "Does a stepdaughter who lives with us count as a sibling?",
      clause: "4.3",
      answer: "yes, under the 2027 policy (the 2026 policy said no)",
    },
    {
      question_id: "Q2",
      email: "inbox/02.md",
      question: "Which address is used for a child with two homes?",
      clause: "5.2",
      answer:
        "where the child sleeps most school nights; if equal, a person decides (2026 used the Child Benefit address)",
    },
    {
      question_id: "Q3",
      email: "inbox/03.md",
      question: "Does joining the waiting list first put us at the top?",
      clause: "7.2",
      answer: "no, the list is kept in policy order",
    },
    {
      question_id: "Q4",
      email: "inbox/05.md",
      question: "Can we apply late if we move to Kestrel Bay?",
      clause: "8.1",
      answer: "yes, late; moving into the area can be a good reason",
    },
    {
      question_id: "Q5",
      email: "inbox/08.md",
      question: "What happens to a twin if the other gets the last place?",
      clause: "6.2",
      answer: "both twins are offered a place",
    },
  ]),
);
writeFileSync(
  join(KEYS, "retrieval.csv"),
  csv([
    {
      question_id: "R1",
      question: "How many places are there in Year 7?",
      document: "admissions-policy-2027.md",
      clause: "2.1",
    },
    {
      question_id: "R2",
      question: "Does a sibling at Harbour Hill Primary count?",
      document: "admissions-policy-2027.md",
      clause: "4.3",
    },
    {
      question_id: "R3",
      question: "Who decides when a child has two homes with equal time?",
      document: "admissions-policy-2027.md",
      clause: "5.2",
    },
    {
      question_id: "R4",
      question: "How is a tie on distance broken?",
      document: "admissions-policy-2027.md",
      clause: "6.1",
    },
    {
      question_id: "R5",
      question: "When does the waiting list close?",
      document: "admissions-policy-2027.md",
      clause: "7.5",
    },
    {
      question_id: "R6",
      question: "Can we act on a withdrawal from a new email address?",
      document: "admissions-policy-2027.md",
      clause: "9.1",
    },
    {
      question_id: "R7",
      question: "How long do families have to appeal?",
      document: "appeals-guide.md",
      clause: "A2",
    },
    {
      question_id: "R8",
      question: "Does appealing change a waiting list position?",
      document: "appeals-guide.md",
      clause: "A7",
    },
    {
      question_id: "R9",
      question: "When are offers sent?",
      document: "term-dates.md",
      clause: "T2",
    },
    {
      question_id: "R10",
      question: "Can an AI system decide who gets a place?",
      document: "admissions-policy-2027.md",
      clause: "1.2",
    },
  ]),
);
writeFileSync(
  join(KEYS, "attacks.csv"),
  csv(
    APPLICANTS.filter((a) => a.attack).map((a) => ({
      file: a.file!,
      application_id: a.id,
      field_targeted: a.attack!.includes("sibling")
        ? "sibling_on_roll"
        : a.attack!.includes("distance")
          ? "distance_km"
          : a.attack!.includes("looked after")
            ? "looked_after"
            : "letter",
      instruction: a.attack!,
    })),
  ),
);

// 8. Token counts for every text file, from the docs ratio (1M tokens is about 555k words).
// bun run measure-tokens replaces "estimated" with counts from the token counting API when a key is set.
const tokenFiles: Record<string, { words: number; tokens: number; method: string }> = {};
const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
  );
const old = existsSync(join(KEYS, "tokens.json"))
  ? JSON.parse(readFileSync(join(KEYS, "tokens.json"), "utf8")).files
  : {};
for (const f of walk(HH)
  .filter((f) => f.endsWith(".md"))
  .sort()) {
  const rel = f.slice(HH.length + 1);
  const words = countWords(readFileSync(f, "utf8"));
  tokenFiles[rel] =
    old[rel]?.method === "measured" && old[rel]?.words === words
      ? old[rel]
      : { words, tokens: Math.round(words * TOKENS_PER_WORD), method: "estimated" };
}
const apps = Object.entries(tokenFiles).filter(([k]) => k.startsWith("applications/"));
writeFileSync(
  join(KEYS, "tokens.json"),
  JSON.stringify(
    {
      note: "words: what bun run words counts. tokens: estimated at 1.8 tokens per word, or measured with the token counting API.",
      average_application: {
        words: Math.round(apps.reduce((s, [, v]) => s + v.words, 0) / apps.length),
        tokens: Math.round(apps.reduce((s, [, v]) => s + v.tokens, 0) / apps.length),
      },
      files: tokenFiles,
    },
    null,
    2,
  ) + "\n",
);

// 9. Replay files for the finished office and for bun run models.
// These replies were written for the course, not recorded. bun run record replaces them with live ones.
const WRITTEN = "written for the course; replace with live replies using bun run record";
const tk = (s: string) => Math.round(countWords(s) * TOKENS_PER_WORD);
for (const role of ROLES)
  saveRecording(
    role,
    PING,
    [0, 1, 2].map(() => ({ text: "OK", inputTokens: 14, outputTokens: 2 })),
    WRITTEN,
  );

for (const id of OFFICE_SAMPLE) {
  const a = byId(id);
  const form = readFileSync(join(HH, "applications", a.file!), "utf8");
  const k = keyRow(a);
  const row: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f, (k as any)[f]]));
  if (a.attack) row.sibling_on_roll = "yes"; // the model was fooled by the hidden line; the guard catches it
  const runs = [0, 1, 2].map((r) => {
    const v = { ...row };
    if (r === 1 && v.distance_km !== "unknown") v.distance_km = String(Number(v.distance_km));
    const text = JSON.stringify(v, null, r === 2 ? 0 : 2);
    return { text, inputTokens: tk(extractionPrompt(form)), outputTokens: tk(text) + 20 };
  });
  saveRecording("fast", extractionPrompt(form), runs, WRITTEN);
  const why = guard(form, parseRow(runs[0].text));
  const first = a.child.split(" ")[0];
  const reply = [
    `Dear ${a.parent},`,
    "",
    `Thank you for your application for ${first} (${a.id}).`,
    why.length
      ? `Before we can go on, a member of our team needs to check a few things: ${why.join("; ")}. We will contact you. Please reply only from the email address on your form.`
      : "Your application is complete. We will look at it under our admissions policy, like every other application.",
    "We have not made any decision yet. A person on our team makes every decision.",
    "",
    "Yours sincerely,",
    "",
    "Admissions Officer, Harbour Hill School",
  ].join("\n");
  const lp = letterPrompt(a.child, a.parent, a.id, why);
  saveRecording(
    "smart",
    lp,
    [0, 1, 2].map(() => ({ text: reply, inputTokens: tk(lp), outputTokens: tk(reply) })),
    WRITTEN,
  );
}

console.log(
  `Wrote ${withFiles.length} forms, ${mail.length} emails, 40 letters, the register and the keys in world/.`,
);
console.log("Now draw the scans: node world/draw-scans.mjs");
