# What one admissions season costs

Each call sends one form and the whole policy, and gets back one short row and a note.

## Assumptions

- Applications in a season: 1,200
- Tokens in one application: 572 (form 03, from my token count)
- Tokens in the policy: 1,816
- Input tokens per application (form plus policy): 2,388
- Output tokens per application: 300

## Per application

| Model  | Input price per million | Output price per million | Cost per application |
| ------ | ----------------------- | ------------------------ | -------------------- |
| Haiku  | $0.10                   | $0.50                    | $0.000239            |
| Sonnet | $2                      | $10                      | $0.004776            |
| Opus   | $4                      | $20                      | $0.009552            |

## Per season

| Model  | Season cost |
| ------ | ----------- |
| Haiku  | $0.29       |
| Sonnet | $5.73       |
| Opus   | $11.46      |
