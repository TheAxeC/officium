# Step 1 refuter report (working tree against HEAD)

Reviewer usage: agent af396d093ac9fe382, requested model opus (the completion notice names no served model), 223964 tokens, 73 tool uses, 651337 ms.

## Verification (rerun by the reviewer)

```
npm test 2>&1 | grep -E 'Test Files|Tests |FAIL|Error'
 Test Files  10 passed (10)
      Tests  42 passed (42)
exit=0

npm run test:browser 2>&1 | grep -E ' passed| failed|Error'
  10 passed (13.0s)
exit=0

npm run check 2>&1 | grep -E 'COMPLETED|ERROR|WARNING'
1792063623887 COMPLETED 424 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
exit=0

npm run lint 2>&1 | tail -n 20
> eslint .
exit=0

npm run build 2>&1 | tail -n 5
> Using @sveltejs/adapter-node
Generated an empty chunk: "chunks/env.js".
  ok done
exit=0

npm run format:check 2>&1 | tail -n 5
All matched files use Prettier code style!
exit=0

npm run build:oculus 2>&1 | tail -n 8
.oculus/apps/officium/index.html                   0.43 kB <box-drawing vertical> gzip:  0.27 kB
.oculus/apps/officium/assets/style-CWgbF_Mu.css   14.28 kB <box-drawing vertical> gzip:  3.68 kB
.oculus/apps/officium/assets/index-B8SRF4gU.js   161.80 kB <box-drawing vertical> gzip: 52.93 kB
<check mark> built in 128ms
exit=0
```

The report's own commands, rerun:

```
grep -P -c '<script(?![^>]*\bsrc=)' .oculus/apps/officium/index.html   -> 0
grep -P -c '(src|href)="/' .oculus/apps/officium/index.html            -> 0
  (the three src/href attributes are "data:,", "./assets/index-B8SRF4gU.js", "./assets/style-CWgbF_Mu.css")
grep -n "## Run in oculus" README.md                                   -> 48:## Run in oculus
grep -n oculus .gitignore .prettierignore eslint.config.js             -> .gitignore:9:/.oculus/apps/officium/ ; eslint.config.js:9: '.oculus/apps/', ; .prettierignore:9:.oculus/apps/
git status --short (officium)                                          -> no line for .oculus/apps/ (the folder exists, so it is ignored)
git -C /Users/axelfaes/workspace/research-hub status --short tools/oculus
  -> M tools/oculus/.scratch/migration/orchestrator-history.md, plan.md, queue.md (another plan's ledger; the same three files the session-start snapshot lists; no oculus source file)
```

Reproduced: 42 tests in 10 files (23 + 5 + 4 + 3 + 7 new cases from sections, state, address, library) and 10 browser tests; build:oculus writes `app.yml`, `index.html`, one JS file and one CSS file; `app.yml` holds `name: officium`, `title`, `description`, `glyph: page` (a key of oculus `config/catalogs/glyphs.yml`, line 130) and `bridge: 1`, and no `reads`, `writes` or `connects`; package.json adds only the `build:oculus` script and package-lock.json is unchanged (`git diff HEAD --stat`). Not reproduced: the report's judgment call 3 ("theme.css repeats the selectors of src/app.css that hold literal colours"), see S1.

## Verdicts

1. Holds: rerun of build:oculus and the two greps above; `cat .oculus/apps/officium/app.yml`.
2. Holds: `.gitignore:9`, `.prettierignore:9`, `eslint.config.js:9`; `git status --short` lists no `.oculus/apps/`; lint and format:check exit 0 with the folder present.
3. Violated (partial): the loader reads both formats through the bridge, turns images into data URLs and turns a non-`missing` refusal into an error, but its selection rule differs from `catalogue.ts` (S2).
4. Holds: `src/oculus/App.svelte:35-36,45-48` use `getState`/`setState`; the browser build keeps `storageStore(localStorage)` (`Reader.svelte:25`); the one `localStorage` reference in the bundle is reached only when `stateStore` is undefined, and the oculus App renders Reader only after it is set (`App.svelte:36-37,68,75`); the Playwright run under the sandbox policy shows no page error.
5. Holds in code (`App.svelte:51-59`, `library.ts:40-42`), but the rejection path has no test (P3).
6. Violated (minor): two app.css rules that hold literal colours are not overridden (S1). The check that the mapping wins whatever the system scheme holds for custom properties and token-coloured rules (oculus.spec.ts "follows the oculus theme whatever the system scheme"); the UA-drawn parts are covered by B3.
7. Holds: README.md:48-54. The README's "Verify" section was not updated (St2).
8. Violated (minor): `catalogue.ts` changes the error raised for an unreadable `document.yaml` (B2). Desktop image hydration and Reader keep their behaviour.
9. Holds: the oculus status above; every fixture in the new tests is invented (for example "Samengesteld", "Tweede regel.", "Voorbeeld.") or read from tracked `examples/`. The report's own row 9 says "not verified by a command"; I verified it by reading every new file.
10. Holds: the seven commands above all exit 0.

