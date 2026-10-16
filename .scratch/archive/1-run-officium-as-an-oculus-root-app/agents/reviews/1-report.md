# Report: step 1, build the app inline

Nothing in the brief is left undone except what only the real oculus can show, which is step 2: that the real oculus serves the built folder under its policy, finds `app.yml` and draws the app. The step's checks use a stub bridge that serves the built folder under the policy of oculus's `DESIGN.md`.

## Open items

None.

## DONE / NOT DONE

| Item                               | Command                                                                                                                              | Result                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 build and bundle shape           | `npm run build:oculus`                                                                                                               | exit 0; `index.html` 0 inline scripts, 0 absolute `src`/`href` (`grep -P`)                                                                                                   |
| 2 ignored by Git, Prettier, ESLint | `git check-ignore -v .oculus/apps/officium/index.html`; `npm run format:check`; `npm run lint`                                       | `.gitignore:9`; both exit 0 with the folder present                                                                                                                          |
| 3 library through the bridge       | `npm test` (tests/oculus/library.test.ts)                                                                                            | 9 cases pass: fallback, personal precedence, directory format with data-URL image, empty, refusal word, bad section path, missing source, linked entry skipped, source place |
| 4 state through the bridge         | `npm test` (tests/reader/state.test.ts), `npm run test:browser`                                                                      | pass; the page runs under `sandbox` and `localStorage` access is blocked (test asserts it) while the reader works                                                            |
| 5 source button                    | `npm run test:browser` (oculus.spec.ts "opens the source PDF through the bridge")                                                    | open call equals `{ file: { root: 'officium', path: 'examples/sources/demonstration-ritual.pdf' } }`                                                                         |
| 6 theme                            | `npm run test:browser` (oculus.spec.ts "follows the oculus theme whatever the system scheme")                                        | body and navigation colours follow two token sets under an emulated dark system scheme                                                                                       |
| 7 README                           | `grep -n "## Run in oculus" README.md`                                                                                               | present                                                                                                                                                                      |
| 8 other builds unchanged           | `npm test`, `npm run test:browser`, `npm run build`                                                                                  | 44 tests (was 23), 13 browser tests (was 5), build exit 0                                                                                                                    |
| 9 no oculus file changed           | `git -C /Users/axelfaes/workspace/research-hub status --short tools/oculus` filtered to exclude `.scratch/`                          | 0 lines                                                                                                                                                                      |
| 9 no real ritual text              | no command; the files written hold only fictional content from `examples/` and invented fixtures                                     | not verified by a command                                                                                                                                                    |
| 10 gates                           | `npm test`, `npm run test:browser`, `npm run check`, `npm run lint`, `npm run build`, `npm run format:check`, `npm run build:oculus` | all exit 0; `svelte-check` 0 errors, 0 warnings                                                                                                                              |

## Files changed

Changed: `.gitignore` +2, `.prettierignore` +1, `README.md` +8, `config/text.yml` +3, `eslint.config.js` +1, `package.json` +1, `src/lib/data/text.ts` +3, `src/lib/desktop/library.ts` +2 -23, `src/lib/reader/state.ts` +29 -11, `src/lib/server/catalogue.ts` +3 -27, `src/lib/views/Reader.svelte` +8 -4, `.oculus/project.yml` +4 -4 (Prettier formatting, ruled by the user earlier).

New: `src/lib/data/images.ts` 26, `src/lib/data/sections.ts` 33, `src/lib/oculus/address.ts` 7, `src/lib/oculus/bridge.ts` 16, `src/lib/oculus/connect.ts` 10, `src/lib/oculus/library.ts` 163, `src/oculus/App.svelte` 83, `src/oculus/index.html` 12, `src/oculus/main.ts` 6, `src/oculus/public/app.yml` 5, `src/oculus/shims/app-paths.ts` 3, `src/oculus/theme.css` 109, `vite.oculus.config.ts` 24, `tests/browser/oculus.spec.ts` 241, `tests/data/sections.test.ts` 37, `tests/oculus/address.test.ts` 18, `tests/oculus/library.test.ts` 187, `tests/reader/state.test.ts` 51. Ledger pages updated: `.agents/building.md`, `.agents/change-standard.md`, `orchestrator-state.md`.

## Judgment calls the brief left open

1. `$app/paths` in `SourceLink.svelte` is resolved in the oculus build by an alias to `src/oculus/shims/app-paths.ts`, which does the one substitution `resolve` makes here; `SourceLink.svelte` is unchanged. In the oculus build the anchor branch is not rendered because `onopen` is always given.
2. The section-path validation of `catalogue.ts` and the image hydration of `desktop/library.ts` moved to `src/lib/data/sections.ts` and `src/lib/data/images.ts` and are used by both of those and by the oculus loader. The error texts are the same.
3. `theme.css` repeats the selectors of `src/app.css` that hold literal colours and overrides them with oculus tokens, so the browser and desktop builds keep their own palette untouched. Two literal colours stay as in `src/app.css`: the grey tile `#c8c8c8` behind symbol images, which is the same in the browser build's light and dark modes, and the white text of `.library-screen button`, which the oculus build never draws.
4. The bridge module is loaded with a dynamic `import()` of `/apps/-/oculus.js` (`src/lib/oculus/connect.ts`), so the bundle holds no copy of it and no type declaration for an absolute module name is needed.
5. `src/oculus/public/app.yml` is copied into the output by Vite; `emptyOutDir` makes each build replace the folder.
6. A short alert (`.oculus-notice`) shows a rejected `open` or `setState` with its refusal word, dismissible.
7. The source PDF is stat-ed at load through `oculus.fs.stat`, and a missing one refuses the library with the same wording as `src/lib/server/catalogue.ts`.

## User-visible changes

New Dutch strings in `config/text.yml`: `oculus.none_body`, `oculus.source_failed`, `oculus.state_failed`. In oculus there is no library picker button. Nothing changes in the browser and desktop builds.

## Not verified

- That the real oculus serves the folder, approves it and draws it (step 2).
- That `prefers-color-scheme` inside the oculus frame follows the oculus theme; `theme.css` does not depend on it.
