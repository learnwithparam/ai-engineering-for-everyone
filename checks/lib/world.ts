// What the checks know about the office: its files, its keys, its register and logs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { HH, KEYS, OFFICE_LOG, readJsonl, readRegister } from "../../world/lib/state";
import { countWords } from "../../world/lib/words";

export { HH, KEYS, OFFICE_LOG, readJsonl, readRegister, countWords };

export const worldFile = (rel: string) => readFileSync(join(HH, rel), "utf8");
export const wordsIn = (rel: string) => countWords(worldFile(rel));

type Tokens = { average_application: { words: number; tokens: number }; files: Record<string, { words: number; tokens: number; method: string }> };
export const tokenKey = (): Tokens => JSON.parse(readFileSync(join(KEYS, "tokens.json"), "utf8"));
export const tokensIn = (rel: string) => tokenKey().files[rel]?.tokens ?? NaN;

export function keyCsv(name: string): Record<string, string>[] {
  return Papa.parse<Record<string, string>>(readFileSync(join(KEYS, name), "utf8").trim(), { header: true, skipEmptyLines: true }).data;
}

export const keyJson = (name: string) => JSON.parse(readFileSync(join(KEYS, name), "utf8"));
