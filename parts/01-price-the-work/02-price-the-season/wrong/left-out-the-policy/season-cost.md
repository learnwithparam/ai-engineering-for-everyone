# What one admissions season costs

Each call sends one form and the whole policy, and gets back one short row and a note.

## Assumptions

- Applications in a season: 1,200
- Tokens in one application: 572 (form 03, from my token count)
- Tokens in the policy: not needed, it is the same every time
- Input tokens per application (form plus policy): 572
- Output tokens per application: 300

## Per application

| Model  | Input price per million | Output price per million | Cost per application |
| ------ | ----------------------- | ------------------------ | -------------------- |
| Haiku  | $0.10                   | $0.50                    | $0.000207            |
| Sonnet | $2                      | $10                      | $0.004144            |
| Opus   | $4                      | $20                      | $0.008288            |

## Per season

| Model  | Season cost |
| ------ | ----------- |
| Haiku  | $0.25       |
| Sonnet | $4.97       |
| Opus   | $9.95       |
