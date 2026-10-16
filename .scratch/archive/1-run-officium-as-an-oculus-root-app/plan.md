# Plan: 1. Run officium as an oculus root app

Execution ledger for [entry 1 of the roadmap](../../.agents/roadmap.md). One bullet is one step: a part of the entry. A step is built by one dispatch of its executor, or run by the orchestrator without an agent (marked); this plan's steps are built inline by the orchestrating session. A step is ticked only after its verification commands ran and the whole diff was read; the commands are in `orchestrator-state.md`, and nothing is ticked on inspection. The green checkmark is this file's status vocabulary; everything else in this folder is ASCII. Read `orchestrator-state.md` first after any context compaction.

## Goal

Officium's interface runs in an oculus tab as a root app built by `npm run build:oculus` into the git-ignored `.oculus/apps/officium/`, reusing the data, reader and view code of the other builds. It reads the library from `rituals/` (else `examples/rituals/`) through oculus's file bridge, keeps reader state through the bridge, opens a source PDF in oculus's viewer, and takes its colours from oculus's theme, with no change to oculus.

## Gate

`npm run build:oculus` and the six commands of `.agents/building.md` exit 0, and in a running oculus whose workspace lists officium, once the app is approved, its tab shows the first document of the library with the role selector, a selected role highlights its passages, and a source button opens the PDF in a File tab.

- The gate: could this pass without the goal being reached? No, the build and the six commands could exit 0 with no app showing, but the last clause needs a library document rendered in an approved oculus tab, which the build cannot produce.
- Step 1: could this pass without the goal being reached? No, an inline script, an absolute asset path or an app that does not mount fails the check.
- Step 2: could this pass without the goal being reached? No, it is the gate's last clause itself, run in oculus.

## Steps, in execution order

- ✅ 1 Build the app inline: `npm run build:oculus` writing `.oculus/apps/officium/` (relative asset paths, no inline script, ignored by git, Prettier and ESLint), the library loader over the file bridge, reader state through `getState`/`setState`, the source button through `oculus.open({ file })`, the theme mapping from `onTheme`, and the README section; check: `npm run build:oculus` exits 0, the built `index.html` has no inline script and no absolute asset path, the new vitest cases and a Playwright run of the built folder with a stub bridge pass (first document, role selector, the open call, changed colours under a changed theme), the six commands of `.agents/building.md` exit 0, and `/refute` runs once over the diff with its findings fixed (no commit) (approved)
- ✅ 2 Real run in oculus: the user approves the app in oculus, and the gate's last clause is checked on the page named TEST; check: the Officium tab shows the first library document with the role selector, a selected role highlights its passages, and a source button opens the PDF in a File tab, and the parts the browser draws itself (the scrollbars of the navigation and reading pane, the option lists of the document and role selectors) follow the oculus theme in light and in dark (no commit; orchestrator, no agent) (approved)
- ✅ 3 the closing: the closing report, the roadmap entry ticked with the gate's output, this folder moved to `.scratch/archive/` with `mv` (no commit; orchestrator, no agent) (approved)

## Could run in parallel

None. The steps depend on each other in order, and the work is inline.

## Rulings (2026-10-15)

- Open item A (2026-10-15): the work is built inline in this session, with no builder agent, and `/refute` runs once at the end of step 1 (the user).
- Open item B (2026-10-15): no commit of any kind is made (the user).
- Open item C (2026-10-15): the theme maps oculus's tokens onto officium's palette; `.oculus/apps/officium/` is git-ignored, built by `npm run build:oculus` and excluded from Prettier and ESLint; the PDF page jump is out of scope and booked by the user in oculus; oculus is not changed (the user).
- Open item D (2026-10-15): reader state goes through `setState`, per tab, so no file is written into the officium repository (the user).

## Agents

Each agent a plan skill started for this plan has one bullet, with its agent id, its role and the model the runner served it.

- af396d093ac9fe382: reviewer of step 1, claude-opus-5-5

## Blocked, and by what

- none.
