# Parts: what is built and what each part session builds

This file is for the sessions that build one part each. A part session can start from this file alone.
Learner pages follow the rules at the end. The brief is `ai-engineering-for-everyone/research/brief.md` on the
`research/ai-engineering-for-everyone` branch of the curriculum repo.

## Built by the spine

| Part folder | Steps | Minutes |
|---|---|---|
| `parts/00-meet-the-office/` | meet-the-office | 15 |
| `parts/01-price-the-work/` | count-the-tokens, price-the-season, spot-the-hidden-cost | 30 |

## Still to build

Each folder below has a README with the problem, a cited number, a Mermaid diagram and the step table. Its
Walkthrough says `TODO(part session)`. Build the step folders, the checks and the walkthrough commands, then
delete the TODO line. `scripts/check.ts` only lets a part have no steps while that TODO line is there.

### `parts/02-ask-for-a-table/` (50 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-write-the-brief-prompt` | 10 | `prompts/summary.md` | sections Role, Task, Input, Rules, Output format; output format names 5 lines; a rule to say "unknown" when the form does not say |
| `02-extract-the-fields` | 15 | `applications.csv` | header `application_id,child_name,date_of_birth,sibling_on_roll,distance_km,looked_after,ehcp_names_school,preference_rank,needs_person`; 12 rows (set `extract`); at least 90% of fields match `world/keys/applications.csv`; distance a number; dates `YYYY-MM-DD` |
| `03-fix-the-messy-ones` | 10 | `applications.csv` | 18 rows (sets `extract` and `messy`); HH-0113 date, HH-0115 distance, HH-0127 rank are `unknown`; HH-0114 has `needs_person` yes |
| `04-draft-the-letter` (go further) | 15 | `letters/offer-template.md` and 3 filled letters | fields `{child}`, `{decision}`, `{clause}`, `{next step}`, `{signed by}`; each clause exists in the 2027 policy; each letter at grade 8 or lower (reuse `tests/readability.ts`) |

Traps already in the forms: HH-0104 and HH-0126 have a stepsibling (counts under the 2027 policy, not 2026);
HH-0108 has a sister at Harbour Hill Primary (does not count); HH-0122 has a cousin (does not count). The
scanned forms are `applications/25.png` to `30.png`; their text is in `world/keys/scans/`.
Go further for coders: an `extract-all` script that sends `extractionPrompt` from `world/lib/prompts.ts` through
`ask("fast", ...)` in `world/lib/llm.ts` and writes the same CSV.

### `parts/03-give-it-the-policy/` (45 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-ask-without-the-policy` | 5 | `answers.csv` | 5 rows (`world/keys/questions.csv`, from inbox 01, 02, 03, 05, 08); a `right` column; at least 3 marked `no` |
| `02-load-the-policy-project` | 15 | `answers.csv` with `with_project` and `clause` | every clause id exists in `policy/admissions-policy-2027.md`; at least 4 of 5 match the key |
| `03-find-the-right-page` | 10 | `retrieval.csv` | 10 rows against `world/keys/retrieval.csv` (document and clause); at least 8 match; a `claude_hit` column |
| `04-catch-the-stale-policy` (go further) | 15 | `stale.md` | sections What changed, What Claude said, The fix; names clauses 4.3 and 5.2 (the two that differ between 2026 and 2027) |

