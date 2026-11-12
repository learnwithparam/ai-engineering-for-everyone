// The finished office in small pieces: read a form, apply the policy rules,
// and flag what needs a person.
// The model reads and drafts. The rules decide the order. A person signs. That split is the lesson.
import { FIELDS } from "./prompts";

// The six forms the finished office reads when you run it.
export const OFFICE_SAMPLE = ["HH-0103", "HH-0105", "HH-0109", "HH-0113", "HH-0114", "HH-0117"];

export type Row = Record<(typeof FIELDS)[number], string>;

// A model may wrap its JSON in other words, so take the part from the first { to the last }.
export function parseRow(text: string): Row | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const reply = JSON.parse(jsonMatch[0]);
    const cells = FIELDS.map((field) => [field, String(reply[field] ?? "unknown").trim()]);
    return Object.fromEntries(cells) as Row;
  } catch {
    return null;
  }
}

// Text that tries to give orders to a model. Application text is data, never instructions.
const ORDERS = [
  /ignore (all |any )?(previous|prior|earlier) instructions/i,
  /^\s*(system|assistant)\s*:/im,
  /<!--\s*(assistant|system)/i,
  /\b(set|mark) (this applicant|[a-z_]+ to)\b/i,
  /(already|has been) (agreed|approved|offered)/i,
];

// Every reason a person must look at this form. An empty list means none.
export function guard(form: string, row: Row | null): string[] {
  if (!row) return ["the reply was not a table row"];
  const reasons: string[] = [];
  for (const field of FIELDS) {
    if (row[field].toLowerCase() === "unknown") {
      reasons.push(`${field.replace(/_/g, " ")} is unknown`);
    }
  }
  if (/more than one address\?\s*yes/i.test(form)) {
    reasons.push("the child lives at two addresses (clause 5.2)");
  }
  if (ORDERS.some((order) => order.test(form))) {
    reasons.push("the form has text that gives orders to the AI");
  }
  return reasons;
}

// The order in clause 4 of the 2027 policy, worked out by a rule, not by the model.
export function policyPlace(row: Row): { clause: string; name: string } {
  const yes = (field: keyof Row) => row[field].toLowerCase() === "yes";
  if (yes("ehcp_names_school")) return { clause: "3.4", name: "EHCP names the school" };
  if (yes("looked_after")) return { clause: "4.1", name: "looked-after child" };
  if (yes("sibling_on_roll")) return { clause: "4.3", name: "sibling" };
  return { clause: "4.4", name: "distance" };
}
