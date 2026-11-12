// How the course counts words: any run of characters between spaces that has a letter or a digit in it.
// Word processors count almost the same way, so a learner's count lands within a few percent.
export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
