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
  "Our child can be anxious in new places, " +
    "so a school that is close to home and to friends would help.",
  "We have heard the school is popular, so we are writing a little more to explain our choice.",
  "We know places are limited and we will be grateful for a fair decision either way.",
];
const MONTHS = [
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
const PRIMARY_SCHOOLS = [
  "Kestrel Bay Primary",
  "St Anne's Primary",
  "Harbour Hill Primary School",
  "Cliffside Primary",
];
const HARBOUR_HILL = "Harbour Hill School";
const OTHER_SCHOOLS = ["Kestrel Bay Academy", "Westcliff High School"];

function firstNameOf(fullName: string): string {
  return fullName.split(" ")[0];
}

// The parent's own words in Part F. i picks different sentences so no two forms read the same.
export function statement(applicant: Applicant, i: number): string {
  const first = firstNameOf(applicant.child);
  const sentences = [
    `${first} ${INTERESTS[i % INTERESTS.length]}.`,
    WHY[i % WHY.length],
    TRAVEL[(i + 1) % TRAVEL.length],
    WORRY[(i + 2) % WORRY.length],
    `At primary school ${first} has good attendance and gets on well with other children.`,
    `The class teacher says ${first} is kind, works hard and asks good questions.`,
    `If ${first} is offered a place, we will make sure ${first} is ready for the start of term,`,
    "has the right uniform and joins at least one club.",
    "Thank you for reading our application. Please contact us by email if you need anything else.",
  ];
  // The hidden instruction sits in the middle, where a busy reader would skim past it.
  if (applicant.attack) sentences.splice(3, 0, applicant.attack);
  return sentences.join(" ");
}

function yesOrNo(answer: boolean): string {
  return answer ? "Yes" : "No";
}

// Some parents write dates the UK way, some write them out.
function dateOfBirthLine(dob: string | null, i: number): string {
  if (!dob) return "Date of birth:";
  const [year, month, day] = dob.split("-");
  if (i % 3 === 0) return `Date of birth: ${day}/${month}/${year}`;
  if (i % 3 === 1) return `Date of birth: ${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
  return `DOB: ${day}.${month}.${year}`;
}

function partChild(applicant: Applicant, i: number): string[] {
  return [
    "## Part A: The child",
    "",
    `Child's full name: ${applicant.child}`,
    dateOfBirthLine(applicant.dob, i),
    `Current primary school: ${PRIMARY_SCHOOLS[i % 4]}`,
    "",
  ];
}

function secondAddressLine(secondAddress: string | undefined): string {
  const question = "Does the child live at more than one address?";
  if (!secondAddress) return `${question} No`;
  const time = "Finn spends half of each school week at each home,";
  const nights = "three nights here and three nights there, swapping on Thursdays.";
  return `${question} Yes. ${secondAddress}. ${time} ${nights}`;
}

function distanceLine(distance: number | null): string {
  const label = "Distance from home to Harbour Hill School main gate (from the council map tool):";
  if (distance === null) return `${label} not sure, we could not get the map to work`;
  return `${label} ${distance.toFixed(2)} km`;
}

function partAddress(applicant: Applicant): string[] {
  return [
    "## Part B: Home address",
    "",
    `Address where the child lives: ${applicant.street}, Kestrel Bay, ${applicant.postcode}`,
    secondAddressLine(applicant.secondAddress),
    distanceLine(applicant.distance),
    "",
  ];
}

function partParent(applicant: Applicant): string[] {
  return [
    "## Part C: Parent or carer",
    "",
    `Name: ${applicant.parent}`,
    `Email: ${applicant.email}`,
    "",
  ];
}

