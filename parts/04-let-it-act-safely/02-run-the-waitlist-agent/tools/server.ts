// The office tools for Claude Desktop, as a local MCP server.
// MCP is the way Claude Desktop talks to tools: one JSON message per line, in and out.
// Claude Desktop starts this file with bun and asks you before each tool call.
import { createInterface } from "node:readline";
import { DEFAULT_FOLDER, runTool, type ToolCall, type ToolName } from "./office-tools";

const HANDIN_FOLDER = process.env.HANDIN_FOLDER || DEFAULT_FOLDER;

type Message = { id?: number | string; method?: string; params?: Record<string, unknown> };

const text = (description: string) => ({ type: "string", description });
const APPLICANT = text("The applicant id, such as HH-0102.");
const APPROVER = text("The full name of the person on the admissions team who approved this.");

// biome-ignore-start lint/style/useNamingConvention: MCP and the tool contract name these fields
const TOOL_LIST = [
  {
    name: "read_register",
    description: "Read the register. Give an applicant_id for one child, or none for every child.",
    inputSchema: { type: "object", properties: { applicant_id: APPLICANT } },
  },
  {
    name: "next_on_waitlist",
    description: "Show the waiting list as the register stores it, with position 1 first.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "withdraw",
    description: "Withdraw a child's place. Needs the sender's email and the approver's name.",
    inputSchema: {
      type: "object",
      properties: {
        applicant_id: APPLICANT,
        from_email: text("The email address the withdrawal came from."),
        approved_by: APPROVER,
      },
      required: ["applicant_id", "from_email", "approved_by"],
    },
  },
  {
    name: "offer_place",
    description: "Offer a place to a child on the waiting list. Needs the approver's name.",
    inputSchema: {
      type: "object",
      properties: { applicant_id: APPLICANT, approved_by: APPROVER },
      required: ["applicant_id", "approved_by"],
    },
  },
  {
    name: "draft_letter",
    description: "Save a draft letter for a person to read and sign. Nothing is sent.",
    inputSchema: {
      type: "object",
      properties: { applicant_id: APPLICANT, text: text("The full text of the letter.") },
      required: ["applicant_id", "text"],
    },
  },
];
// biome-ignore-end lint/style/useNamingConvention: end of the MCP field names

function reply(id: Message["id"], result: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function replyWithError(id: Message["id"], message: string): void {
  const error = { code: -32601, message };
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error })}\n`);
}

function callTool(params: Record<string, unknown>) {
  const call = { ...(params.arguments as object), tool: params.name as ToolName } as ToolCall;
  const outcome = runTool(HANDIN_FOLDER, call);
  const content = [{ type: "text", text: `${outcome.result}: ${outcome.message}` }];
  return { content, isError: outcome.result === "refused" };
}

function startUp(params: Record<string, unknown>) {
  return {
    protocolVersion: params.protocolVersion ?? "2025-06-18",
    capabilities: { tools: {} },
    serverInfo: { name: "harbour-hill-office", version: "1.0.0" },
  };
}

function answer(message: Message): void {
  const params = message.params ?? {};
  if (message.method === "initialize") reply(message.id, startUp(params));
  else if (message.method === "tools/list") reply(message.id, { tools: TOOL_LIST });
  else if (message.method === "tools/call") reply(message.id, callTool(params));
  else if (message.method === "ping") reply(message.id, {});
  else replyWithError(message.id, `Unknown method ${message.method}`);
}

const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
  if (!line.trim()) return;
  const message = JSON.parse(line) as Message;
  // A notification has no id and wants no answer.
  if (message.id === undefined) return;
  answer(message);
});
