# Anime Launch

A browser player for the original Anime Launch game. The website is authored in plain JavaScript modules, semantic HTML, and readable CSS. TurboWarp runs the supplied Scratch gameplay inside an iframe.

## Run locally

Requires Node.js 22 or later. No Python or framework is required.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. After changing source files, run `npm run build` and refresh. `npm run preview` serves an existing build.

## Where to make changes

| Change                                             | Edit                             |
| -------------------------------------------------- | -------------------------------- |
| Page text and layout                               | `src/index.html`                 |
| Colors, fonts, base styles                         | `src/styles/theme.css`           |
| Game frame and toolbar                             | `src/styles/player.css`          |
| Help text and footer styles                        | `src/styles/content.css`         |
| Phone and touch layouts                            | `src/styles/responsive.css`      |
| Loading messages and player URL                    | `src/app/config.js`              |
| Keyboard/touch input definitions                   | `src/shared/controls.js`         |
| Loading, retry, restart, mute behavior             | `src/player/game-player.js`      |
| Buttons and UI state                               | `src/app/`                       |
| Communication with the game engine                 | `src/runtime/scratch-adapter.js` |
| Frame rate, stage size, storage identity           | `config/game.js`                 |
| Actual characters, physics, skills, game art/audio | `game/project.sb3`               |

**The gameplay has not been rewritten into native JavaScript.** Edit `game/project.sb3` in Scratch or TurboWarp, export it over the same file, then build. The readable modules control the website and the interface to that game. `dist/game/script.js` is third-party generated runtime code, not the source of your game.

## Commands

```sh
npm run build         # Rebuild the entire deployable site into dist/
npm run preview       # Serve dist/ without rebuilding
npm test              # Player lifecycle and runtime integration tests
npm run format        # Format handwritten source and documentation
npm run format:check  # Check formatting without changing files
```

`dist/` is generated and ignored by Git. Never edit it: the next build replaces it. The build runs from any working directory and stages output before replacing the previous successful build. Dependencies are pinned in `package-lock.json`.

## Behavior and persistence

Click Play, then press any key or tap the Space control to start the game. Space launches/hits; F and 1–4 control character skills; R ends the run. On-screen controls use the same key definitions as the runtime adapter.

High scores are local to this browser. Original save/load codes remain available. Keep the `storageId` and `username` in `config/game.js` stable to preserve high-score storage and save-code compatibility.

## Deploy

GitHub Pages deploys this application through the workflow in `../.github/workflows/pages.yml`. Push source changes to `main`; the workflow tests and builds the game, then publishes `dist/`. See the repository root README for the site URL and Pages settings. You can also deploy `dist/` to another static host. The generated game includes its TurboWarp and Scratch license notices.

See [Architecture](docs/architecture.md) for module responsibilities and the message flow.