Behaviours added by the step that need a test, and their coverage:

- Corpus selection (personal over examples), directory format, data-URL images, `missing` vs other refusals in the loader: tested (`tests/oculus/library.test.ts`).
- Root key from the address: tested (`tests/oculus/address.test.ts`).
- State round trip through the bridge: tested (oculus.spec.ts "keeps the reading position").
- The browser build's stored state form: tested (`tests/reader/state.test.ts` "keeps the stored form").
- The `open` call: tested.
- Theme mapping: tested for two properties.
- A rejected `open`, a rejected `setState` and a load error reaching the screen: no test (P3).
- A selected role highlighting its passages (the gate clause): its test is vacuous (P2).

## 1. Spec

- **S1, requirement 6. theme.css does not override every app.css rule that holds a literal colour, and the report claims it does.** The selector-by-selector check of `grep -n -E '#[0-9a-fA-F]{3,8}|rgb\(' src/app.css` plus named colours against `src/oculus/theme.css` leaves two rules:
    - `src/app.css:592-598`: `.entry-content img { ... background: #c8c8c8;`. Failure scenario: under a dark oculus theme, every inline or block symbol image sits on a light grey tile that no token controls. This is the same as the app's own dark mode, so whether the tile should follow the theme is a design point, but the brief's "including the rules of src/app.css that hold literal colours" does not hold, and judgment call 3 in the report says it does.
    - `src/app.css:551-554`: `.library-screen button { ... color: white;`. This has no effect in the oculus build, because the oculus library screen draws no button (`App.svelte:77-82`). It only matters if a button is ever added there.
- **S2, requirement 3. The loader's selection rule differs from `src/lib/server/catalogue.ts`.**
    - (a) A missing source PDF. `catalogue.ts:87` runs `safeSourcePath(...)` for every document and throws `file does not exist` (`catalogue.ts:194-196`), so the browser build refuses the whole library. The oculus loader never checks the source (`library.ts:51-71`), and the report decides this as its own judgment call 7 ("The source PDF is not stat-ed at load"), although the brief did not leave it open. Failure scenario: `rituals/a.yaml` with `source.file: sources/gone.pdf`. The browser build shows the library error; the oculus build lists the document, and the source button gives the notice "...: missing".
    - (b) Linked entries. The server uses `entry.isFile()` / `entry.isDirectory()` (`catalogue.ts:138,146,149`), which are false for a symbolic link, so it skips links. The oculus loader tests bits (`library.ts:84,90,92,161-163`), and oculus reports a link inside the root as `64 + 1` or `64 + 2` (oculus `reach/fs.ts` `entryType`), so the loader follows it. Failure scenario: `rituals/current.yaml` is a link to `rituals/archive/v3.yaml`. The browser build loads one document; the oculus build loads it twice and `validateDocumentCollection` fails on the duplicate id, so the library does not open in oculus.
- Premises of the brief: all four reproduce. The policy matches DESIGN.md "Every app file is sent with this policy". `appAddress` is `@${encodeURIComponent(root)}/${name}` (oculus `apps.ts:48-51`), and `fsAddress` refuses `root !== row.root` (`methods.ts:442`). `paint` writes the tokens on the root element and prepends `:root { color-scheme: light dark; }` (`oculus.js:162-174`). `grep -rn '\$app/' src/` finds only `SourceLink.svelte:2`.
- No dependency is added. No script was written for the step beyond the brief: `vite.oculus.config.ts` and the `$app/paths` shim are build configuration that the build needs.

## 2. Proof

