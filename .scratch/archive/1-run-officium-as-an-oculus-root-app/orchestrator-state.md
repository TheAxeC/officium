# Orchestrator state (read this first after any context compaction, or as a new orchestrator)

The catch-up note for entry 1 of `.agents/roadmap.md`, "Run officium as an oculus root app". Rewritten at every resume point of this plan. Everything here is also derivable from `plan.md`, the roadmap, `CLAUDE.md` and the working tree, but slower. Read this, then `plan.md`, then the tail of the transcript when there is one.

```yaml
verify: # run in order from the repository root; all must pass. Copied from .agents/building.md.
    - npm test 2>&1 | grep -E 'Test Files|Tests |FAIL|Error'
    - npm run test:browser 2>&1 | grep -E ' passed| failed|Error'
    - npm run check 2>&1 | grep -E 'COMPLETED|ERROR'
    - npm run lint 2>&1 | tail -n 20
    - npm run build 2>&1 | tail -n 5
    - npm run format:check 2>&1 | tail -n 5
    - npm run build:oculus 2>&1 | tail -n 5
rules: .agents/change-standard.md
standards: []
worktree_root: .agents/worktrees
worktree_paths: []
executor: inline # the orchestrating session writes each step itself, in the main checkout
worker: claude:opus
reviewer: claude:opus
libraries: avoid
review: every
refute_after_repair: yes
repair_rounds: 1
review_minutes: 0
look: ''
bench: []
adr: docs/adr
design_bar: industry
design_references: []
worker_effort: high
reviewer_effort: high
self_rule: off
next_entry: off
repair_reviewer: claude:opus
```

```yaml
dispatch: none
```

## Open items

- none.

## Closed items

- none yet.

## The standing demands (from Axel, in force)

- No commit of any kind is made in this plan, and nothing is pushed. This includes the plan's opening commit and the closing's commits. Files are written to the working tree only.
- The steps are built inline by the orchestrating session; no builder agent. `/refute` runs once, at the end of step 1.
- `CLAUDE.md` (git-ignored; its rules are in `.agents/change-standard.md`, section "Officium rules"). Real ritual text never appears in a test, an example, source code, a log, documentation, a brief, a report or quoted command output.
- A question or a decision for Axel is written in plain text, never in a question box. Reports state the end state only, and open with what is not done.

## Verification, every step

- The `verify` list above, from the repository root. Each step is ticked after its commands ran and `git diff` plus `git status --short` (untracked files) were read.
- Step 1 adds `npm run build:oculus` to the verify list and to `.agents/building.md`.
- Every step: `LC_ALL=C grep -n '[^ -~]'` over every file the step touches finds nothing new, and `git status --short` shows nothing outside the step's paths.

## Where things are

- Design: oculus's `DESIGN.md` section "Apps added while oculus runs" and `docs/apps.md`, in `/Users/axelfaes/workspace/research-hub/tools/oculus/` (read only; oculus is not changed). Ledger: `.scratch/1-run-officium-as-an-oculus-root-app/`, with `agents/briefs/` and `agents/reviews/`.
- The data the app reads: `rituals/` (private, git-ignored) else `examples/rituals/`; source PDFs in `rituals/sources/` and `examples/sources/`.
- Running and not to be disturbed: the oculus server in the hub, on 127.0.0.1 at the port its `.oculus/local.yml` names. The app is checked on the page named TEST, never on a page the user works on.

## Current position

- 2026-10-15. The plan is closed. Steps 1 to 3 are ticked in `plan.md`, the roadmap entry is in Done, the closing report is `agents/reviews/closing.md`, and this folder is under `.scratch/archive/`. No commit was made, as ruled.
- Open on Axel's side: change-standard rule 13 (a new test is run on the unchanged tree and its failure quoted) contradicts rule 21 of the same page and the user's rule against breakage testing; a ruling is awaited.
