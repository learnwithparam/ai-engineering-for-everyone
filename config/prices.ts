// List prices in US dollars per million tokens, read from the Claude pricing page on 2026-11-12:
// https://platform.claude.com/docs/en/about-claude/pricing
// Part one of the course prices a season on the three models people pick in the Claude app menu.
// The checker recomputes every learner sheet from this table, so update it here when prices change.

export const PRICES_READ_ON = "2026-11-12";
export const PRICES_SOURCE = "https://platform.claude.com/docs/en/about-claude/pricing";

export type Price = {
  menu: string; // the word a learner sees in the Claude app model menu
  input: number; // per million input tokens (Haiku: prompts up to 100,000 tokens)
  output: number; // per million output tokens
  cacheHit: number; // per million tokens read from the prompt cache
  cacheWrite5m: number; // per million tokens written to the 5-minute cache
};

export const PRICES: Price[] = [
  { menu: "Haiku", input: 0.1, output: 0.5, cacheHit: 0.01, cacheWrite5m: 0.125 },
  { menu: "Sonnet", input: 2, output: 10, cacheHit: 0.1, cacheWrite5m: 2.5 },
  { menu: "Opus", input: 4, output: 20, cacheHit: 0.2, cacheWrite5m: 5 },
];

// Batch requests cost half, on input and output.
export const BATCH_DISCOUNT = 0.5;

// "1M tokens is roughly 555k words" on the current tokenizer:
// https://platform.claude.com/docs/en/about-claude/models/overview
export const TOKENS_PER_WORD = 1.8;

import { MENU_FOR_ID } from "./models";
// Model ids live in config/models.ts; this maps an id to its row here.
export const priceById = (id: string) => PRICES.find((p) => p.menu === MENU_FOR_ID[id]);
export const priceByMenu = (name: string) =>
  PRICES.find((p) => p.menu.toLowerCase() === name.trim().toLowerCase());

export function callCost(id: string, inputTokens: number, outputTokens: number): number {
  const p = priceById(id);
  return p ? (inputTokens * p.input + outputTokens * p.output) / 1e6 : 0;
}
