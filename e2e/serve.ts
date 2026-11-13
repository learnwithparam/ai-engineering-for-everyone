// Serves the generated office report for the text audit. Run it with: bun e2e/serve.ts
import { join } from "node:path";

const STATE = join(import.meta.dirname, "..", "world", "state");
const port = Number(process.env.AUDIT_PORT ?? 4173);

Bun.serve({
  port,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === "/favicon.ico") return new Response(null, { status: 204 });
    return new Response(Bun.file(join(STATE, path === "/" ? "office-report.html" : path)));
  },
});
