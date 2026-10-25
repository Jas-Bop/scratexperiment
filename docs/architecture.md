# Architecture and maintenance

Start with [the change map](../START_HERE.md). This page explains the boundaries behind it.

## Accounts

| Module                        | Owns                                                                  | Does not own                                   |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `shared/accounts/settings.js` | Username/password rules, storage key names, hash format               | User records                                   |
| `passwords.js`                | Salt creation and Web Crypto hashing/verification                     | Browser storage or UI                          |
| `repository.js`               | Reading/writing records and the active session                        | Login decisions or game rules                  |
| `profiles.js`                 | Master recognition, public profile shape, master progression defaults | Password verification or DOM                   |
| `account-store.js`            | Create, sign in, sign out, save progression                           | HTML rendering or cryptographic implementation |
| `panel.js`                    | Connect form events, account workflows, and an optional game player   | Storage format or UI wording                   |
| `panel-view.js`               | DOM updates, account labels, messages                                 | Credentials at rest or game state              |
| `panel.html` / `panel.css`    | Shared form markup / styling                                          | Application behavior                           |

Both the website and Anime Launch import the same shared form controller. Small re-exports under `anime-launch/src/accounts/` keep existing imports working; they contain no separate implementation.

### Stored records

The legacy `anime-launch.accounts.v1` local-storage key is retained deliberately. It holds an array of records:

```text
id            Stable random account identifier; also selects Drive Mad's save folder
username      Display name; username lookup ignores letter case and surrounding spaces
salt          Per-account password salt
passwordHash  PBKDF2-SHA-256 verifier; plaintext passwords are never stored
role          Optional master marker; checked against the configured master credentials
progress      Validated permanent Anime Launch character/task/ammunition values
```

The legacy `anime-launch.session.v1` session-storage key contains only the active account ID. Its tab-local lifetime is intentional. A public profile contains only `id`, `username`, `role`, and a copied `progress` map.

Existing hashes use the parameters in `PASSWORD_FORMAT`. Do not change the algorithm, iteration count, salt encoding, or storage keys as a styling/configuration cleanup: old records need a migration first. Damaged account data produces an error and stays intact for recovery.

## Game integration

Anime Launch's original game stays in `game/project.sb3`. Character definitions are authored JavaScript. Build-time compatibility modules connect those definitions to the imported Scratch blocks. The original SB3 is read, never edited by the build.

`shared/anime-progress.js` is the permanent-save contract. The runtime waits for both startup markers before restoring progression; otherwise the original game would reset freshly restored unlocks. Restart follows the same sequence. Account switches remove the previous iframe, and origin/source checks reject messages from replaced games.

Drive Mad uses its native compressed save database. `game/progression.js` documents the pinned game's ID, real level count, and completion values. The profile adapter selects one storage namespace per account. It migrates old saves into Guest only, and writes the master seed marker last so future launches preserve later achievements.

Polytrack remains the supplied HTML launcher. No custom replacement racing engine is maintained here.

## Builds

`scripts/build-site.js` is the entry point, intentionally kept short:

1. `site/build-games.js` runs each registered game's build.
2. `site/assemble-site.js` copies shared assets, renders the dashboard/account/wrapper pages, and installs game outputs.
3. `build-tools.js` stages output before replacing the previous successful build.

`build-tools.js` also selects the shared esbuild version. For compatibility with the existing install workflow, the toolchain is installed under `anime-launch/node_modules` by `npm run setup`. Game source imports never depend on that installation path; only the build helper does.

The supplied launchers' source remains available beside their adapters. Generated `dist/` and staging folders are disposable. Edit source and rebuild rather than repairing generated files.

## Verify a change

Run the root test, format-check, and build commands. For account/player changes, also check sign-in, reload, sign-out, and switching to a second account in a browser. For Drive Mad storage changes, verify the native save and account isolation; a dashboard label alone is not proof that game progression changed.
