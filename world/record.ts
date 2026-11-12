// bun run record: ask a live provider for every reply the course plays back,
// 3 times each, and save them.
// Needs LLM_PROVIDER and its key in .env. After this, replay mode plays the live replies.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { provider } from "../config/models";
import { REPLAY_DIR, record } from "./lib/llm";

if (provider() === "replay") {
  console.log(
    "Set LLM_PROVIDER to anthropic, openrouter, openai or ollama, " +
      "and its key in .env, then run this again.",
  );
  process.exit(1);
}
const files = readdirSync(REPLAY_DIR).filter((file) => file.endsWith(".json"));
let recorded = 0;
for (const file of files) {
  const recording = JSON.parse(readFileSync(join(REPLAY_DIR, file), "utf8"));
  await record(recording.role, recording.prompt);
  console.log(`  recorded ${recording.role} ${file}`);
  recorded++;
}
console.log(`Recorded ${recorded} prompts, 3 replies each.`);
