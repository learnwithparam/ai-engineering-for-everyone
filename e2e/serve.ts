// Builds the office report page, then serves its folder: bun e2e/serve.ts <port>
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pageFolder = join(root, "world", "state");
const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0) {
  console.error("Give the port to serve on. Try next: bun e2e/serve.ts 3017");
  process.exit(2);
}

// Replay mode plays back saved replies, so the build needs no key and costs nothing.
const buildEnv = { ...process.env };
buildEnv.LLM_PROVIDER = "replay";
const build = Bun.spawnSync(["bun", "world/office.ts"], {
  cwd: root,
  env: buildEnv,
  stdout: "ignore",
  stderr: "inherit",
});
if (build.exitCode !== 0) {
  console.error("Could not build the office report. Try next: run bun world/office.ts.");
  process.exit(1);
}

Bun.serve({
  port,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const file = Bun.file(join(pageFolder, path === "/" ? "office-report.html" : path));
    if (!path.includes("..") && (await file.exists())) return new Response(file);
    return new Response("Not found", { status: 404 });
  },
});
