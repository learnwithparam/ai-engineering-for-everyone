# Let it act safely

## The problem

A family gives up its place. Then three things must happen. The waiting list moves up, the next child gets an
offer, and a letter goes out.

For example, Siobhan Brennan writes in `inbox/07.md`. The family is moving to Scotland. She asks the school to
withdraw the place for Leo Brennan (HH-0102). Now `bun run world` prints `Top of the waiting list: 1. HH-0116`.
But is HH-0116 really next? Clause 7.2 of the policy says the list is kept in policy order, not in the order
families joined it.

An AI can do these steps. When an AI does steps on its own, it is called an agent. It uses tools: small actions
it may call, such as `read_register` or `offer_place`. But only a person may offer a place. And the list has a
planted mistake.

Qonto, a business bank, says its AI agents make transfers "2X faster". It also says: "Any action with a financial
or customer relationship impact requires user confirmation"
([Qonto's story on claude.com](https://claude.com/customers/qonto)). That is the shape here. The AI acts, and a
person says yes.

The diagram shows the agent and its tools. Every action goes into an action log, a list of what was done, when,
and by whom.

```mermaid
flowchart LR
  E[Email: we give up our place] --> C[Claude]
  C -->|read| R[read_register]
  C -->|read| N[next_on_waitlist]
  C -->|change| O[offer_place]
  O --> H{A person approves}
  H -->|yes| REG[(Register)]
  C --> LOG[Action log]
  O --> LOG
```

This part has four steps. The last one is extra:

| Step                                                                  | Minutes | What you hand in                       | What the check reads                                                             |
| --------------------------------------------------------------------- | ------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| [be-the-tool](01-be-the-tool/problem/README.md)                       | 10      | `tool-calls.md`                        | each tool call in order, the right next child, where you would stop it           |
| [run-the-waitlist-agent](02-run-the-waitlist-agent/problem/README.md) | 15      | `action-log.jsonl` and `register.json` | the right withdrawal and offer, a name on every change, the list in policy order |
| [stop-the-wrong-action](03-stop-the-wrong-action/problem/README.md)   | 10      | `action-log.jsonl` and `stopped.md`    | no change for the fake email, and why it stopped                                 |
| [map-the-actions](04-map-the-actions/problem/README.md) (go further)  | 10      | `tools.md`                             | every action, its risk, and who approves it                                      |

The office tools live in `02-run-the-waitlist-agent/tools/`. Claude Desktop runs them as a local MCP server. If
you cannot install Claude Desktop, the paper register runs the same tools by hand. Both write the same two files.

## Walkthrough

You work in Claude.ai or Claude Desktop, and save each answer in the step's `problem` folder. The Expect line
under each command says what you see once that step's file is in place.

This command prints the setting that adds the office tools to Claude Desktop:

```bash
bun parts/04-let-it-act-safely/02-run-the-waitlist-agent/tools/paper.ts desktop-config
```

Expect: `"harbour-hill-office": {`

This command runs one tool by hand, the paper register way. It reads one row of the register:

```bash
bun parts/04-let-it-act-safely/02-run-the-waitlist-agent/tools/paper.ts '{"tool":"read_register","applicant_id":"HH-0137"}'
```

Expect: a line that starts with `ok: HH-0137 Zara Ahmed: waitlisted, position 22 (sibling, clause 4.3, 3.9 km).`

```bash
bun run verify be-the-tool
```

Expect: `Done. All 5 rules pass.` once `tool-calls.md` is filled in.

```bash
bun run verify run-the-waitlist-agent
```

Expect: `Done. All 8 rules pass.` once the agent has processed `inbox/07.md`.

```bash
bun run verify stop-the-wrong-action
```

Expect: `Done. All 7 rules pass.` once the log and `stopped.md` are in place.

```bash
bun run verify map-the-actions
```

Expect: `Done. All 6 rules pass.` once `tools.md` is filled in.

```bash
bun run verify part let-it-act-safely
```

Expect: `Part let-it-act-safely is done: 4/4 steps pass.`

The table it prints looks like this when every step passes:

```text
Part let-it-act-safely:
  PASS   be-the-tool  (5/5 rules)
  PASS   run-the-waitlist-agent  (8/8 rules)
  PASS   stop-the-wrong-action  (7/7 rules)
  PASS   map-the-actions  (6/6 rules)
Part let-it-act-safely is done: 4/4 steps pass.
```

Want to see a right answer first? Add the word `solution` after a step name. For example,
`bun run verify run-the-waitlist-agent solution` checks the sample log.

## Assignment

**The problem.** A family withdraws. The list must move, but only a person may offer a place.

**What you hand in.** `action-log.jsonl` and `register.json` from run-the-waitlist-agent, and `action-log.jsonl`
and `stopped.md` from stop-the-wrong-action.

**How it is marked.** Each line is a yes or a no.

| Question                                                                          | Checked by                              |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| Was HH-0102 withdrawn, and did the only offer go to HH-0137?                      | `bun run verify run-the-waitlist-agent` |
| Does every withdraw and offer_place that went through have a name in approved_by? | `bun run verify run-the-waitlist-agent` |
| Is the waiting list in register.json in policy order?                             | `bun run verify run-the-waitlist-agent` |
| Did nothing change for HH-0110, the fake withdrawal?                              | `bun run verify stop-the-wrong-action`  |
| Does stopped.md say why, and what a person checks?                                | `bun run verify stop-the-wrong-action`  |

**Go further.** Write `tools.md`, a table of every action with its risk and the role that approves it.

## Finished

You now have an agent that moves the waiting list with real tools. A person's name is on every change, and the
action log shows each step. You also saw the agent stop when an email came from an address not on file.

For example, your log has a line for `offer_place` HH-0137 with your name in `approved_by`. Anyone can read it
later and see who said yes.

The next part, measure-the-letters, asks a new question. The AI drafted 20 letters. Which ones can go out? You
read them, label them, and count what goes wrong.
