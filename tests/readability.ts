// Flesch-Kincaid grade for the prose in a Markdown page.
export function syllables(word: string): number {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!letters) return 0;
  if (letters.length <= 3) return 1;
  // A silent ending (the "e" in "make", the "ed" in "jumped") is not a syllable.
  const withoutSilentEnding = letters.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  const trimmed = withoutSilentEnding.replace(/^y/, "");
  const vowelGroups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

function withoutCodeAndLinks(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

// Join hard-wrapped lines back into one paragraph or list item,
// so a sentence is not cut at a line end.
function joinWrappedLines(text: string): string[] {
  const units: string[] = [];
  let open = false;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || /^\|?\s*:?-{3,}/.test(line)) {
      open = false;
      continue;
    }
    const startsNewUnit = /^(#|\||[-*]\s|\d+\.\s)/.test(line);
    if (open && !startsNewUnit) units[units.length - 1] += ` ${line}`;
    else units.push(line);
    open = !line.startsWith("#") && !line.startsWith("|");
  }
  return units;
}

function plainSentence(unit: string): string {
  return unit
    .replace(/^#+\s*/, "")
    .replace(/\|/g, ". ")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
}

function endWithStop(sentence: string): string {
  if (/[.!?:]$/.test(sentence)) return sentence;
  return `${sentence}.`;
}

export function prose(markdown: string): string {
  const units = joinWrappedLines(withoutCodeAndLinks(markdown));
  const sentences = units.map(plainSentence).filter(Boolean);
  return sentences.map(endWithStop).join(" ");
}

export function grade(markdown: string): number {
  const text = prose(markdown);
  const sentencePieces = text.split(/[.!?:;]+\s/);
  const sentences = sentencePieces.filter((piece) => /[a-z]/i.test(piece)).length || 1;
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z'-]/g, ""))
    .filter((word) => /[a-z]/i.test(word));
  if (words.length === 0) return 0;
  const syllableCount = words.reduce((total, word) => total + syllables(word), 0);
  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = syllableCount / words.length;
  return 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
}
