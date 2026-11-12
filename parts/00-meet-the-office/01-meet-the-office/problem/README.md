# Meet the office

## The problem

You are the new admissions officer at Harbour Hill School. The school is made up for this course. About 1,200
families want one of 180 places. Your team is three people and an inbox. Your boss asks you two questions:
should we use AI here, and how would we know it works?

You cannot answer yet. First you need to see what AI in this office looks like. So you watch the finished office
run. It reads six forms and puts each one in policy order. The policy is the school's written rules. Then it
drafts a letter for each form, and it flags the forms a person must check.

For example, one line of the run is about form HH-0114 for Finn O'Rourke. It says
`YES: the child lives at two addresses (clause 5.2)`. Finn spends equal time at both homes. In that case,
clause 5.2 says a person decides.

![The finished office: three forms need a person](../images/expected.png)

## Your challenge

1. Run the office. Type this in your terminal, in the course folder:

```bash
bun run office
```

Expect: the last line starts with `3 of 6 forms need a person:` and lists three form numbers.

2. Open `world/state/office-report.html` in your web browser. Look at the red cards. Read why each one needs a
   person.
3. Open `about-me.md` in this folder. It has four parts. Fill in all four.
4. In each part, replace the `(write here ...)` line with your own words.
5. Under **What the office flagged**, list the three form numbers. For each one, say why in a few words.

For example, a filled **Plan** part can be one word, like `Free`. A filled **Role** part can be one line, like
`Office manager at a small school`.

## Done when

- `about-me.md` is in this folder.
- **Plan** names your Claude plan: Free, Pro, Max, Ultra, Team or Enterprise.
- **Role** and **A task I want help with** each have your own words.
- **What the office flagged** lists the forms the office flagged, and no others.

How this step is checked: the check reads `about-me.md`. It also runs the office three times on its own. It keeps
the forms that are flagged every time. Your list must match those forms.

```bash
bun run verify meet-the-office
```

Expect: `Done. All 5 rules pass.`

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
