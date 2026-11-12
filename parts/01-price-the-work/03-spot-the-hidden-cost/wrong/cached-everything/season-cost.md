# What one admissions season costs

Each call sends one form and the whole policy, and gets back one short row and a note.

## Assumptions

- Applications in a season: 1,200
- Tokens in one application: 572 (form 03, from my token count)
- Tokens in the policy: 1,816
- Input tokens per application (form plus policy): 2,388
- Output tokens per application: 300

## Per application

| Model | Input price per million | Output price per million | Cost per application |
|---|---|---|---|
| Haiku | $0.10 | $0.50 | $0.000389 |
| Sonnet | $2 | $10 | $0.007776 |
| Opus | $4 | $20 | $0.015552 |

## Per season

| Model | Season cost |
|---|---|
| Haiku | $0.47 |
| Sonnet | $9.33 |
| Opus | $18.66 |

## Hidden costs

- The policy is sent with every form, so we should cache it.
- Output tokens cost more than input tokens.
- Retries cost a whole call again.
- Batch costs half.

Cached season total for Sonnet: $3.89
