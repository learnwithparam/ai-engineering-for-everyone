# When something goes wrong

When a command fails, it prints a message. Every one of those messages is in the tables below.

1. Find the words you see in the first column, **What you see**.
2. Read **What it means**.
3. Do what the **Fix** column says.

For example, you type `bun run office` and see `bun: command not found`. The first row says Bun is not installed.
The fix is to install Bun, then close the terminal and open a new one.

## Setting up and running the office

| What you see                             | What it means                                                              | Fix                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `bun: command not found`                 | Bun is not installed, or the terminal was open before you installed it.    | Install Bun (see Start here), then close the terminal and open a new one.                          |
| `error: could not find package.json`     | The terminal is not in the course folder.                                  | Type `cd`, a space, drag the course folder onto the terminal, and press Enter.                     |
| `There is no step called "..."`          | The step name is spelled wrong.                                            | Copy a name from the list it prints.                                                               |
| `There is no part called "..."`          | The part name is spelled wrong.                                            | Copy a name from the list it prints.                                                               |
| `ERROR the check for ... could not load` | The check itself is broken, not your work.                                 | Download the course folder again. If it still fails, tell your teacher and send the whole message. |
| `There is no world command "..."`        | Only `bun run world` and `bun run world reset` exist.                      | Run one of those two.                                                                              |
| `No recorded reply for this ... prompt`  | A file the office reads has changed, so the saved reply no longer fits it. | Run `bun run world reset`. If you changed a form, download the folder again.                       |
| `could not run: ...`                     | One form could not be read by the office.                                  | Read the rest of the line. Most often the fix is `bun run world reset`.                            |
| `There is no file at ...`                | `bun run words` could not find that file.                                  | Check the path. It starts with `world/harbour-hill/`.                                              |
| `Name a file. For example: ...`          | `bun run words` needs a file after it.                                     | Add the path of the file you want to count.                                                        |

## Using your own AI account (not needed)

You only see these messages if you set up your own AI account in `.env`. Replay mode never shows them.

| What you see                                                     | What it means                                            | Fix                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `LLM_PROVIDER is "..."`                                          | The provider name in `.env` is not one the course knows. | Use replay, anthropic, openrouter, openai or ollama.                     |
| `LLM_PROVIDER is ... but ..._API_KEY is not set`                 | You picked a provider but did not add its key.           | Add the key to `.env`, or set `LLM_PROVIDER=replay`.                     |
| `FAIL fast`, `FAIL smart` or `FAIL judge` from `bun run models`  | That model did not answer.                               | Read the message after it. Check the key, your credit, and your network. |
| `Set LLM_PROVIDER to anthropic, openrouter, openai or ollama...` | `bun run record` needs a live provider.                  | Set one in `.env` with its key.                                          |
| `ANTHROPIC_API_KEY is not set`                                   | `bun run measure-tokens` needs an Anthropic key.         | Add it to `.env`, or skip this. It is a go-further step.                 |
| `the API said ...`                                               | The token counter refused the call.                      | Check the key and try again later.                                       |

## Step checks

Each `FAIL` line comes with a `Try next:` line under it. This table has the same advice in one place. The first
words in **What it means** name the step, such as meet-the-office.

