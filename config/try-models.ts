// bun run models: one tiny call per role on the chosen provider. Prints provider, role, pass or fail, cost.
// It never prints a key or a model name.

import { ask } from "../world/lib/llm";
import { PING } from "../world/lib/prompts";
import { provider, ROLES } from "./models";

let p;
try {
  p = provider();
} catch (e) {
  console.log((e as Error).message);
  process.exit(2);
}
console.log(`Provider: ${p}`);
let bad = 0;
for (const role of ROLES) {
  try {
    const r = await ask(role, PING);
    const ok = /\bok\b/i.test(r.text);
    if (!ok) bad++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${role.padEnd(5)}  cost $${r.cost.toFixed(6)}`);
  } catch (e) {
    bad++;
    console.log(`  FAIL  ${role.padEnd(5)}  ${(e as Error).message}`);
  }
}
console.log(
  bad
    ? `${bad} role(s) failed. Look up the message in 00-orientation/troubleshooting.md.`
    : "Every role answered.",
);
process.exit(bad ? 1 : 0);
