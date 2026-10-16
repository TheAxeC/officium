# The change standard

How a change is made in this tree, whoever makes it: a session working inline, or an agent dispatched under a brief. A brief points here first; nothing in a brief overrides anything here. The section "Officium rules" below says what the result looks like; the rest of this page says how the work is done and how it is reported.

## Read before changing anything

1. The brief for the step, in full: it is the specification. Where the brief and the tree disagree, stop and report the disagreement with the evidence; do not pick a side and do not invent a substitute.
2. The standards the brief lists, in full: the section "Officium rules" below, and any ADR the brief names.
3. Every file the brief names, in full, and every caller a grep finds for a name the change moves or renames.

## Scripts compute facts; judgment is read

Every rule on this page that names code, a script, a test or a check is read under this section.

- A script does only what has one correct answer that a machine computes exactly: moving files and commits, validating configuration keys, comparing two texts, counting, resolving an identifier such as a citation key or a DOI.
- Whether text is good, whether content is right, whether work is done, and anything a careful person could dispute is judged by reading, by the model or by the user.
- No script output stands in for that judgment, gates it, or is shown to the user as a finding.
- A script is never made more exact in the hope of reaching such a judgment. A wrong hit of a helper script is dropped, not raised as work.
- A new script needs the user's approval of what it computes before it is written.
- A test exists only for code, and only for behaviour whose failure costs something: lost work, a broken installation, a wrong configuration accepted.
- Code handles a case only when that case has happened or when a wrong answer on it costs something. No brief, case or review finding adds a case on other grounds.
- A gate for a judgment is a review: the user's, a blind comparison, or, where the user rules so for a roadmap entry, a fresh reviewer agent's. "A script prints ok" is a gate only for a fact.
- A recurring finding is answered with a rule sentence or a change to the text that should have prevented it. A check is proposed only for a fact a machine computes, with the user's approval.
- What a skill or tool gives the user is written for a person to read, never in a machine's format.

## The rules