| What you see                                                                              | What it means                                   | Fix                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FAIL  about-me.md is in the folder`                                                      | meet-the-office: this rule is not met yet.      | Save about-me.md in this step's problem folder.                                                                                                    |
| `FAIL  Plan names your Claude plan`                                                       | meet-the-office: this rule is not met yet.      | Under ## Plan, write the plan you use: Free, Pro, Max, Ultra, Team or Enterprise.                                                                  |
| `FAIL  Role says what you do`                                                             | meet-the-office: this rule is not met yet.      | Under ## Role, write your job in a few words.                                                                                                      |
| `FAIL  A task I want help with names one task`                                            | meet-the-office: this rule is not met yet.      | Under ## A task I want help with, write one real task from your work.                                                                              |
| `FAIL  What the office flagged lists the forms the office flagged, and no others`         | meet-the-office: this rule is not met yet.      | Run bun run office and copy the form numbers from its last line into ## What the office flagged.                                                   |
| `FAIL  token-count.csv is in the folder`                                                  | count-the-tokens: this rule is not met yet.     | Save token-count.csv in this step's problem folder.                                                                                                |
| `FAIL  the first line is file,words,tokens`                                               | count-the-tokens: this rule is not met yet.     | Keep the first line exactly as it was: file,words,tokens                                                                                           |
| `FAIL  there is a row for each of the three files`                                        | count-the-tokens: this rule is not met yet.     | Keep the three file names in the first column as they were in the starter.                                                                         |
| `FAIL  each word count is within 10% of the real count`                                   | count-the-tokens: this rule is not met yet.     | Count again with bun run words and the file path, or your editor's word count.                                                                     |
| `FAIL  each token count is more than its word count`                                      | count-the-tokens: this rule is not met yet.     | A token is often a piece of a word, so there are more tokens than words. Multiply words by 1.8.                                                    |
| `FAIL  each token count is within 25% of the course count`                                | count-the-tokens: this rule is not met yet.     | Use the rule from Claude's docs: about 1.8 tokens per word. Words times 1.8, rounded.                                                              |
| `FAIL  season-cost.md is in the folder`                                                   | price-the-season: this rule is not met yet.     | Save season-cost.md in this step's problem folder.                                                                                                 |
| `FAIL  it has the sections Assumptions, Per application and Per season`                   | price-the-season: this rule is not met yet.     | Keep the three ## headings from the starter: Assumptions, Per application, Per season.                                                             |
| `FAIL  Assumptions give 1,200 applications and the input and output tokens for each`      | price-the-season: this rule is not met yet.     | Fill in the numbers after each colon under ## Assumptions. A season is 1,200 applications.                                                         |
| `FAIL  input tokens per application include one form and the whole policy`                | price-the-season: this rule is not met yet.     | Each call sends the policy and one form. Add the policy tokens to the form tokens from count-the-tokens.                                           |
| `FAIL  Per season gives a cost for Haiku, Sonnet and Opus`                                | price-the-season: this rule is not met yet.     | In the Per season table, put a dollar cost in each row: Haiku, Sonnet and Opus.                                                                    |
| `FAIL  each season cost matches your assumptions and the price list, within 20%`          | price-the-season: this rule is not met yet.     | Prices are per million tokens. Do input tokens times input price, plus output tokens times output price, then divide by 1,000,000 and times 1,200. |
| `FAIL  season-cost.md is in the folder`                                                   | spot-the-hidden-cost: this rule is not met yet. | Use the season-cost.md that is in this folder, or copy yours in from price-the-season.                                                             |
| `FAIL  it has a ## Hidden costs section`                                                  | spot-the-hidden-cost: this rule is not met yet. | Add a heading line: ## Hidden costs                                                                                                                |
| `FAIL  Hidden costs names at least three costs the first sheet left out`                  | spot-the-hidden-cost: this rule is not met yet. | Look for: the policy sent every time, output tokens, retries, caching and batch. Write a line for each one you find.                               |
| `FAIL  it gives a cached season total for Haiku, Sonnet or Opus`                          | spot-the-hidden-cost: this rule is not met yet. | Add a line like: Cached season total for Sonnet: $0.00 (with your own number).                                                                     |
| `FAIL  the cached total is lower than that model's total in Per season`                   | spot-the-hidden-cost: this rule is not met yet. | Reading the policy from the cache costs less than sending it fresh, so the cached total must be lower.                                             |
| `FAIL  the cached total matches your assumptions within 20%, with only the policy cached` | spot-the-hidden-cost: this rule is not met yet. | Only the policy is the same each time. Price the policy tokens at the cache read price, and the form and the reply at full price.                  |