- **P1. The report lacks the evidence the change standard requires.** Rule 13 asks for each new test of added behaviour to be run once on the unchanged tree with the failure quoted, and for a table of behaviour, case and failing line. The report has neither. Rule 14 asks for a quoted grep of every changed name (`listedSectionPaths`, `hydrateImageUrls`, `readReaderState`, `writeReaderState`) and a reread of each head comment the change touches. The report has neither. My own grep (`grep -rn "ownRootKey|...|listedSectionPaths" src tests README.md .agents/*.md`) found no stale caller.
- **P2. `tests/browser/oculus.spec.ts:70-76` would pass with role selection broken.**
    ```
    await page.getByLabel('Rol').selectOption('coordinator');
    expect(await page.locator('.document-entry.contribution').count()).toBeGreaterThan(0);
    ```
    Reader starts on the first role (`Reader.svelte:54`, `roleId = firstRole(documents[0])`), which is `chair` in `examples/rituals/demonstration-ritual.yaml`, and chair already has contribution entries. So the count is above 0 whether or not `selectOption` changes anything. The gate clause "a selected role highlights its passages" is therefore not proven. Failure scenario: a change that ignores the role select still passes this test.
- **P3. No test covers what the user sees on a failure.** The stub's `open` and `setState` always resolve (oculus.spec.ts:230-231), and no test renders the App with a refusing `fs`. These paths are untested:
    - `App.svelte:56-58`: the `oculus.source_failed` notice. This is requirement 5's "A rejection is shown to the user".
    - `App.svelte:46-48`: the `oculus.state_failed` notice. `setState` rejects `too_large` per DESIGN.md "What an app keeps".
    - `App.svelte:38-39,79-80`: a load error reaching the screen.

    Failure scenario: a change that drops the `{#if notice !== null}` block (App.svelte:69-74) leaves every test green.

- **P4. The stub bridge does less than `oculus.js`.** Its `paint` (oculus.spec.ts:202-206) does not prepend the `oculus-scheme` sheet and does not toggle `wall`. It paints only 11 tokens, without `--c-red`, which `theme.css:106` uses for the notice border. The page loads top level, not inside a sandboxed iframe, so the frame's colour scheme (DESIGN.md "The frame") is never exercised. The Content-Security-Policy replica (oculus.spec.ts:167-179) matches DESIGN.md's policy for an app with no `connects`, with `<base>` and `<shared>` built as DESIGN.md defines them; that part is faithful. The theme test checks two properties only (body background, first `.navigation button` colour).
- **P5. Two silent guards stand where change-standard rule 2 asks for an asserted invariant.**
    - `App.svelte:53`: `if (document === undefined || bridge === null || library === null) return;`
    - `App.svelte:46`: `bridge?.setState(...)`

    Both are unreachable today, because Reader is drawn only after `bridge`, `library` and `stateStore` are set (`App.svelte:33-37,68`), but they skip work silently instead of asserting that order.

- **P6. The architecture test now reads generated output.** `tests/architecture.test.ts:27-32` walks the whole repository, and `generatedDirectories` (`:52-62`) was not given `.oculus` or `apps`, so it reads `.oculus/apps/officium/assets/index-*.js` (144 lines today, `wc -l`) as a handwritten source file. The result of `npm test` now depends on whether `build:oculus` ran before it. Failure scenario: a bundle whose minified output reaches 1,000 lines fails `npm test` on a generated file.

## 3. Standards

- **St1. `.agents/building.md`, the table, is out of date after the step, which edited that page.**
    - The "Last run" column still reads `exit 0, 6 files, 23 tests passed` for `npm test` and `exit 0, 5 passed` for `npm run test:browser`; the reruns give 10 files, 42 tests and 10 passed.
    - "What it checks" for `npm test` lists "data, reader, server, architecture, privacy" without `tests/oculus/`.
    - For `npm run test:browser` it says "against `npm run dev` on 127.0.0.1:8793", while `oculus.spec.ts` builds the app and serves it through routes at `http://officium.test`.
