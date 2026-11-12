# Price the season

## The problem

Now you know how big the files are. Your boss still wants one number: what does a season cost? A season is
1,200 forms. For each form, the AI gets the form and the whole policy, and it writes back one short row.

There are three Claude models in the app's model menu: Haiku, Sonnet and Opus. They do not cost the same. You
will price the season on all three.

```mermaid
flowchart LR
  F[One form] --> I[Input tokens]
  P[The whole policy] --> I
  I --> C[Cost of one call]
  O[Output tokens] --> C
  C -->|times 1,200| S[Cost of a season]
```

## Your challenge

Fill in `season-cost.md` in this folder.

1. Under **Assumptions**, put the tokens for one form and for the policy. Use your numbers from count-the-tokens.
   Add them up to get the input tokens for one call. Leave the output at 300.
2. Open the Claude pricing page: https://platform.claude.com/docs/en/about-claude/pricing. Find the input and output
   price for Haiku 5.5, Sonnet 5.5 and Opus 5.5. For Haiku, use the price for prompts up to 100,000 tokens.
3. Work out each row. Prices are per million tokens. Here is how one call works, with made-up numbers: 1,000 input
   tokens at $3 is $0.003. 200 output tokens at $15 is $0.003. One call is $0.006.
4. Times each one by 1,200 to get the season. You can paste your numbers into Claude and ask it to do the sums.
   Check one line yourself.

![What you see when your sheet is right](../images/expected.png)

## Done when

- `season-cost.md` has the sections Assumptions, Per application and Per season.
- Assumptions give 1,200 forms, and the input and output tokens for each.
- The input tokens include one form and the whole policy.
- Per season gives a cost for Haiku, Sonnet and Opus.
- Each season cost matches your own assumptions and the price list, within 20%.

How this step is checked: the check reads your sheet. It takes your own token numbers and works out the cost from
the price list in `config/prices.ts`. So a small slip in a sum is fine. A wrong method is not.

```bash
bun run verify price-the-season
```

Expect: `Done. All 6 rules pass.`

## If you get stuck

| What you see | Fix |
|---|---|
| `FAIL input tokens per application include...` | Add the policy tokens to the form tokens. Every call sends both. |
| `FAIL each season cost matches...` | Did you divide by 1,000,000? Did you add the output cost? Check one line by hand. |
| `FAIL Per season gives a cost for...` | Put a cost like `$9.33` in each row of the Per season table. |

## Words you will use

- **Input tokens**: the tokens you send to the AI: the form, the policy and your question.
- **Output tokens**: the tokens the AI writes back. They cost more than input tokens.
- **Per million**: prices are for one million tokens. Divide by 1,000,000 to get the price of one token.
