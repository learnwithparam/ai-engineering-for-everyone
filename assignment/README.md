# Assignment: pick a winner for every prompt

Optional in the live session. Expected as homework.

## The task

Open the recorded table with promptfoo. Pick a winner for each of the six prompts, and say why. Docker is not needed.

## Starter

- `results.json`: the recorded answers of two models.
- `verdict.md`: an empty table for your verdict.

## Done when

The script checks this line:

- `verdict.md` names a winner for every prompt.

## Run the check

```bash
bun assignment/check.ts
```

Expect: `PASS  verdict.md names a winner for every prompt` and a new `result.json` with the promptfoo version.

Push your work on a branch named `assignment` and send its link. The grader runs the same script.

## Rubric

A person reads these lines. No points.

- Each reason points at something visible in the answers.
- Your verdict and the table agree, or you explain the difference.
- The reasons are short and plain.
