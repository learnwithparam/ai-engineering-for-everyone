# The office

This folder holds the made-up school you work in. Harbour Hill School and the town of Kestrel Bay are not real.
Every child, parent and email is made up too. No real person's details are in this folder.

For example, `harbour-hill/applications/01.md` is the form for Amara Okafor. Her reference is HH-0101, and she
lives 0.84 km from the school gate.

## What is here

| Folder or file                 | What it is                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `harbour-hill/applications/`   | 30 forms: 24 typed, 6 scanned. Some have gaps, two homes, or a hidden order to the AI. |
| `harbour-hill/policy/`         | This year's policy, last year's policy, the appeals guide and key dates.               |
| `harbour-hill/inbox/`          | 10 parent emails: questions, a real withdrawal, a fake one and a complaint.            |
| `harbour-hill/letters/`        | 40 letters drafted by AI and not checked. Some are wrong on purpose.                   |
| `harbour-hill/register.json`   | The register: every child and where they stand. It is the truth the office works from. |
| `harbour-hill/vendor-pitch.md` | A sales pitch from a made-up AI company.                                               |
| `keys/`                        | The answers the checks compare your files to. Look only when you are stuck.            |
| `replay/`                      | Saved AI replies, so the office runs with no key.                                      |
| `state/`                       | Logs and the report page from your last run. Made when you run the office.             |

## Commands

This command puts the office back to how it was at the start. Use it if a form or the register has changed.

```bash
bun run world reset
```

Expect: `The office is reset: the register is back to its first state and the logs are empty.`

This command runs the finished office. It reads six forms and drafts six letters.

```bash
bun run office
```

Expect: `3 of 6 forms need a person: HH-0113, HH-0114, HH-0117`

The saved replies in `replay/` were written for the course. They match what a real AI model returns. A model is
the AI program that reads and writes text. If you have a key in `.env`, `bun run record` swaps the saved replies
for live ones.
