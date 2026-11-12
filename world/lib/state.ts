// Where the office keeps its files, and how scripts and checks read them.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const WORLD = join(import.meta.dir, "..");
export const HH = join(WORLD, "harbour-hill");
export const KEYS = join(WORLD, "keys");
export const STATE = join(WORLD, "state"); // git-ignored: logs and reports from runs
export const OFFICE_LOG = join(STATE, "office-log.jsonl");
export const OFFICE_REPORT = join(STATE, "office-report.html");

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

export function readRegister(file = join(HH, "register.json")): { applicants: RegisterRow[] } {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function readJsonl<T = Record<string, unknown>>(file: string): T[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

export function log(file: string, entry: Record<string, unknown>) {
  mkdirSync(STATE, { recursive: true });
  appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

export const readKey = (name: string) => readFileSync(join(KEYS, name), "utf8");
