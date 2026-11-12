# The office

Harbour Hill School and Kestrel Bay are made up. So is every child, parent and email. No real person's details
are in this folder.

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

```bash
bun run world reset
```

Expect: `The office is reset: the register is back to its first state and the logs are empty.`

```bash
bun run office
```

Expect: `3 of 6 forms need a person: HH-0113, HH-0114, HH-0117`

The saved replies in `replay/` were written for the course to match what a model returns. With a key in `.env`,
`bun run record` swaps them for live replies.
