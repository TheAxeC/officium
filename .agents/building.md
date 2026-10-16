# Building and checking Officium

Install Node.js 24, then `npm install` (README.md, "Run"). Every command runs from the repository root. The order is the one `CLAUDE.md` gives for reporting the application as verified.

| Command                | What it checks                                                                                                                       | Last run                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `npm test`             | vitest over `tests/`: data, reader, server, oculus, architecture, privacy                                                            | exit 0, 10 files, 44 tests passed                 |
| `npm run test:browser` | Playwright in Chrome: the app on `npm run dev` on 127.0.0.1:8793, and the oculus build served through routes under the oculus policy | exit 0, 13 passed                                 |
| `npm run check`        | `svelte-kit sync` and `svelte-check`                                                                                                 | exit 0, 0 errors, 0 warnings                      |
| `npm run lint`         | `eslint .`                                                                                                                           | exit 0                                            |
| `npm run build`        | `vite build` with adapter-node                                                                                                       | exit 0                                            |
| `npm run format:check` | `prettier --check .`                                                                                                                 | exit 0, all matched files use Prettier code style |
| `npm run build:oculus` | `vite build` of the oculus app into `.oculus/apps/officium/`                                                                         | exit 0                                            |

`tests/privacy.test.ts` requires `/rituals/`, `/docs/`, `/AGENTS.md` and `/CLAUDE.md` to stay in `.gitignore`, and no path below `rituals/` to be tracked.
