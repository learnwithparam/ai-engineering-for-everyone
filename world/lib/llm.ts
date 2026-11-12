// One way to call a model. Code passes a role; config/models.ts picks the model for the provider.
// LLM_PROVIDER=replay (the default) plays back replies saved in world/replay/, so nothing needs a key.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { KEY_NAME, REPLAY_PRICED_AS, modelFor, provider, type Provider, type Role } from "../../config/models";
import { callCost, priceById } from "../../config/prices";

export const REPLAY_DIR = join(import.meta.dir, "..", "replay");
export const RUNS_PER_RECORDING = 3;

export type Reply = { text: string; inputTokens: number; outputTokens: number; cost: number; provider: Provider; role: Role };
export type Recorded = { text: string; inputTokens: number; outputTokens: number };
type Recording = { role: Role; prompt: string; source: string; replies: Recorded[] };

export const recordingKey = (role: Role, prompt: string) =>
  createHash("sha256").update(`${role}\n${prompt}`).digest("hex").slice(0, 16);

const recordingPath = (role: Role, prompt: string) => join(REPLAY_DIR, `${recordingKey(role, prompt)}.json`);

export const hasRecording = (role: Role, prompt: string) => existsSync(recordingPath(role, prompt));

function liveModel(p: Exclude<Provider, "replay">, role: Role): LanguageModel {
  const key = KEY_NAME[p];
  if (key && !process.env[key]) throw new Error(`LLM_PROVIDER is ${p} but ${key} is not set. Add it to .env.`);
  const id = modelFor(role, p);
  if (p === "anthropic") return createAnthropic({ apiKey: process.env[key!] })(id);
  if (p === "openai") return createOpenAI({ apiKey: process.env[key!] })(id);
  if (p === "openrouter") return createOpenRouter({ apiKey: process.env[key!] })(id);
  return createOpenAI({ baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1", apiKey: "ollama" }).chat(id);
}

// run picks which recorded reply to play (0, 1 or 2), so a check can judge 3 fresh runs with no key.
export async function ask(role: Role, prompt: string, run = 0): Promise<Reply> {
  const p = provider();
  if (p === "replay") {
    const file = recordingPath(role, prompt);
    if (!existsSync(file))
      throw new Error(
        `No recorded reply for this ${role} prompt (${recordingKey(role, prompt)}). Record it once with a key: set LLM_PROVIDER and the key in .env, then bun run record.`,
      );
    const rec = JSON.parse(readFileSync(file, "utf8")) as Recording;
    const r = rec.replies[run % rec.replies.length];
    return { ...r, cost: callCost(REPLAY_PRICED_AS[role], r.inputTokens, r.outputTokens), provider: p, role };
  }
  const res = await generateText({ model: liveModel(p, role), prompt, maxOutputTokens: 1200 });
  const inputTokens = res.usage.inputTokens ?? 0;
  const outputTokens = res.usage.outputTokens ?? 0;
  const id = modelFor(role, p);
  const cost = priceById(id) ? callCost(id, inputTokens, outputTokens) : 0;
  return { text: res.text, inputTokens, outputTokens, cost, provider: p, role };
}

// Save a recording. source says where the replies came from: "live" or "written for the course".
export function saveRecording(role: Role, prompt: string, replies: Recorded[], source: string) {
  mkdirSync(REPLAY_DIR, { recursive: true });
  const rec: Recording = { role, prompt, source, replies };
  writeFileSync(recordingPath(role, prompt), JSON.stringify(rec, null, 2) + "\n");
}

// Ask a live provider 3 times and save the replies, so the course runs with no key afterwards.
export async function record(role: Role, prompt: string, runs = RUNS_PER_RECORDING) {
  if (provider() === "replay") throw new Error("Set LLM_PROVIDER to a live provider to record.");
  const replies: Recorded[] = [];
  for (let i = 0; i < runs; i++) {
    const r = await ask(role, prompt, i);
    replies.push({ text: r.text, inputTokens: r.inputTokens, outputTokens: r.outputTokens });
  }
  saveRecording(role, prompt, replies, "live");
}