1. **A defect in code begins with a test that fails on the tree as it is.** Write the test, run it, see it fail for the reason the brief states, and only then change the code. The report quotes the failing check. A test written after the fix, or one that would have passed before it, is not a test of the defect. A defect in text or in a judgment (a page, a rule, a skill's instructions, a brief) is fixed by reading, with no test, and the report quotes the text before and after, as "Scripts compute facts; judgment is read" says.
2. **A guard is not a fix.** A null check, an early return, a fallback value or a "cannot happen" comment does not close a defect. For every path that could be reached without the thing it needs, either prove it unreachable by citing the code that makes it so and then assert the invariant, or pass the needed thing down from the caller that has it, changing signatures as far up as needed. A guard that silently skips work is a silent partial result and is forbidden.
3. **A check that goes red is a design fact, never a number to get under.** Find the coupling the check names and remove it by a change the brief would approve, or stop and report the check red with the reason.
4. **The brief's fix text is the specification.** A premise found wrong is reported with the evidence, and the rest of the brief still lands; the substitute is the orchestrator's to write, not the builder's. A shape the brief reserves for the user (a public signature, a config key, a wire format, a vocabulary) is never chosen by the builder. A point that a review or the brief leaves to the orchestrator (a substitute, a moved file, a rewrite of text the brief dictates) stays as the brief has it and is reported as a stop; the report never decides it as a judgment call.
5. **Every user-visible surface changed is documented in the same step**: the header comment, the section of `README.md` where it is shown, and the ADR that owns the decision when the change touches one.
6. **Before landing, verification runs the checks of the files the step changes.** The builder and the reviewer run the checks the brief names for the files the step changes. They also run the repository's character-set check over those files where its verify list holds one. The plan's whole verify list runs once, at landing on main. The report gives the numbers seen, never the numbers expected. A check verifies a fact, never whether the work is right; whether the work is right is judged by the review, by reading, as "Scripts compute facts; judgment is read" says. A suite total that moved is a defect in the change until it is traced test by test; a new test moving a total upward is fine and the report says by how much. Zero warnings in every configuration; "pre-existing" excuses nothing.
7. **The report states the end state only.** First line: anything NOT DONE, or that everything in the brief is done. Then the state file's open items verbatim. Then a DONE / NOT DONE table, one row per item, each naming the command that proves it and its output. Then every file changed with its line count, every judgment call the brief left open, every user-visible change with the before and after, and anything in the brief that turned out wrong or impossible, with the evidence. No narration of attempts; no measurement stated that was not taken; partial work never presented as complete.
8. **A test is not a user.** A member whose only callers are tests is dead and is deleted with the check that pinned it, or the check asserts the behaviour another way. A public member with no in-tree caller is not dead by this rule: the report states the facts and the user rules.
9. **A test never asserts a known defect, and no check is loosened to pass.** A threshold, tolerance or predicate widened to make a check green is a finding to report, not an edit to make. A green result states, in the same breath, what it does not cover.
10. **No history in code or comments.** A comment says what the code does and why, never when it was written, which step or session wrote it, what bug came before it or what was reverted. No roadmap or step numbers in comments. ASCII only and no em dashes. Prose and comments have no double blank lines; Python code keeps two blank lines between top-level definitions, as PEP 8 lays it out.
11. **Nothing added on a hypothesis.** No mutable global state; no member, parameter or file whose only user is a test or a hypothetical caller; no dependency the brief did not name.
12. **Nothing inside the brief is left undone.** A miss is fixed before the report is written, or it is a stop with the evidence and the rest still lands. A miss is never reported as a known limit, a gap, a sharp edge or a later item.
13. **A test proves the change by failing on the unchanged tree, and the report quotes the failure.** The unchanged tree is the tree before the change; for a plan step it is the tree at the step's base. The report quotes each run verbatim beside the test's name and names no revert.

- A new or changed test of a behaviour the change adds or changes is run once on the unchanged tree, before the code is changed, and fails there. That run is its proof, and the report quotes the failure. An edit to the test after that run is checked by reading it, with no further run on the unchanged tree.
- A new or changed test of a behaviour the change preserves is run on the unchanged tree before the change, where it can run there, and passes, and it passes again after the change. The report quotes each of those runs.
- A case asserting that a rule stays silent carries a control, the near-miss the same rule must report. Of the two, the test of the behaviour the change adds or changes is the one that fails on the unchanged tree.
- A test that would still pass with the behaviour it is written for taken out of the code is an audit, not a proof: an assertion over source text, over a name alone, over a constant, or over a path the suite never executes. The reviewer finds such a test by reading it.
- Each behaviour the change adds or changes whose failure costs something, as "Scripts compute facts; judgment is read" says, has a case, and the report lists them in a table: the behaviour, the case and the failing line quoted for it. The table covers those behaviours, not every branch or every rule a head comment states.

14. **A change carries to every place that names it.** After changing a name, a construct or a shape, grep it across `src/`, `tests/`, `examples/`, `config/`, `src-tauri/src/` and `README.md`, and carry the change to every hit or say why not; the report quotes that grep. A sentence in a document or a head comment that the change makes false is a defect of the change. A sentence about the changed file as a whole (its introduction, its head comment, a count, an 'every' or an 'only') is reread against the file after the change, and the report lists each one with the line that shows it still holds. A script's head comment or docstring lists every input it reads, every error it prints and every exit status it returns; an error added to the script is added to that list in the same change.
15. **Each place where a supplied value reaches a command, a path or generated text is a case.** A value a user, a file or a script supplies is untrusted where it reaches a command, a path or generated text. Each such place is a case, since a wrong answer there runs a command, writes outside its folder or puts the supplied text where it was not meant to go.
16. **A write verifies its own result.** A step or a tool that rewrites a file's text re-parses what it wrote and refuses when the reparse is not what was asked. A write that cannot verify itself does not land.
17. **A rewrite keeps the meaning of every rule it carries.** When a change rewrites, moves or splits text that states a rule, the new text states the same rule with the same scope: every condition, exception and limit of the old text is kept and none is added. A change of meaning the brief does not ask for is reported as a stop.
18. **A change leaves no two statements that contradict each other.** Each rule the change writes is grepped by its key terms across the changed files and the pages they name, and a statement that says otherwise is changed in the same step, or reported as a stop when the brief does not cover it.
19. **Nothing is changed that no brief item asks for.** A change outside the brief's items is left out; when an item cannot be met without it, the report lists it under the judgment calls with the item it serves.
20. **A secret in quoted command output is written `<REDACTED>`.** Every quote of a command's output, a verbatim one included, carries `<REDACTED>` in place of the value of a secret in it (a password, an API key, an access token, a private key, a session cookie, a credential inside a URL or a connection string), and keeps the rest of the line as printed.
21. **No breakage testing.** Code is never deliberately broken to see whether a test catches it: no revert proof, no fault put into a copy, no harness that applies such changes. A test is judged by reading it.

## Where the work happens

- In the git worktree the brief names, never in the main checkout. Every path in the brief is relative to that worktree.
- No git command that changes state: no `add`, `commit`, `stash`, `checkout`, `mv`, `restore`. Reading with `git status`, `git diff` and `git show` is fine; a file is moved with `mv`.
- Nothing under the ledger folder is edited except the report the brief names. The plan, the state file and the briefs belong to the orchestrator.
- A ledger file cites a page (the rules page, a standard, a skill's text) by its section, never by a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`. A brief's "Paths this step writes" keeps its line ranges, numbered as on main at the base. A "Doc text" entry quotes the current line with the number `grep -n` prints, and the quoted text is what locates it.
- No sub-agents; no background shells, sleeping or polling, except a capture of a run the runner's command cap would kill, with its whole output written to a file the report names.

## Commands and their filters

Every build, test or check command runs in the foreground with a long timeout, one configuration per command, and its output goes through a filter for its summary lines so raw build output never enters the context:

```
set -o pipefail
npm test 2>&1 | grep -E 'Test Files|Tests |FAIL|Error'
npm run test:browser 2>&1 | grep -E ' passed| failed|Error'
npm run check 2>&1 | grep -E 'COMPLETED|ERROR'
npm run lint 2>&1 | tail -n 20
npm run build 2>&1 | tail -n 5
npm run format:check 2>&1 | tail -n 5
npm run build:oculus 2>&1 | tail -n 5
```

The plan's whole verify list runs once, at landing on main, through the `land` skill's `templates/checks.sh` from the root of the checkout it checks, as `sh <the land skill's folder>/templates/checks.sh <state file>`. The booking quotes the lines it prints, never a count. Before landing, the builder and the reviewer run the checks the brief names for the files the step changes, and the report quotes their output. Each command in the verify list exits non-zero when it fails, as written, and a command with long output uses its tool's quiet mode or a filter under `pipefail`.

When a run is red, rerun the one suite or check that failed and read that output, never the whole run's. A claim about behaviour, cost or memory names the command that produced it, or is written as not verified.

## Officium rules

These come from the repository's `CLAUDE.md` (git-ignored, so a worktree does not hold it) and `README.md`.

- Four spaces for indentation. Each handwritten source file stays below 1,000 lines and is split earlier when it has more than one subject; the completed section files listed in `tests/architecture.test.ts` are the exception and are not divided by page or line count.
- User-facing strings live in `config/text.yml` and interface colors in `src/app.css`; the oculus build maps oculus's theme tokens onto those colors in `src/oculus/theme.css` and draws its notice there. The one exception for strings is `src/oculus/public/app.yml`, whose `title` and `description` oculus reads from the manifest. No mutable module-level state.
- The data layer imports no reader or view code. The reader imports the validated data model and no Svelte component or server filesystem code. Views receive validated documents and use reader functions.
- Real ritual data lives only under the ignored `rituals/` directory. Real ritual text never appears in a test, an example, source code, a log, documentation, a brief, a report or quoted command output. Tracked examples are fictional.
- The public repository builds without `rituals/`. `.oculus/apps/officium/` is generated by `npm run build:oculus` and is git-ignored.
- Before a change is reported as verified, every command in the commands block above passes.
