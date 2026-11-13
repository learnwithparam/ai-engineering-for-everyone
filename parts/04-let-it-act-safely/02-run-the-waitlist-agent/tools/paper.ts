// The paper register: run the office tools by hand, one call at a time.
// Claude writes each call it wants as one line of JSON. You read it, add your name, and run it.
//
//   bun parts/04-let-it-act-safely/02-run-the-waitlist-agent/tools/paper.ts '<one JSON line>'
//   add --folder <path> to write somewhere other than run-the-waitlist-agent's problem folder
//   paper.ts desktop-config prints the setting Claude Desktop needs to use these tools
import { resolve } from "node:path";
import { DEFAULT_FOLDER, runTool, TOOL_NAMES, type ToolCall } from "./office-tools";

function folderFrom(words: string[]): string {
  const flag = words.indexOf("--folder");
  if (flag === -1) return DEFAULT_FOLDER;
  return resolve(words[flag + 1] ?? DEFAULT_FOLDER);
}

function printDesktopConfig(): void {
  const server = resolve(import.meta.dir, "server.ts");
  const config = {
    mcpServers: {
      "harbour-hill-office": {
        command: "bun",
        args: [server],
        // biome-ignore lint/style/useNamingConvention: Claude Desktop reads this env name
        env: { HANDIN_FOLDER: DEFAULT_FOLDER },
      },
    },
  };
  console.log(JSON.stringify(config, null, 2));
}

function readCall(line: string | undefined): ToolCall | undefined {
  try {
    const call = JSON.parse(line ?? "") as ToolCall;
    if (TOOL_NAMES.includes(call.tool)) return call;
  } catch {
    // Not JSON: fall through to the help line.
  }
  return undefined;
}

const words = process.argv.slice(2);
if (words[0] === "desktop-config") {
  printDesktopConfig();
  process.exit(0);
}
const call = readCall(words[0]);
if (!call) {
  console.log(`Give one tool call as JSON, such as: '{"tool":"next_on_waitlist"}'`);
  console.log(`The tools are: ${TOOL_NAMES.join(", ")}`);
  process.exit(1);
}
const outcome = runTool(folderFrom(words), call);
console.log(`${outcome.result}: ${outcome.message}`);
process.exit(outcome.result === "ok" ? 0 : 1);
