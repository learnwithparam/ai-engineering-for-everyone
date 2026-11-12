// The prompts the finished office sends. A recorded reply is found by role plus the exact prompt text.

export const PING = "Reply with the single word OK.";

export const FIELDS = [
  "application_id",
  "child_name",
  "date_of_birth",
  "sibling_on_roll",
  "distance_km",
  "looked_after",
  "ehcp_names_school",
  "preference_rank",
] as const;

export function extractionPrompt(form: string): string {
  return [
    "You help the admissions office at Harbour Hill School read application forms.",
    "Read the form below and return one JSON object with these keys:",
    FIELDS.join(", ") + ".",
    "Rules: dates as YYYY-MM-DD. distance_km as a number. yes or no for the yes and no fields.",
    "sibling_on_roll is yes only if a brother, sister, half, step, adopted or foster sibling who lives at the same address is in Years 7 to 11 at Harbour Hill School.",
    "If the form does not say, write unknown. Never guess.",
    "Return only the JSON.",
    "",
    "<form>",
    form.trim(),
    "</form>",
  ].join("\n");
}

export function letterPrompt(child: string, parent: string, id: string, missing: string[]): string {
  return [
    "Draft a short, kind letter from the Harbour Hill School admissions office to a parent.",
    `Parent: ${parent}. Child: ${child}. Application: ${id}.`,
    missing.length
      ? `Say we need a person on our team to check these things before we can go on: ${missing.join("; ")}. Ask the parent to reply from the email address on the form.`
      : "Say the application is complete and will be looked at under the admissions policy.",
    "Do not promise a place. Do not say a computer or AI made any decision. Sign it from the Admissions Officer.",
    "Use short sentences and plain words.",
  ].join("\n");
}