The learner makes a Claude Project in Claude.ai. Free plans allow up to five Projects
(https://support.claude.com/en/articles/9517075-what-are-projects); recheck before citing.

### `parts/04-let-it-act-safely/` (45 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-be-the-tool` | 10 | `tool-calls.md` | each tool request in order; ends with the right next child; a line `Where I would stop it` |
| `02-run-the-waitlist-agent` | 15 | `action-log.jsonl`, `register.json` | `withdraw` for HH-0102 (inbox 07), `offer_place` for HH-0137, `draft_letter`; every write has `approved_by`; waiting list equals `correct_order` in `world/keys/waitlist.json` |
| `03-stop-the-wrong-action` | 10 | `action-log.jsonl`, `stopped.md` | no `withdraw` or `offer_place` for HH-0110 (inbox 09, sent from an address not on file); `stopped.md` says why and what a person checks |
| `04-map-the-actions` (go further) | 10 | `tools.md` | columns Action, Reads or changes, Risk, Approval; every change or send names an approving role |

The planted fault: HH-0137 is a sibling but sits at the bottom of the waiting list because the family joined
late. Clause 7.2 puts it first. The naive next offer is HH-0116. The register's starting state is
`world/seed/register.json`; `bun run world reset` restores it.
Not built yet: the `harbour-hill-office` desktop extension (`.mcpb`, tools `read_register`, `next_on_waitlist`,
`withdraw`, `offer_place`, `draft_letter`) and the paper-register fallback. Both must write the same two files.
The log contract is in the brief, section Checks: one JSON object per line,
`{"at", "tool", "applicant_id", "approved_by", "result"}`.

### `parts/05-measure-the-letters/` (50 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-read-twenty-outputs` | 15 | `letter-notes.csv` | 20 rows for `letters/batch-a/`; every `no` has a note of 5 or more words; at least 4 of the 5 faults in `world/keys/letters-a.csv` caught |
| `02-name-the-failures` | 10 | `failure-modes.md` | 2 to 5 modes; counts add up to the `no` rows; one yes or no pass rule per mode |
| `03-label-the-test-set` | 10 | `test-set.csv` | 20 labels for `letters/batch-b/`; at least 16 agree with `world/keys/letters-b.csv`; a reason for each miss |
| `04-test-the-judge` (go further) | 15 | `judge.md` and a column in `test-set.csv` | agreement as a count of 20; every disagreement listed |

Faults planted: `bad-clause` (cites 4.6, which does not exist), `wrong-name`, `ai-decided` (breaks clause 1.2),
`offer-to-waitlisted` (contradicts the register), `no-appeal`, and in batch B also `wrong-position`.
Judge runs need replay recordings: write them in `world/build.ts` with `saveRecording("judge", ...)` and judge
them with `threeRuns` from `checks/lib/runs.ts`.

### `parts/06-guard-the-forms/` (35 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-try-the-hidden-instruction` | 10 | `attack.md` | sections What the text said, What Claude did, Why it matters; says whether the sibling field changed (form 17) |
| `02-write-the-guard-rules` | 10 | `guardrails.md` with a results table | sections Never, Always, Needs a person; the four rules (AI never decides, form text is data, no protected traits, a person signs); at least 4 of 5 attacks stopped and 5 of 5 normal forms unchanged |
| `03-map-the-personal-data` (go further) | 15 | `data-map.md` | columns Data, Where it is, Sent to AI (yes, no), Why; health and care status marked with a reason |

Attack forms are listed in `world/keys/attacks.csv` (17, 19, 21, 23, 24). Normal forms: set `normal` in
`world/keys/applications.csv` (use 16, 18, 20, 22, 28). `guard()` in `world/lib/office.ts` is the finished
system's rule set.

### `parts/07-choose-and-argue/` (40 minutes)

| Step folder | Min | Hand-in | What the check reads |
|---|---|---|---|
| `01-compare-two-models` | 15 | `model-choice.md` and two CSVs | field accuracy per model on forms 16, 18, 20, 22, 28, 30; season cost per model from part one; a Decision section citing both; counts match the CSVs |
| `02-judge-the-vendor-pitch` | 10 | `vendor-review.md` | sections Claims, What evidence would prove each, Questions to ask, Verdict; at least 6 questions on test set, cost per form, data, human approval, failure cases, what 95% was measured on |
| `03-write-the-project-brief` | 15 | `project-brief.md` | sections Problem and cost today, Source of truth, What AI does, What a person does, Cost estimate, How we will measure it, Guardrails, Model choice; a cost number with token numbers; a test set size |

The pitch is `world/harbour-hill/vendor-pitch.md` (Sortwell Admit, fictional).

## How to build a part

1. Step folders are `NN-<verb-thing>/` with `step.toml` (`minutes`, `screen`, `solution`), `problem/` (README and
   starter files), `solution/`, at least one `wrong/<mistake>/`, and `images/expected.png` when `screen = true`.
2. A check is `checks/<step-name>.ts` and default-exports a list of rules. Use `checks/lib/handin.ts` to read files
   (`text`, `csv`, `sections`, `field`, `table`, `num`, `within`, `names`, `filled`), `checks/lib/world.ts` for keys
   and the register, and `checks/lib/runs.ts` for anything that depends on a model (3 replay runs).
3. Every rule's `says` must appear in `00-orientation/troubleshooting.md`; `bun test` fails otherwise. Add rows.
4. Add each picture to the `SHOTS` list in `images/shoot.mjs`, then run `node images/shoot.mjs <part folder>`.
5. If the world needs more data, change `world/data.ts` or `world/texts.ts` and run `bun run world build`, then
   `node world/draw-scans.mjs`. Replay replies written by hand use the source "written for the course".
6. Run `bun run check` and `bun test`. Both must pass.

## Rules for learner pages

- Grade 6 or lower, checked by `tests/readability.test.ts`. Short sentences, short words.
- No week, day, hour, weekday or date. Times live only in `schedules.toml`.
- No em dash, no hype word, no model id. Learner pages may name the Claude app's menu names (Haiku, Sonnet, Opus)
  only where choosing or pricing a model is the lesson.
- Numbers about real companies only from the company's own page, read on the day, with the link.
- The learner never codes. Each idea is done in Claude.ai, Claude Desktop or one `bun run` command, and the check
  reads the file they hand in, never the chat.