- **St2. README.md "Verify" still lists six commands, without `npm run build:oculus`.** `.agents/change-standard.md` "Commands and their filters" and `.agents/building.md` now list seven, so the two pages contradict each other (rule 18). Failure scenario: a contributor adds an `$app/navigation` import to a view, runs the README's six commands green, and the oculus build is broken.
- **St3. `.agents/change-standard.md` "Officium rules" still says "interface colors in `src/app.css`".** The step adds colour declarations in `src/oculus/theme.css`: the `color-mix` mixes at `:18-21,30` and the notice colours at `:104-106`. The rule was not amended to name the file the brief asks for, so the rule and the tree now disagree (rule 18).
- **St4. The head comment of `src/oculus/theme.css:1-5` describes only part of the file.** It says the file "Maps the tokens oculus paints ... onto the palette of src/app.css". `theme.css:94-109` is the layout and colours of a new component (`.oculus-notice`: `position: fixed`, padding, border), which is not a token mapping. That makes a sentence about the file as a whole false (rule 14). The notice's button has no style, so it draws as a UA button.
- **St5. A helper is copied, not shared.** `src/lib/oculus/library.ts:146-151` `imageMimeType` is a verbatim copy of `src/lib/desktop/library.ts:65-70`, while the step's stated aim is to share the image code (it moved the hydration into `src/lib/data/images.ts`).
- **St6. Two strings are user-facing but live outside `config/text.yml`.** `src/oculus/public/app.yml:2-3` holds `title` and an English `description` (`Reads the documents of the officium library from this folder.`) that oculus shows at approval, while the interface is Dutch. Oculus reads them from the manifest, so they cannot live in `config/text.yml`. This is a clash with the Officium rule that the report does not raise.
- **St7. `vite.oculus.config.ts` is not type-checked.** `.svelte-kit/tsconfig.json` "include" names `../vite.config.ts` but not this file, so svelte-check never sees it; only ESLint reads it.
- Non-ASCII: `LC_ALL=C grep -n '[^ -~]'` over every changed and new file (`config/text.yml` excluded because it holds accented Dutch letters) found nothing (exit 1). The three lines added to `config/text.yml` contain no non-ASCII byte (`git diff HEAD -- config/text.yml | grep '^+' | LC_ALL=C grep -c '[^ -~]'` gives 0). No tabs. Files are under 1,000 lines. I found no mutable module-level variable and no layer violation: `src/lib/data/{images,sections}.ts` import only the model, validate and yaml.

## 4. Behaviour

- **B1. Text that is not valid UTF-8 is handled differently, and the oculus error does not name the file.** `src/lib/oculus/library.ts:137-139`:
    ```
    return new TextDecoder('utf-8', { fatal: true }).decode(await readBytes(files, root, path));
    ```
    The decoder's `TypeError` carries no path. The server reads with `readFileSync(..., 'utf8')`, which substitutes replacement characters. Failure scenario: a document saved as Latin-1. The browser build opens it (with replacement characters); the oculus build shows only "The encoded data was not valid for encoding utf-8", with no file named among possibly dozens.
- **B2. The error for an unreadable `document.yaml` changes.** `src/lib/server/catalogue.ts:157`:
    ```
    const names = listedSectionNames(readFileSync(documentPath, 'utf8'), documentPath);
    ```
    Before the change, `readFileSync` ran inside the `try` and a read error became `DocumentValidationError(documentPath, '$', 'invalid YAML: ...')`. Now the raw `EACCES: permission denied, open '<path>'` propagates. `api/catalogue/+server.ts` has no catch, so the browser user sees a 500 either way and only the server log line differs. Every other message and the order of checks are unchanged (`sections.ts:10,13,17-21,25-29` against the removed lines). Desktop image hydration keeps its order and its URLs (`desktop/library.ts:49-51`).
- **B3. Parts the browser draws itself do not follow the oculus theme.** `src/app.css:12` keeps `color-scheme: light dark` on `:root`, and theme.css sets no `color-scheme` from the theme. The browser therefore draws these with the frame's preferred scheme, not the tokens: the scrollbars of `.navigation` and the reading pane, the native option list of the document and role `select`s, and the unstyled notice button. If that preferred scheme follows the system rather than oculus's theme, then with a dark system and a light oculus theme these parts are dark on a light page. Neither the report nor any test settles which way the frame behaves (the report lists it as not verified, and P4 says why the Playwright run cannot show it).
- **B4. Screens drawn before the theme is painted have no palette.** theme.css maps every surface to a token with no fallback (`theme.css:8-10`), and `ownRootKey` runs before `connectBridge` (`App.svelte:31-32`). So the loading screen and any error raised before `paint` draw with invalid variables: a transparent background and the system `CanvasText` colour. Failure scenario: the app folder placed in the machine apps folder (address `/apps/officium/<key>/`). `ownRootKey` throws, and the error text is drawn in system `CanvasText` over the oculus pane, unreadable when the system and theme schemes differ.
- Storage and network: the bundle holds no `sessionStorage`, `indexedDB`, `document.cookie`, `fetch(`, `XMLHttpRequest` or `WebSocket`. The only addresses are `svelte.dev` error-page strings and the bridge path `/apps/-/oculus.js` (grep of `assets/index-*.js`). The one `localStorage` reference is unreachable in this build (verdict 4). No finding.
- `emptyOutDir` and the copy of `app.yml` from `public/`: during a rebuild the folder briefly holds `app.yml` without `index.html` or assets. Oculus debounces and rereads every app on a change (DESIGN.md "How oculus finds it while running"), so a mid-build read is replaced by the next one. I see no lasting effect; this is not a finding.

## Declined to judge

