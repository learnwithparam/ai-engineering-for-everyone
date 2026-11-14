# Capstone: run one task from your own work through a test set

Copy `capstone/template` to a folder of your own, for example `my-work`. Fill in `my-task.md` and
`my-test-set.csv` with a real task from your own work. Then run:

```bash
bun capstone/check.ts my-work
```

Expect: `Done. All 9 capstone rules pass.` when your files are filled in.

The check reads only your folder. It proves the files have the right shape. It proves you have at least six
real cases and that every miss has a reason. It also proves your result matches the count in the file. It cannot
judge whether your task is a good one. A person you trust should read it.

`capstone/sample` shows a finished example.
