// bun run record: ask a live provider for every reply the course plays back, 3 times each, and save them.
// Needs LLM_PROVIDER and its key in .env. After this, replay mode plays the live replies.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { record, REPLAY_DIR } from "./lib/llm";
import { provider } from "../config/models";

if (provider() === "replay") {
  console.log("Set LLM_PROVIDER to anthropic, openrouter, openai or ollama, and its key in .env, then run this again.");
  process.exit(1);
}
const files = readdirSync(REPLAY_DIR).filter((f) => f.endsWith(".json"));
let n = 0;
for (const f of files) {
  const rec = JSON.parse(readFileSync(join(REPLAY_DIR, f), "utf8"));
  await record(rec.role, rec.prompt);
  console.log(`  recorded ${rec.role} ${f}`);
  n++;
}
console.log(`Recorded ${n} prompts, 3 replies each.`);
