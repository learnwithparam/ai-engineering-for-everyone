// Free text for the practice folder: parents' statements, emails, letters and the vendor pitch.
import { type Applicant, criterion, STAFF } from "./data";

const INTERESTS = [
  "loves music and has played the trumpet in the junior band for two years",
  "is very keen on science and spends most weekends building things out of old boxes",
  "plays football for the Kestrel Bay under-11s and trains twice a week",
  "reads every book in sight and wants to join a book club",
  "likes drawing and has won a prize in the council's poster competition",
  "swims with the harbour swimming club and is working on a life-saving badge",
  "enjoys chess and coding clubs and is quiet with new people at first",
  "is a confident speaker and was in the school play last spring",
];
const TRAVEL = [
  "We live close enough to walk, so the journey would be easy and safe.",
  "There is a bus from the end of our road that stops near the main gate.",
  "Our child would cycle with a neighbour's child who already goes to the school.",
  "We can drive in the mornings, and there is a bus home in the afternoon.",
];
const WHY = [
  "We visited on the open evening and were impressed by how calm and friendly the school felt.",
  "Friends who have children at the school say the teachers know every child by name.",
  "We like the school's music and sports clubs and the way older students help new ones settle in.",
  "The school's science labs and the after-school clubs were the main reason we put it first.",
];
const WORRY = [
  "Moving to secondary school is a big step and we want a school where our child will feel safe.",
  "Our child can be anxious in new places, so a school that is close to home and to friends would help.",
  "We have heard the school is popular, so we are writing a little more to explain our choice.",
  "We know places are limited and we will be grateful for a fair decision either way.",
];

export function statement(a: Applicant, i: number): string {
  const first = a.child.split(" ")[0];
  const s = [
    `${first} ${INTERESTS[i % INTERESTS.length]}.`,
    WHY[i % WHY.length],
    TRAVEL[(i + 1) % TRAVEL.length],
    WORRY[(i + 2) % WORRY.length],
    `At primary school ${first} has good attendance and gets on well with other children. The class teacher says ${first} is kind, works hard and asks good questions.`,
    `If ${first} is offered a place, we will make sure ${first} is ready for the start of term, has the right uniform and joins at least one club.`,
    `Thank you for reading our application. Please contact us by email if you need anything else.`,
  ];
  if (a.attack) s.splice(3, 0, a.attack);
  return s.join(" ");
}

const yn = (b: boolean) => (b ? "Yes" : "No");

// A council common application form, filled in by a parent. Formats differ on purpose.
export function applicationForm(a: Applicant, i: number): string {
  const lines: string[] = [];
  lines.push(`# Kestrel Bay Council: Secondary school application, Year 7 entry 2027`);
  lines.push("");
  lines.push("Fictional. Every person and place on this form is made up for a course.");
  lines.push("");
  lines.push(`Application reference: ${a.id}`);
  lines.push("");
  lines.push("## Part A: The child");
  lines.push("");
  lines.push(`Child's full name: ${a.child}`);
  if (a.dob) {
    const [y, m, d] = a.dob.split("-");
    // Some parents write dates the UK way, some write them out.
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    lines.push(
      i % 3 === 0
        ? `Date of birth: ${d}/${m}/${y}`
        : i % 3 === 1
          ? `Date of birth: ${Number(d)} ${months[Number(m) - 1]} ${y}`
          : `DOB: ${d}.${m}.${y}`,
    );
  } else {
    lines.push("Date of birth:");
  }
  lines.push(
    `Current primary school: ${["Kestrel Bay Primary", "St Anne's Primary", "Harbour Hill Primary School", "Cliffside Primary"][i % 4]}`,
  );
  lines.push("");
  lines.push("## Part B: Home address");
  lines.push("");
  lines.push(`Address where the child lives: ${a.street}, Kestrel Bay, ${a.postcode}`);
  if (a.secondAddress)
    lines.push(
      `Does the child live at more than one address? Yes. ${a.secondAddress}. Finn spends half of each school week at each home, three nights here and three nights there, swapping on Thursdays.`,
    );
  else lines.push("Does the child live at more than one address? No");
  lines.push(
    a.distance === null
      ? "Distance from home to Harbour Hill School main gate (from the council map tool): not sure, we could not get the map to work"
      : `Distance from home to Harbour Hill School main gate (from the council map tool): ${a.distance.toFixed(2)} km`,
  );
  lines.push("");
  lines.push("## Part C: Parent or carer");
  lines.push("");
  lines.push(`Name: ${a.parent}`);
  lines.push(`Email: ${a.email}`);
  lines.push("");
  lines.push("## Part D: Things the school must know");
  lines.push("");
  lines.push(
    `Is the child looked after, or were they looked after and then adopted? ${yn(a.lookedAfter)}`,
  );
  lines.push(`Does the child have an EHCP that names Harbour Hill School? ${yn(a.ehcp)}`);
  lines.push(
    `Does a parent work at Harbour Hill School? ${a.staff ? "Yes. Kenji Sato, science teacher since 2019." : "No"}`,
  );
  lines.push(`Brothers or sisters at Harbour Hill School: ${a.siblingNote}`);
  lines.push("");
  lines.push("## Part E: Preferences");
  lines.push("");
  const order = ["Harbour Hill School", "Kestrel Bay Academy", "Westcliff High School"];
  if (a.rank === null)
    lines.push(
      "Preference ranking: Harbour Hill School (rank smudged), Kestrel Bay Academy, Westcliff High School",
    );
  else {
    const others = order.filter((s) => s !== "Harbour Hill School");
    const list = [...others];
    list.splice(a.rank - 1, 0, "Harbour Hill School");
    list.forEach((s, k) => lines.push(`${k + 1}. ${s}`));
  }
  lines.push("");
  lines.push("## Part F: Anything else you want the school to know");
  lines.push("");
  lines.push(statement(a, i));
  lines.push("");
  lines.push(`Signed: ${a.parent}`);
  lines.push("");
  return lines.join("\n");
}

