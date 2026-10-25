# Game Hub: start here

**Three games, one shared account system, one static website.** Edit source, build, then preview.

```sh
npm run setup         # First use: install the shared build tools and Anime Launch dependencies
npm run dev           # Build and serve http://127.0.0.1:4173/
npm test              # Check saves, accounts, game integration, and page routes
npm run format:check  # Check source formatting
```

## Where do I change something?

| Change                                                                  | Edit                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Add a game; change its title, description, picture, or navigation entry | [site/games.js](site/games.js)                                                                    |
| Dashboard layout / colors                                               | [site/index.html](site/index.html) / [site/styles.css](site/styles.css)                           |
| Account form layout / colors                                            | [shared/accounts/panel.html](shared/accounts/panel.html) / [panel.css](shared/accounts/panel.css) |
| Account labels and messages                                             | [shared/accounts/panel-view.js](shared/accounts/panel-view.js)                                    |
| Username and password rules                                             | [shared/accounts/settings.js](shared/accounts/settings.js)                                        |
| Master username and credential verifier                                 | [shared/accounts/master-account.js](shared/accounts/master-account.js)                            |
| What master status grants an account                                    | [shared/accounts/profiles.js](shared/accounts/profiles.js)                                        |
| Anime character power, unlock task, description                         | [anime-launch/game/characters/](anime-launch/game/characters/README.md) — one file per character  |
| Anime admin code                                                        | [anime-launch/scripts/game/apply-accounts.js](anime-launch/scripts/game/apply-accounts.js)        |
| Anime permanent progression fields and full-roster unlock behavior      | [shared/anime-progress.js](shared/anime-progress.js)                                              |
| Drive Mad level count, save files, native game identifier               | [drive-mad/game/progression.js](drive-mad/game/progression.js)                                    |
| Drive Mad account save selection and first-time master completion       | [drive-mad/src/profile-storage.js](drive-mad/src/profile-storage.js)                              |
| Replace a supplied game launcher                                        | `polytrack/index.html` or `drive-mad/index.html`                                                  |

## Folder map

```text
site/                 Dashboard, game wrappers, Account page, previews
shared/accounts/      Account workflows, password hashing, storage, shared form
shared/anime-progress.js  Permanent Anime Launch save format
anime-launch/         Scratch game, character settings, player and VM adapter
polytrack/            Supplied Polytrack launcher
drive-mad/           Supplied Drive Mad launcher and account-save adapter
scripts/              Build and local preview commands
tests/                Cross-game behavior and build checks
dist/                 Generated playable website; rebuilt from source
```

## Follow the flow

**Sign in:** form → `panel.js` → `account-store.js` → `passwords.js` + `repository.js` → public profile.

**Play Anime Launch:** public profile → game player → VM adapter → restore permanent unlocks after startup.

**Play Drive Mad:** public profile → choose that account's save folder → seed master completion once → start supplied game.

**Build:** `build-site.js` → build registered games → `assemble-site.js` → staged output → `dist/`.

## Keep these contracts stable

- Existing storage keys and password-hash parameters preserve existing sign-ins. Changing them requires an explicit migration.
- Anime variable names are the contract with the imported Scratch game. Use the shared progression helpers.
- Drive Mad's adapter runs **after** native storage is defined and **before** the game starts. Its save format matches the pinned supplied game.
- Accounts and saves are browser-local. Master status grants game unlocks; it does not administer a server.
- Polytrack and Drive Mad still load their compiled engines/assets from their supplied CDNs. Editable integration code lives here; their full engine source does not.
- Build, format, and preview commands never commit, push, or deploy. Publishing is a separate explicit action.

For the account record format, module boundaries, and build details, see [Architecture](docs/architecture.md).