- `git check-ignore -v .oculus/apps/officium/index.html`: I may not run it. `grep` shows the rule at `.gitignore:9`, and `git status --short` shows no untracked entry for the existing folder.
- Whether `Generated an empty chunk: "chunks/env.js"` from `npm run build` is new. Settling it needs a build at HEAD, which needs a git command I may not run (for example `git stash`), or a worktree.
- Whether the `.oculus/project.yml` reformat belongs to this step. `orchestrator-state.md` "Current position" records it as modified at the plan's opening, so I did not judge it as part of the step.
- Whether `prefers-color-scheme` inside an oculus frame follows the frame element's `color-scheme` or the system (B3). Only the real run in step 2 settles it.

## Closed

Each finding below was checked against the tree before it was closed. The seven commands after the closing edits: `npm test` 10 files, 44 tests passed; `npm run test:browser` 13 passed; `npm run check` 425 files, 0 errors, 0 warnings; `npm run lint`, `npm run build`, `npm run format:check` and `npm run build:oculus` exit 0.

- S1: closed without a code change to the two rules. The tile `#c8c8c8` behind symbol images is the same grey in the browser build's light and dark modes (`src/app.css:598`, the only `#c8c8c8`), so the oculus build keeps it in every theme; the white text of `.library-screen button` is not drawn in the oculus build. `src/oculus/theme.css` head comment now says so, and the builder report's judgment call 3 is corrected.
- S2a: fixed. `requireSource` in `src/lib/oculus/library.ts` calls `fs.stat` on the source file and raises `<document>: source.file: file does not exist: <path>`. Test: `tests/oculus/library.test.ts` "refuses a document whose source file is missing".
- S2b: fixed. `isType` compares for equality, so entries typed `64 + 1` and `64 + 2` are skipped as the server skips links. Test: "skips an entry that is a link, as the server catalogue does", whose linked file would raise a duplicate id if followed.
- P1: rule 14 grep run (`grep -rn -E "listedSectionPaths|hydrateImageUrls|readReaderState|writeReaderState|imageMimeType|listedSectionNames|attachImageUrls|isType" src tests README.md .agents/*.md`): no hit for `hydrateImageUrls`; every other hit is a current caller. The head comment touched is `src/oculus/theme.css`, reread and corrected (St4). Rule 13's failing run on the unchanged tree is raised in the step report as a rule clash with rule 21 and the user's rule against breakage testing.
- P2: fixed. The test selects `speaker`, then `coordinator`, and asserts both contribution lists are non-empty and differ.
- P3: fixed. Three browser cases: a refused `open` shows an alert holding `declined`; a refused `setState` shows an alert holding `too_large`; a refused `readDirectory` shows `rituals: failed:500` on the library screen.
- P4: the stub paints `--c-red` now. The frame's colour scheme and the `oculus-scheme` sheet cannot be reproduced by the stub; they are checked in step 2 (see B3).
- P5: fixed. `src/oculus/App.svelte` passes the connected bridge, root and library to `saveState` and `openSource` from `onMount`, so no null guard remains; an unknown document id throws inside the `try` and shows the notice.
- P6: fixed. `.oculus` is in `generatedDirectories` of `tests/architecture.test.ts`.
- St1, St2, St3: fixed in `.agents/building.md`, `README.md` ("Verify" lists `npm run build:oculus`) and `.agents/change-standard.md` ("Officium rules").
- St4: fixed, the head comment names the notice.
- St5: fixed. `imageMimeType` is exported from `src/lib/data/images.ts` and used by `src/lib/desktop/library.ts` and `src/lib/oculus/library.ts`.
- St6: recorded as the one exception to the string rule in `.agents/change-standard.md` "Officium rules".
- St7: fixed. `svelte.config.js` adds `../vite.oculus.config.ts` to the generated tsconfig's `include`; svelte-check now reports 425 files (was 424).
- B1: fixed. The decoder is the default one, as `readFileSync(..., 'utf8')` is, so a Latin-1 file loads with replacement characters in both builds.
- B2: fixed. `src/lib/server/catalogue.ts` reads the manifest inside a `try` and raises the same `invalid YAML:` error as before.
- B3: booked in `plan.md` step 2 as part of its check.
- B4: fixed. `App.svelte` connects the bridge first and reads the root key after, and `theme.css` gives the root colour and background the fallbacks `CanvasText` and `Canvas`.
- Declined to judge: the empty chunk message is also printed by `npm run build` on an exported copy of `HEAD` (built in the scratchpad and removed). The `.oculus/project.yml` reformat was the user's ruling.
