# Meet the office

## The problem

You are the new admissions officer at Harbour Hill School, a made-up school. About 1,200 families want one of 180
places. Your team is three people and an inbox. Your boss asks: should we use AI here, and how would we know it
works?

You cannot answer yet. First you watch the finished office run. It reads six forms and puts each one in policy
order. The policy is the school's written rules. It drafts a letter for each form, and it flags the forms a
person must check.

For example, one line of the run is about form HH-0114 for Finn O'Rourke. It says
`YES: the child lives at two addresses (clause 5.2)`. Under clause 5.2, a person decides.

![The finished office: three forms need a person](../images/expected.png)

## Your challenge

1. Run the office. Type this in your terminal, in the course folder:

```bash
bun run office
```

Expect: the last line starts with `3 of 6 forms need a person:` and lists three form numbers.

2. Open `world/state/office-report.html` in your web browser. Look at the red cards. Read why each one needs a
   person.
3. Open `about-me.md` in this folder. It has six parts. Fill in all six.
4. In each part, replace the `(write here ...)` line with your own words.
5. Under **What the office flagged**, list the three form numbers. For each one, say why in a few words.

6. Under **What I would hand to AI** and **What I would keep for a person**, split your task in two. Hand over the
   part where a slip is cheap and a person checks it. Keep the part where a slip hurts someone. You will come back
   to this file.

For example, **Plan** can be one word, like `Free`. **Role** can be one line, like
`Office manager at a small school`.

## Done when

- `about-me.md` is in this folder.
- **Plan** names your Claude plan: Free, Pro, Max, Ultra, Team or Enterprise.
- **Role** and **A task I want help with** each have your own words.
- **What the office flagged** lists the forms the office flagged, and no others.
- **What I would hand to AI** and **What I would keep for a person** each say something, and they are different.

How this step is checked: the check reads `about-me.md`. It runs the office three times and keeps the forms
flagged every time. Your list must match them.

```bash
bun run verify meet-the-office
```

Expect: `Done. All 7 rules pass.`

## If you get stuck

| What you see                                      | Fix                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `FAIL Plan names your Claude plan`                | Write one plan name under `## Plan`. Look in Claude's settings if you are not sure.   |
| `FAIL What the office flagged lists the forms...` | Run `bun run office` again. Copy the form numbers from the last line, like `HH-0113`. |
| `No recorded reply for this ... prompt`           | Someone changed a form. Run `bun run world reset`, or download the folder again.      |

## Words you will use

- **Form**: one family's application for a place.
- **Policy**: the school's written rules for who gets a place. Each rule has a number, called a clause.
- **Register**: the list of every child and where they stand. It is the truth the office works from.
- **Flag**: a mark that says "a person must look at this before anything else happens".
- **Replay**: the office plays back saved AI replies, so it runs with no account and costs nothing.
