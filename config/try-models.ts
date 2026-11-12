// bun run models: one tiny call per role on the chosen provider.
// Prints provider, role, pass or fail, cost. It never prints a key or a model name.

import { ask } from "../world/lib/llm";
import { PING } from "../world/lib/prompts";
import { type Provider, provider, ROLES } from "./models";

let chosen: Provider;
try {
  chosen = provider();
} catch (error) {
  console.log((error as Error).message);
  process.exit(2);
}
console.log(`Provider: ${chosen}`);

let failedRoles = 0;
for (const role of ROLES) {
  try {
    const reply = await ask(role, PING);
    const ok = /\bok\b/i.test(reply.text);
    if (!ok) failedRoles++;
    const verdict = ok ? "PASS" : "FAIL";
    console.log(`  ${verdict}  ${role.padEnd(5)}  cost $${reply.cost.toFixed(6)}`);
  } catch (error) {
    failedRoles++;
    console.log(`  FAIL  ${role.padEnd(5)}  ${(error as Error).message}`);
  }
}

if (failedRoles > 0) {
  console.log(
    `${failedRoles} role(s) failed. Look up the message in 00-orientation/troubleshooting.md.`,
  );
} else {
  console.log("Every role answered.");
}
process.exit(failedRoles > 0 ? 1 : 0);
