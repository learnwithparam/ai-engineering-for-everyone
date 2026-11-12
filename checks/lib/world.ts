// What the checks know about the office: its files, its keys, its register and logs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { HARBOUR_HILL, KEYS, OFFICE_LOG, readJsonl, readRegister } from "../../world/lib/state";
import { countWords } from "../../world/lib/words";

export { countWords, HARBOUR_HILL, KEYS, OFFICE_LOG, readJsonl, readRegister };

// file is a path inside world/harbour-hill, for example "inbox/04.md".
export const worldFile = (file: string) => readFileSync(join(HARBOUR_HILL, file), "utf8");
export const wordsIn = (file: string) => countWords(worldFile(file));

type Count = { words: number; tokens: number };
// biome-ignore lint/style/useNamingConvention: tokens.json names this field average_application
type Tokens = { average_application: Count; files: Record<string, Count & { method: string }> };

export const tokenKey = (): Tokens => JSON.parse(readFileSync(join(KEYS, "tokens.json"), "utf8"));
export const tokensIn = (file: string) => tokenKey().files[file]?.tokens ?? NaN;

export function keyCsv(name: string): Record<string, string>[] {
  const content = readFileSync(join(KEYS, name), "utf8").trim();
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

export const keyJson = (name: string) => JSON.parse(readFileSync(join(KEYS, name), "utf8"));
