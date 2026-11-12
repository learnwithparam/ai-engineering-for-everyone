// bun run measure-tokens: replace the estimated token counts in world/keys/tokens.json
// with counts from Anthropic's token counting endpoint (free, rate limited).
// Needs ANTHROPIC_API_KEY in .env.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MODELS } from "../config/models";
import { HARBOUR_HILL, KEYS } from "./lib/state";

type Count = { words: number; tokens: number; method?: string };
// biome-ignore lint/style/useNamingConvention: tokens.json names this field average_application
type TokenKey = { files: Record<string, Count>; average_application: Count };

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.log("ANTHROPIC_API_KEY is not set. Add it to .env, then run this again.");
  process.exit(1);
}

// Ask Anthropic how many tokens the text is. Returns undefined, after saying why, if it refuses.
async function countTokens(file: string, text: string): Promise<number | undefined> {
  const response = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
    method: "POST",
    headers: {
      "x-api-key": apiKey ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.anthropic.fast,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!response.ok) {
    console.log(
      `  ${file}: the API said ${response.status}. Stopping; nothing after this file was changed.`,
    );
    return undefined;
  }
  // biome-ignore lint/style/useNamingConvention: the API names this field input_tokens
  const counted = (await response.json()) as { input_tokens: number };
  return counted.input_tokens;
}

const keyFile = join(KEYS, "tokens.json");
const tokenKey = JSON.parse(readFileSync(keyFile, "utf8")) as TokenKey;
for (const file of Object.keys(tokenKey.files)) {
  const text = readFileSync(join(HARBOUR_HILL, file), "utf8");
  const tokens = await countTokens(file, text);
  if (tokens === undefined) break;
  tokenKey.files[file] = { ...tokenKey.files[file], tokens, method: "measured" };
  console.log(`  ${file}: ${tokens} tokens`);
}

const applications = Object.entries(tokenKey.files).filter(([file]) =>
  file.startsWith("applications/"),
);
let totalTokens = 0;
for (const [, count] of applications) totalTokens += count.tokens;
tokenKey.average_application.tokens = Math.round(totalTokens / applications.length);

writeFileSync(keyFile, `${JSON.stringify(tokenKey, null, 2)}\n`);
console.log("Saved world/keys/tokens.json.");
