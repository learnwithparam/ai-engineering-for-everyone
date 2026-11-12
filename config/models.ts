// The only file that names a model. Code asks for a role (fast, smart, judge), never an id.
// Swap the provider with one setting, LLM_PROVIDER, in a git-ignored .env file
// (see .env.example).
// Ids read from briefs/MODELS.md and the providers' live lists on 2026-11-12.

export type Role = "fast" | "smart" | "judge";
export type Provider = "replay" | "anthropic" | "openrouter" | "openai" | "ollama";

export const ROLES: Role[] = ["fast", "smart", "judge"];
export const PROVIDERS: Provider[] = ["replay", "anthropic", "openrouter", "openai", "ollama"];

// Which model plays each role, per provider. Replay plays back recorded replies and needs no key.
export const MODELS: Record<Exclude<Provider, "replay">, Record<Role, string>> = {
  anthropic: { fast: "claude-haiku-5-5", smart: "claude-sonnet-5-5", judge: "claude-haiku-5-5" },
  openrouter: {
    fast: "nvidia/nemotron-3.5-lightning",
    smart: "anthropic/claude-sonnet-5.5",
    judge: "anthropic/claude-haiku-5.5",
  },
  openai: { fast: "gpt-6-luna", smart: "gpt-6-luna-pro", judge: "gpt-6-luna" },
  // A local model through Ollama's OpenAI-compatible server.
  // Set OLLAMA_MODEL to the one you pulled.
  ollama: {
    fast: process.env.OLLAMA_MODEL ?? "qwen3",
    smart: process.env.OLLAMA_MODEL ?? "qwen3",
    judge: process.env.OLLAMA_MODEL ?? "qwen3",
  },
};

// The key each provider needs. Replay and Ollama need none.
export const KEY_NAME: Record<Provider, string | null> = {
  replay: null,
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  ollama: null,
};

// Which price row in config/prices.ts each Anthropic id uses.
export const MENU_FOR_ID: Record<string, string> = {
  "claude-haiku-5-5": "Haiku",
  "claude-sonnet-5-5": "Sonnet",
  "claude-opus-5-5": "Opus",
};

// What a replayed reply is priced as, so a replay run shows a real cost:
// the anthropic model for that role.
export const REPLAY_PRICED_AS: Record<Role, string> = MODELS.anthropic;

export function provider(): Provider {
  const chosen = (process.env.LLM_PROVIDER ?? "replay").trim() as Provider;
  if (!PROVIDERS.includes(chosen)) {
    throw new Error(`LLM_PROVIDER is "${chosen}". Use one of: ${PROVIDERS.join(", ")}.`);
  }
  return chosen;
}

export function modelFor(role: Role, chosen: Provider = provider()): string {
  if (chosen === "replay") return `replay:${role}`;
  return MODELS[chosen][role];
}
