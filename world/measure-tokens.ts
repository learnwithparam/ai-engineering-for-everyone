// bun run measure-tokens: replace the estimated token counts in world/keys/tokens.json with counts from
// Anthropic's token counting endpoint (free, rate limited). Needs ANTHROPIC_API_KEY in .env.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MODELS } from "../config/models";
import { HH, KEYS } from "./lib/state";

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.log("ANTHROPIC_API_KEY is not set. Add it to .env, then run this again.");
  process.exit(1);
}
const file = join(KEYS, "tokens.json");
const data = JSON.parse(readFileSync(file, "utf8"));
for (const rel of Object.keys(data.files)) {
  const text = readFileSync(join(HH, rel), "utf8");
  const res = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.anthropic.fast,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!res.ok) {
    console.log(
      `  ${rel}: the API said ${res.status}. Stopping; nothing after this file was changed.`,
    );
    break;
  }
  const { input_tokens } = (await res.json()) as { input_tokens: number };
  data.files[rel] = { ...data.files[rel], tokens: input_tokens, method: "measured" };
  console.log(`  ${rel}: ${input_tokens} tokens`);
}
const apps = Object.entries(data.files).filter(([k]) => k.startsWith("applications/")) as [
  string,
  { tokens: number },
][];
data.average_application.tokens = Math.round(
  apps.reduce((s, [, v]) => s + v.tokens, 0) / apps.length,
);
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log("Saved world/keys/tokens.json.");