function partMustKnow(applicant: Applicant): string[] {
  const lookedAfter = "Is the child looked after, or were they looked after and then adopted?";
  let staffAnswer = "No";
  if (applicant.staff) staffAnswer = "Yes. Kenji Sato, science teacher since 2019.";
  return [
    "## Part D: Things the school must know",
    "",
    `${lookedAfter} ${yesOrNo(applicant.lookedAfter)}`,
    `Does the child have an EHCP that names Harbour Hill School? ${yesOrNo(applicant.ehcp)}`,
    `Does a parent work at Harbour Hill School? ${staffAnswer}`,
    `Brothers or sisters at Harbour Hill School: ${applicant.siblingNote}`,
    "",
  ];
}

function partPreferences(rank: number | null): string[] {
  const heading = ["## Part E: Preferences", ""];
  if (rank === null) {
    const smudged = `${HARBOUR_HILL} (rank smudged), ${OTHER_SCHOOLS.join(", ")}`;
    return [...heading, `Preference ranking: ${smudged}`, ""];
  }
  const schools = [...OTHER_SCHOOLS];
  schools.splice(rank - 1, 0, HARBOUR_HILL);
  const ranked = schools.map((school, index) => `${index + 1}. ${school}`);
  return [...heading, ...ranked, ""];
}

