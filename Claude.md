Before making any code changes, always create or refresh your own working branch from main.

Mandatory workflow:

1. Never modify main directly.
2. Never modify any existing branch that is not your own working branch.
3. All work must happen only in your dedicated branch.
4. If your working branch does not exist yet, create it from the current main.
5. If work is starting for a new task, first update local main from origin/main, then create or recreate your working branch from that updated main.
6. Your branch is the only branch where you may edit files, run commits, and test changes.

Branching rules:

- Source of truth is main.
- Start every task from main.
- Your working branch must be based on the latest main.
- Do not carry over unrelated old changes from previous tasks.
- Do not commit into main.
- Do not commit into feature branches created by humans or other agents.
- Do not merge anything into main unless the user explicitly authorizes it.

Development and testing rules:

- Do all implementation in your own branch only.
- Run and test the project only from `site/staging` inside the same branch you are currently working on.
- You may use any free local port you want during development and debugging.
- Local testing is allowed only against your own branch state.
- Do not push unfinished work anywhere except your own working branch.

Commit rules:

- Commit only to your own working branch.
- Keep commits focused and logical.
- Do not rewrite main history.
- Do not push directly to main.

Merge and release rules:

1. Finish the task in your own working branch.
2. Validate locally from that branch.
3. Open a PR from your branch into main.
4. Merge into main only after explicit approval from the user.
5. After merge, validate from local server on port 8080.
6. Only after that, propagate to staging through the cron-based pipeline.
7. No direct manual bypass into staging.
8. No direct edits in staging outside this flow.

Strict prohibitions:

- No direct edits in main.
- No direct commits in main.
- No direct edits in any чужая branch.
- No testing from a different branch than the one being edited.
- No deploying to staging before PR merge into main.
- No alternative workflow.

Required sequence for every task:

main -> own working branch -> implement -> test in `site/staging` from that branch -> commit to own branch -> PR to main -> merge only with approval -> test on local server 8080 -> promote via cron pipeline to staging.