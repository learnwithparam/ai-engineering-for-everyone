// Flesch-Kincaid grade for the prose in a Markdown page.
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function prose(md: string): string {
  const text = md
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
  // Join hard-wrapped lines back into one paragraph or list item, so a sentence is not cut at a line end.
  const units: string[] = [];
  let open = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || /^\|?\s*:?-{3,}/.test(line)) {
      open = false;
      continue;
    }
    const starts = /^(#|\||[-*]\s|\d+\.\s)/.test(line);
    if (open && !starts) units[units.length - 1] += " " + line;
    else units.push(line);
    open = !line.startsWith("#") && !line.startsWith("|");
  }
  return units
    .map((l) =>
      l
        .replace(/^#+\s*/, "")
        .replace(/\|/g, ". ")
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .trim(),
    )
    .filter(Boolean)
    .map((l) => (/[.!?:]$/.test(l) ? l : l + "."))
    .join(" ");
}

export function grade(md: string): number {
  const t = prose(md);
  const sentences = t.split(/[.!?:;]+\s/).filter((s) => /[a-z]/i.test(s)).length || 1;
  const words = t
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z'-]/g, ""))
    .filter((w) => /[a-z]/i.test(w));
  if (words.length === 0) return 0;
  const syl = words.reduce((s, w) => s + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}