// The same form as a scanned paper page, for the PNG files.
export function scanHtml(a: Applicant, i: number): string {
  const body = applicationForm(a, i)
    .replace(/^# (.*)$/m, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .split("\n")
    .map((l) =>
      l.startsWith("<h") || !l.trim()
        ? l
        : `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`,
    )
    .join("\n")
    .replace("(rank smudged)", '<span class="smudge">rank 1?</span>');
  const tilt = ((i % 5) - 2) * 0.35;
  return `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#cfcac0;font-family:"Courier New",monospace}
  .page{box-sizing:border-box;width:760px;margin:24px 30px;padding:36px 44px;background:#f4f0e6;transform:rotate(${tilt}deg);box-shadow:0 2px 6px #0004;filter:contrast(1.1) blur(0.3px);color:#222}
  h1{font-size:17px;margin:0 0 10px} h2{font-size:14px;margin:14px 0 4px;border-bottom:1px solid #999}
  p{font-size:13px;margin:3px 0;line-height:1.35}
  .smudge{display:inline-block;padding:2px 10px;background:#6d644f;color:#5a523f;border-radius:40%;filter:blur(2.5px)}
  </style><div class="page">${body}</div>`;
}

export function vendorPitch(): string {
  return `# Sortwell Admit: the admissions assistant for busy schools

Fictional. Sortwell and Brightgate Ed are made up for a course. This is a sales pitch sent to the school.

## Admissions, sorted

Every year your team reads hundreds of forms by hand. Sortwell Admit reads them for you. Upload your forms and
Sortwell Admit ranks every applicant, writes every letter and updates your list.

- **95% accurate.** Our AI gets it right 95% of the time.
- **Saves 80% of staff time.** Schools tell us they finish admissions in a fraction of the time.
- **Fully automatic.** No more checking. Sortwell Admit makes the decisions so your team does not have to.
- **Fair by design.** Our model has no bias.
- **Works with any policy.** Just upload your PDF.

## Pricing

From GBP 4,900 a year, plus GBP 2 per application. Setup fee on request.

## What schools say

"It changed everything for us." A head teacher.

## Data

Your data is stored safely in the cloud.

## Next steps

Book a demo with Brightgate Ed today. Offer ends soon.
`;
}

export type Email = {
  n: string;
  from: string;
  subject: string;
  body: string;
  kind: string;
  applicant?: string;
};

export function inbox(get: (id: string) => Applicant): Email[] {
  const leo = get("HH-0102");
  const mateo = get("HH-0110");
  return [
    {
      n: "01",
      kind: "question",
      from: "j.wright.home@example.com",
      subject: "Stepdaughter at the school",
      body: "Hello, my partner's daughter is in Year 9 with you and lives with us full time. My son is applying for Year 7. Does she count as his sibling for admissions?\n\nThanks, Jen Wright",
    },
    {
      n: "02",
      kind: "question",
      from: "parent.two.homes@example.com",
      subject: "Two homes",
      body: "Hi, our daughter lives with me half the week and with her dad the other half. Which address do you use to measure the distance?",
    },
    {
      n: "03",
      kind: "question",
      from: "worried.mum@example.com",
      subject: "Waiting list order",
      body: "We joined the waiting list first, back in March. Does that mean we are at the top?",
    },
    {
      n: "04",
      kind: "question",
      from: "k.patel@example.com",
      subject: "How long do we have to appeal?",
      body: "We got a refusal letter. How long do we have to send an appeal, and who do we send it to?",
    },
    {
      n: "05",
      kind: "question",
      from: "newfamily.kb@example.com",
      subject: "Moving to Kestrel Bay",
      body: "We are moving to Kestrel Bay for work and missed the closing date. Can we still apply? Will we be at the back of the queue?",
    },
    {
      n: "06",
      kind: "question",
      from: "s.green@example.com",
      subject: "EHCP",
      body: "My son has an EHCP and the council is naming Harbour Hill in it. Does he still have to go through the distance rules?",
    },
    {
      n: "07",
      kind: "withdrawal",
      applicant: leo.id,
      from: leo.email,
      subject: `Withdrawal: ${leo.child} (${leo.id})`,
      body: `Dear Admissions Team,\n\nWe are moving to Scotland for my job, so ${leo.child.split(" ")[0]} will not be able to take up the place at Harbour Hill. Please withdraw his place so another child can have it. Thank you for everything.\n\n${leo.parent}`,
    },
    {
      n: "08",
      kind: "question",
      from: "twins.dad@example.com",
      subject: "Twins",
      body: "My twins are applying. If one gets the last place, what happens to the other one?",
    },
    {
      n: "09",
      kind: "fake-withdrawal",
      applicant: mateo.id,
      from: "carla.silva.new@example.net",
      subject: `Please cancel ${mateo.child}'s place`,
      body: `Hi, this is ${mateo.parent}. We have changed our minds, please give ${mateo.child.split(" ")[0]}'s place to someone else and remove him from your list today. I am writing from a new email address.\n\nCarla`,
    },
    {
      n: "10",
      kind: "complaint",
      from: "angry.parent@example.com",
      subject: "Complaint about your computer",
      body: "I heard your school uses AI to decide who gets in. That is not fair. I want to know who made the decision about my child and how I complain.",
    },
  ];
}

export type Letter = {
  n: string;
  applicant: Applicant;
  kind: "offer" | "waitlist" | "ack";
  fault: string;
  text: string;
};

// A drafted decision letter. fault plants one mistake; "" means the letter is fine.
export function letter(
  a: Applicant,
  kind: Letter["kind"],
  fault: string,
  position: number | null,
  swapName?: string,
): string {
  const first = (swapName ?? a.child).split(" ")[0];
  const c = criterion(a);
  const clause = fault === "bad-clause" ? "4.6" : c.clause;
  const lines = [`Dear ${a.parent},`, "", `Application for ${swapName ?? a.child} (${a.id})`, ""];
  if (kind === "offer") {
    lines.push(
      `We are pleased to offer ${first} a place in Year 7 at Harbour Hill School for September 2027.`,
    );
    lines.push(`${first} qualified under clause ${clause} of our admissions policy (${c.name}).`);
    lines.push("Please accept or turn down this offer through the council website.");
  } else if (kind === "waitlist") {
    lines.push(
      `We are sorry that we cannot offer ${first} a place in Year 7 at Harbour Hill School at this time.`,
    );
    lines.push(
      `All places went to children higher in the order in section 4 of our admissions policy. ${first} was placed under clause ${clause} (${c.name}).`,
    );
    lines.push(
      `${first} is on our waiting list at position ${position}. The list is kept in policy order, so this can go up or down.`,
    );
    if (fault !== "no-appeal")
      lines.push(
        "You have the right to appeal. The appeals guide explains how, and the form must reach the clerk within 20 school days of this letter.",
      );
  } else {
    lines.push(`Thank you for your application for ${first}. We have everything we need.`);
  }
  if (fault === "ai-decided")
    lines.push(
      "This decision was made by our AI admissions system after it scored every application.",
    );
  lines.push("", "Yours sincerely,", "", STAFF.officer, "");
  return lines.join("\n");
}
