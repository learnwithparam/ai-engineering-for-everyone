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
| Haiku  | $0.10                   | $0.50                    | $0.000389            |
| Sonnet | $2                      | $10                      | $0.007776            |
| Opus   | $4                      | $20                      | $0.015552            |

## Per season

| Model  | Season cost |
| ------ | ----------- |
| Haiku  | $0.47       |
| Sonnet | $9.33       |
| Opus   | $18.66      |

## Hidden costs

- The policy is sent with every form. It is 1,816 of the 2,388 input tokens, and it is the same text 1,200 times.
  With caching, we pay full price once and a tiny price to read it again.
- Output tokens cost five times more than input tokens. If the AI writes a full letter, not a short row, the
  output part of the bill grows fast.
- Retries. If a form fails or a person asks again, we pay for the call again.
- Batch. If we do not need the answers at once, a batch costs half.

Cached season total for Sonnet: $5.19
