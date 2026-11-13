// Where the office keeps its files, and how scripts and checks read them.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const WORLD = join(import.meta.dir, "..");
export const HARBOUR_HILL = join(WORLD, "harbour-hill");
export const KEYS = join(WORLD, "keys");
// Logs and reports from runs. Git ignores this folder.
export const STATE = join(WORLD, "state");
export const OFFICE_LOG = join(STATE, "office-log.jsonl");
export const OFFICE_REPORT = join(STATE, "office-report.html");

// biome-ignore-start lint/style/useNamingConvention: these are the register's own JSON field names
export type RegisterRow = {
  applicant_id: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  criterion: string;
  clause: string;
  distance_km: number | null;
  status: "received" | "offered" | "accepted" | "waitlisted" | "withdrawn";
  waitlist_position: number | null;
};
// biome-ignore-end lint/style/useNamingConvention: end of the register's field names

export function readRegister(file = join(HARBOUR_HILL, "register.json")): {
  applicants: RegisterRow[];
} {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function readJsonl<T = Record<string, unknown>>(file: string): T[] {
  if (!existsSync(file)) return [];
  const lines = readFileSync(file, "utf8").split("\n");
  const filledLines = lines.filter((line) => line.trim());
  return filledLines.map((line) => JSON.parse(line));
}

export function log(file: string, entry: Record<string, unknown>) {
  mkdirSync(STATE, { recursive: true });
  const stamped = { at: new Date().toISOString(), ...entry };
  appendFileSync(file, `${JSON.stringify(stamped)}\n`);
}

export const readKey = (name: string) => readFileSync(join(KEYS, name), "utf8");
