// One way to call a model. Code passes a role; config/models.ts picks the model for the provider.
// LLM_PROVIDER=replay (the default) plays back replies saved in world/replay/,
// so nothing needs a key.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type LanguageModel } from "ai";
import {
  KEY_NAME,
  modelFor,
  type Provider,
  provider,
  REPLAY_PRICED_AS,
  type Role,
} from "../../config/models";
import { callCost, priceById } from "../../config/prices";

export const REPLAY_DIR = join(import.meta.dir, "..", "replay");
export const RUNS_PER_RECORDING = 3;

export type Reply = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  provider: Provider;
  role: Role;
};
export type Recorded = { text: string; inputTokens: number; outputTokens: number };
type Recording = { role: Role; prompt: string; source: string; replies: Recorded[] };

// A recording's file name comes from the role and the exact prompt, so the same question
// always finds the same saved replies.
export function recordingKey(role: Role, prompt: string): string {
  const hash = createHash("sha256").update(`${role}\n${prompt}`);
  return hash.digest("hex").slice(0, 16);
}

const recordingPath = (role: Role, prompt: string) =>
  join(REPLAY_DIR, `${recordingKey(role, prompt)}.json`);

export const hasRecording = (role: Role, prompt: string) => existsSync(recordingPath(role, prompt));

function liveModel(live: Exclude<Provider, "replay">, role: Role): LanguageModel {
  const keyName = KEY_NAME[live];
  const apiKey = keyName ? process.env[keyName] : undefined;
  if (keyName && !apiKey) {
    throw new Error(`LLM_PROVIDER is ${live} but ${keyName} is not set. Add it to .env.`);
  }
  const id = modelFor(role, live);
  if (live === "anthropic") return createAnthropic({ apiKey })(id);
  if (live === "openai") return createOpenAI({ apiKey })(id);
  if (live === "openrouter") return createOpenRouter({ apiKey })(id);
  // Ollama runs on your own computer and speaks the same language as OpenAI's API.
  return createOpenAI({
    // biome-ignore lint/style/useNamingConvention: the OpenAI library names this option baseURL
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: "ollama",
  }).chat(id);
}

// run picks which recorded reply to play (0, 1 or 2),
// so a check can judge 3 fresh runs with no key.
function replay(role: Role, prompt: string, run: number): Reply {
  const file = recordingPath(role, prompt);
  if (!existsSync(file)) {
    throw new Error(
      `No recorded reply for this ${role} prompt (${recordingKey(role, prompt)}). ` +
        "Record it once with a key: set LLM_PROVIDER and the key in .env, then bun run record.",
    );
  }
  const recording = JSON.parse(readFileSync(file, "utf8")) as Recording;
  const saved = recording.replies[run % recording.replies.length];
  return {
    ...saved,
    cost: callCost(REPLAY_PRICED_AS[role], saved.inputTokens, saved.outputTokens),
    provider: "replay",
    role,
  };
}

export async function ask(role: Role, prompt: string, run = 0): Promise<Reply> {
  const chosen = provider();
  if (chosen === "replay") return replay(role, prompt, run);

  const model = liveModel(chosen, role);
  const answer = await generateText({ model, prompt, maxOutputTokens: 1200 });
  const inputTokens = answer.usage.inputTokens ?? 0;
  const outputTokens = answer.usage.outputTokens ?? 0;
  const id = modelFor(role, chosen);
  // A model with no row in the price list (Ollama, other providers) is shown as free.
  const cost = priceById(id) ? callCost(id, inputTokens, outputTokens) : 0;
  return { text: answer.text, inputTokens, outputTokens, cost, provider: chosen, role };
}

// Save a recording. source says where the replies came from: "live" or "written for the course".
export function saveRecording(role: Role, prompt: string, replies: Recorded[], source: string) {
  mkdirSync(REPLAY_DIR, { recursive: true });
  const recording: Recording = { role, prompt, source, replies };
  writeFileSync(recordingPath(role, prompt), `${JSON.stringify(recording, null, 2)}\n`);
}

// Ask a live provider 3 times and save the replies, so the course runs with no key afterwards.
export async function record(role: Role, prompt: string, runs = RUNS_PER_RECORDING) {
  if (provider() === "replay") throw new Error("Set LLM_PROVIDER to a live provider to record.");
  const replies: Recorded[] = [];
  for (let i = 0; i < runs; i++) {
    const reply = await ask(role, prompt, i);
    replies.push({
      text: reply.text,
      inputTokens: reply.inputTokens,
      outputTokens: reply.outputTokens,
    });
  }
  saveRecording(role, prompt, replies, "live");
}