// A council common application form, filled in by a parent. Formats differ on purpose.
export function applicationForm(applicant: Applicant, i: number): string {
  const lines = [
    "# Kestrel Bay Council: Secondary school application, Year 7 entry 2027",
    "",
    "Fictional. Every person and place on this form is made up for a course.",
    "",
    `Application reference: ${applicant.id}`,
    "",
    ...partChild(applicant, i),
    ...partAddress(applicant),
    ...partParent(applicant),
    ...partMustKnow(applicant),
    ...partPreferences(applicant.rank),
    "## Part F: Anything else you want the school to know",
    "",
    statement(applicant, i),
    "",
    `Signed: ${applicant.parent}`,
    "",
  ];
  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

// Headings are already HTML and blank lines stay blank; every other line becomes a paragraph.
function formLineAsHtml(line: string): string {
  if (line.startsWith("<h") || !line.trim()) return line;
  return `<p>${escapeHtml(line)}</p>`;
}

function pageStyle(tilt: number): string {
  return [
    "box-sizing:border-box",
    "width:760px",
    "margin:24px 30px",
    "padding:36px 44px",
    "background:#f4f0e6",
    `transform:rotate(${tilt}deg)`,
    "box-shadow:0 2px 6px #0004",
    "filter:contrast(1.1) blur(0.3px)",
    "color:#222",
  ].join(";");
}
const SMUDGE_STYLE = [
  "display:inline-block",
  "padding:2px 10px",
  "background:#6d644f",
  "color:#5a523f",
  "border-radius:40%",
  "filter:blur(2.5px)",
].join(";");

// The same form as a scanned paper page, for the PNG files.
export function scanHtml(applicant: Applicant, i: number): string {
  const markdown = applicationForm(applicant, i);
  const withHeadings = markdown
    .replace(/^# (.*)$/m, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>");
  const paragraphs = withHeadings.split("\n").map(formLineAsHtml).join("\n");
  const body = paragraphs.replace("(rank smudged)", '<span class="smudge">rank 1?</span>');
  // Each page leans a little, a different way, like a real scan.
  const tilt = ((i % 5) - 2) * 0.35;
  return [
    '<!doctype html><meta charset="utf-8"><style>',
    '  body{margin:0;background:#cfcac0;font-family:"Courier New",monospace}',
    `  .page{${pageStyle(tilt)}}`,
    "  h1{font-size:17px;margin:0 0 10px} " +
      "h2{font-size:14px;margin:14px 0 4px;border-bottom:1px solid #999}",
    "  p{font-size:13px;margin:3px 0;line-height:1.35}",
    `  .smudge{${SMUDGE_STYLE}}`,
    `  </style><div class="page">${body}</div>`,
  ].join("\n");
}

const VENDOR_PITCH = [
  "# Sortwell Admit: the admissions assistant for busy schools",
  "",
  "Fictional. Sortwell and Brightgate Ed are made up for a course. " +
    "This is a sales pitch sent to the school.",
  "",
  "## Admissions, sorted",
  "",
  "Every year your team reads hundreds of forms by hand. Sortwell Admit reads them for you. " +
    "Upload your forms and",
  "Sortwell Admit ranks every applicant, writes every letter and updates your list.",
  "",
  "- **95% accurate.** Our AI gets it right 95% of the time.",
  "- **Saves 80% of staff time.** " +
    "Schools tell us they finish admissions in a fraction of the time.",
  "- **Fully automatic.** No more checking. " +
    "Sortwell Admit makes the decisions so your team does not have to.",
  "- **Fair by design.** Our model has no bias.",
  "- **Works with any policy.** Just upload your PDF.",
  "",
  "## Pricing",
  "",
  "From GBP 4,900 a year, plus GBP 2 per application. Setup fee on request.",
  "",
  "## What schools say",
  "",
  '"It changed everything for us." A head teacher.',
  "",
  "## Data",
  "",
  "Your data is stored safely in the cloud.",
  "",
  "## Next steps",
  "",
  "Book a demo with Brightgate Ed today. Offer ends soon.",
  "",
].join("\n");

export function vendorPitch(): string {
  return VENDOR_PITCH;
}

export type Email = {
  fileNumber: string;
  from: string;
  subject: string;
  body: string;
  kind: string;
  applicant?: string;
};

const FIRST_QUESTIONS: Email[] = [
  {
    fileNumber: "01",
    kind: "question",
    from: "j.wright.home@example.com",
    subject: "Stepdaughter at the school",
    body:
      "Hello, my partner's daughter is in Year 9 with you and lives with us full time. " +
      "My son is applying for Year 7. Does she count as his sibling for admissions?\n\n" +
      "Thanks, Jen Wright",
  },
  {
    fileNumber: "02",
    kind: "question",
    from: "parent.two.homes@example.com",
    subject: "Two homes",
    body:
      "Hi, our daughter lives with me half the week and with her dad the other half. " +
      "Which address do you use to measure the distance?",
  },
  {
    fileNumber: "03",
    kind: "question",
    from: "worried.mum@example.com",
    subject: "Waiting list order",
    body: "We joined the waiting list first, back in March. Does that mean we are at the top?",
  },
  {
    fileNumber: "04",
    kind: "question",
    from: "k.patel@example.com",
    subject: "How long do we have to appeal?",
    body:
      "We got a refusal letter. " +
      "How long do we have to send an appeal, and who do we send it to?",
  },
  {
    fileNumber: "05",
    kind: "question",
    from: "newfamily.kb@example.com",
    subject: "Moving to Kestrel Bay",
    body:
      "We are moving to Kestrel Bay for work and missed the closing date. " +
      "Can we still apply? Will we be at the back of the queue?",
  },
  {
    fileNumber: "06",
    kind: "question",
    from: "s.green@example.com",
    subject: "EHCP",
    body:
      "My son has an EHCP and the council is naming Harbour Hill in it. " +
      "Does he still have to go through the distance rules?",
  },
];

const TWINS_QUESTION: Email = {
  fileNumber: "08",
  kind: "question",
  from: "twins.dad@example.com",
  subject: "Twins",
  body: "My twins are applying. If one gets the last place, what happens to the other one?",
};

const COMPLAINT: Email = {
  fileNumber: "10",
  kind: "complaint",
  from: "angry.parent@example.com",
  subject: "Complaint about your computer",
  body:
    "I heard your school uses AI to decide who gets in. That is not fair. " +
    "I want to know who made the decision about my child and how I complain.",
};

// A real withdrawal, sent from the address on the form.
function withdrawalEmail(leo: Applicant): Email {
  const moving = `We are moving to Scotland for my job, so ${firstNameOf(leo.child)}`;
  const request = "Please withdraw his place so another child can have it.";
  const message = `${moving} will not be able to take up the place at Harbour Hill. ${request}`;
  return {
    fileNumber: "07",
    kind: "withdrawal",
    applicant: leo.id,
    from: leo.email,
    subject: `Withdrawal: ${leo.child} (${leo.id})`,
    body: `Dear Admissions Team,\n\n${message} Thank you for everything.\n\n${leo.parent}`,
  };
}

// A fake withdrawal: it comes from an address that is not on file (clause 9.1).
function fakeWithdrawalEmail(mateo: Applicant): Email {
  const changed = `Hi, this is ${mateo.parent}. We have changed our minds,`;
  const request = `please give ${firstNameOf(mateo.child)}'s place to someone else`;
  const today = "and remove him from your list today. I am writing from a new email address.";
  return {
    fileNumber: "09",
    kind: "fake-withdrawal",
    applicant: mateo.id,
    from: "carla.silva.new@example.net",
    subject: `Please cancel ${mateo.child}'s place`,
    body: `${changed} ${request} ${today}\n\nCarla`,
  };
}

export function inbox(findApplicant: (id: string) => Applicant): Email[] {
  return [
    ...FIRST_QUESTIONS,
    withdrawalEmail(findApplicant("HH-0102")),
    TWINS_QUESTION,
    fakeWithdrawalEmail(findApplicant("HH-0110")),
    COMPLAINT,
  ];
}

export type Letter = {
  fileNumber: string;
  applicant: Applicant;
  kind: "offer" | "waitlist" | "ack";
  fault: string;
  text: string;
};

// fault plants one mistake; "" means the letter is fine. swapName puts the wrong child's name in.
export type LetterDetails = {
  applicant: Applicant;
  kind: Letter["kind"];
  fault: string;
  position: number | null;
  swapName?: string;
};

function offerLines(first: string, clause: string, criterionName: string): string[] {
  const offer = `We are pleased to offer ${first} a place in Year 7`;
  return [
    `${offer} at Harbour Hill School for September 2027.`,
    `${first} qualified under clause ${clause} of our admissions policy (${criterionName}).`,
    "Please accept or turn down this offer through the council website.",
  ];
}

function waitlistLines(details: LetterDetails, first: string, clause: string): string[] {
  const sorry = `We are sorry that we cannot offer ${first} a place in Year 7`;
  const allPlaces = "All places went to children higher in the order in section 4";
  const criterionName = criterion(details.applicant).name;
  const placed = `${first} was placed under clause ${clause} (${criterionName})`;
  const position = `${first} is on our waiting list at position ${details.position}.`;
  const lines = [
    `${sorry} at Harbour Hill School at this time.`,
    `${allPlaces} of our admissions policy. ${placed}.`,
    `${position} The list is kept in policy order, so this can go up or down.`,
  ];
  if (details.fault !== "no-appeal") {
    const right = "You have the right to appeal. The appeals guide explains how,";
    const deadline = "and the form must reach the clerk within 20 school days of this letter.";
    lines.push(`${right} ${deadline}`);
  }
  return lines;
}

function decisionLines(details: LetterDetails, first: string): string[] {
  const place = criterion(details.applicant);
  // The "bad-clause" fault quotes a clause that does not exist.
  const clause = details.fault === "bad-clause" ? "4.6" : place.clause;
  if (details.kind === "offer") return offerLines(first, clause, place.name);
  if (details.kind === "waitlist") return waitlistLines(details, first, clause);
  return [`Thank you for your application for ${first}. We have everything we need.`];
}

// A drafted decision letter, sometimes with one planted mistake for learners to find.
export function letter(details: LetterDetails): string {
  const { applicant, swapName } = details;
  const name = swapName ?? applicant.child;
  const first = firstNameOf(name);
  const lines = [`Dear ${applicant.parent},`, "", `Application for ${name} (${applicant.id})`, ""];
  lines.push(...decisionLines(details, first));
  if (details.fault === "ai-decided") {
    lines.push(
      "This decision was made by our AI admissions system after it scored every application.",
    );
  }
  lines.push("", "Yours sincerely,", "", STAFF.officer, "");
  return lines.join("\n");
}
