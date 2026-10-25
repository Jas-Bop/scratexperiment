# Anime Launch

A browser player for the original Anime Launch game. The website is authored in plain JavaScript modules, semantic HTML, and readable CSS. TurboWarp runs the supplied Scratch gameplay inside an iframe.

## Run locally

Requires Node.js 22 or later. No Python or framework is required.

```sh
npm ci
npm run dev
```

These commands launch Anime Launch alone. To play both games with the dashboard, run `npm run dev` from the repository root instead. Open http://127.0.0.1:4173. After changing source files, run `npm run build` and refresh. `npm run preview` serves an existing build.

## Where to make changes

| Change                                                  | Edit                             |
| ------------------------------------------------------- | -------------------------------- |
| Page text and layout                                    | `src/index.html`                 |
| Colors, fonts, base styles                              | `src/styles/theme.css`           |
| Game frame and toolbar                                  | `src/styles/player.css`          |
| Help text and footer styles                             | `src/styles/content.css`         |
| Phone and touch layouts                                 | `src/styles/responsive.css`      |
| Loading messages and player URL                         | `src/app/config.js`              |
| Keyboard/touch input definitions                        | `src/shared/controls.js`         |
| Loading, retry, restart, mute behavior                  | `src/player/game-player.js`      |
| Buttons and UI state                                    | `src/app/`                       |
| Communication with the game engine                      | `src/runtime/scratch-adapter.js` |
| Frame rate, stage size, storage identity                | `config/game.js`                 |
| Character stats, forms, descriptions, tasks, and roster | `game/characters/`               |
| Original animations, movement, and game art/audio       | `game/project.sb3`               |

All 14 roster characters have readable definitions in [`game/characters/`](game/characters/README.md), including six upgraded forms and their special attacks. Edit a character's settings, build, and refresh: the engine and tooltips both use those values. Nami still has twice Saitama's power and unlocks past 600 distance after using Luffy.

The build pipeline is `scripts/game/prepare-game.js`: apply character settings, wire the imported Nami sprite, then generate character cards. Scratch-specific references live in a separate compatibility adapter.

**The gameplay engine has not been completely rewritten into native JavaScript.** Character balance and supported progression settings are authored in JavaScript. Original animations, movement, and task orchestration remain in `game/project.sb3`. See the character editing guide for supported changes. `dist/game/script.js` is generated runtime code.

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

## Player accounts and Admin mode

Use **Create account** above the game to choose a username (for example, `Admin`) and a password of 8–128 characters. Sign in before playing to save character unlocks automatically. Guest play and original save codes remain available.

To activate Admin mode, sign in, start the game, choose its original **Load** button, and enter `14876178431werW`. This unlocks all characters, including Nami, every upgraded form, and maximum ammunition progression. The account gains an Admin badge and retains these unlocks after signing in again or restarting.

Accounts are local to this browser and website origin. They do not sync across devices, and clearing browser data removes them. Passwords use unique salts and PBKDF2-SHA-256 hashes; plaintext passwords are not saved. Sign-in persists for the current browser tab's session. High scores retain the original browser-wide behavior.

Admin mode is a local game unlock feature, not a server authorization role. A shared account service and protected administrative permissions would require a backend; GitHub Pages serves static files.

Editable account modules:

- `src/accounts/account-store.js`: credentials, local storage, sessions, and per-account character progress.
- `src/accounts/account-panel.js`: sign-up, sign-in, sign-out, and save status.
- `src/shared/progress.js`: the allowed permanent progression fields.
- `src/runtime/account-progress.js`: waits for game initialization, restores progression, and reports changed unlocks.
- `scripts/game/apply-accounts.js`: the admin load code, unlock behavior, and startup readiness markers. Change the code here, then rebuild.

## Deploy

GitHub Pages deploys the repository root Game Hub, which includes Anime Launch at `/anime-launch/` and Polytrack at `/polytrack/`, through `../.github/workflows/pages.yml`. Push source changes to `main`; the workflow tests and builds the game, then publishes `dist/`. See the repository root README for the site URL and Pages settings. You can also deploy `dist/` to another static host. The generated game includes its TurboWarp and Scratch license notices.

See [Architecture](docs/architecture.md) for module responsibilities and the message flow.
