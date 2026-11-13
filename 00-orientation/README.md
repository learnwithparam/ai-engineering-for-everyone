# Start here

You are the new admissions officer at Harbour Hill School. The school, the town and every family in it are made
up. The work is real: forms, a waiting list, parent emails, and letters that change a family's plans.

You will not write code. You will work in Claude, on the website or in the desktop app. Each step asks you to
make one small file. For example, it can be a prompt, a filled table or a scored sheet. A prompt is the text you
give the AI.

When your file is ready, you run one command. A check reads your file and tells you what passed.

## What you need

- A computer: Mac, Windows or Linux.
- A Claude account. The free plan is fine.
- This course folder.
- Bun. It is a small free tool that runs the checks.

## Set up

You type commands in a terminal. A terminal is a window where you type a command and press Enter. Then the
computer prints an answer.

1. Get the folder. On the course page, click **Code**, then **Download ZIP**. Unzip it.
2. Open a terminal. On a Mac, open the app called Terminal. On Windows, open PowerShell.
3. Install Bun. On Mac or Linux, paste `curl -fsSL https://bun.com/install | bash`. On Windows, paste
   `powershell -c "irm bun.sh/install.ps1 | iex"`. Then close the terminal and open a new one.
4. Go into the folder. Type `cd` and a space. Then drag the folder onto the terminal and press Enter.
5. Get the parts the checks need:

```bash
bun install
```

Expect: the last line says `packages installed` and there is no line that starts with `error`.

## Meet the office

```bash
bun run world
```

Expect: `The office is ready. Next: bun run office`

The practice folder is `world/harbour-hill/`. Open these three files and look through them:

- `policy/admissions-policy-2027.md`: the school's rules. Look at clause 1.2. It says a person makes every
  decision. A clause is one numbered rule.
- `applications/03.md`: one family's form. For example, this form is for Priya Natarajan. It says she lives
  2.31 km from the school gate.
- `register.json`: the list of every child and where they stand. Your web browser can open it.

## Run the finished system

```bash
bun run office
```

Expect: `3 of 6 forms need a person: HH-0113, HH-0114, HH-0117`

Now open `world/state/office-report.html` in your web browser. This page is the goal of the course:

- The AI reads the forms and drafts the letters.
- The rules set the order of the children.
- A person signs every letter.

Red cards are forms a person must check.

![The finished office in a browser: six forms, three flagged for a person](../images/finished-office.png)

## See the goal

Every step starts with a check that fails. That is fine. It shows you what is left to do.

```bash
bun run verify meet-the-office
```

Expect: one `PASS` line, four `FAIL` lines, `1 of 5 rules pass.` and `Progress: 0/26 steps pass.`

Each `FAIL` line has a `Try next:` line under it. For example, you see `FAIL  Plan names your Claude plan`. The
line under it tells you to write your plan name, such as Free or Pro.

The last line says `error: script "verify" exited with code 1`. That is normal. It only means some rules still
fail. You did not break anything.

![Your first check: each FAIL line says what to try next](images/first-run.png)

Now do your first step: [meet the office](../parts/00-meet-the-office/01-meet-the-office/problem/README.md).

Sometimes a command prints something you do not expect. Look it up in [troubleshooting.md](troubleshooting.md).

## Want to use your own AI account?

You do not need one. Replay mode runs everything with no key. It plays back saved AI replies, so it costs nothing.

A key is a secret password that lets the course use your own AI account. If you want live replies, follow these
steps:

1. Copy `.env.example` to `.env`.
2. In `.env`, set `LLM_PROVIDER` and one key.
3. Run `bun run models`.

Never paste a key into a chat.
