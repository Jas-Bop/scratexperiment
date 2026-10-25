# Game Hub

**Editing the code? Start with [START_HERE.md](START_HERE.md): commands, folder map, and exactly where to change each feature.**

One dashboard for **Anime Launch**, **Polytrack**, and **Drive Mad**, with a shared game-switching bar at the top of every game page. Each game keeps its own source folder and build.

## Play locally

Run these commands from this repository's root folder:

```sh
npm run setup  # First-time setup: install game build dependencies
npm run dev
```

Open **http://127.0.0.1:4173/**. Select a game from the dashboard or the top navigation.

| Page           | Local URL                           |
| -------------- | ----------------------------------- |
| Game dashboard | http://127.0.0.1:4173/              |
| Anime Launch   | http://127.0.0.1:4173/anime-launch/ |
| Polytrack      | http://127.0.0.1:4173/polytrack/    |
| Drive Mad      | http://127.0.0.1:4173/drive-mad/    |
| Account        | http://127.0.0.1:4173/account/      |

If dependencies are already installed, skip `npm run setup`. `npm run preview` serves the existing combined build; `npm run build` rebuilds the dashboard and all games. Polytrack and Drive Mad load their game assets over the internet. The shared build uses the tooling installed by `npm run setup`.

## Accounts

Choose **Account** in the top bar on any page, or open `/account/`. Sign-in applies across the Game Hub in the same browser tab. Existing Anime Launch accounts and character saves are preserved. Accounts remain browser-local and do not sync between devices.

**Shadesters** is the reserved Master Admin profile. Sign in with the configured password; do not create a new account with that name. The source ships a salted PBKDF2 password hash, with no plaintext password. Successful sign-in automatically unlocks every Anime Launch character and upgraded form and gives this profile a native Drive Mad save with all **200 levels completed**. Guest and normal players keep their own saves.

- `shared/accounts/account-store.js`: one account store shared by all pages and game adapters; legacy storage keys retain existing accounts.
- `shared/accounts/master-account.js`: master username and salted verifier. This grants local game entitlements, not server administration privileges.
- `shared/accounts/panel.html`: shared sign-in/sign-up form.
- `site/account.html` and `site/account-page.js`: the site-wide Account page.
- `drive-mad/src/profile-storage.js`: account-specific Drive Mad storage and one-time master completion seed.

## Edit the site

- `site/games.js`: the game registry, dashboard text, previews, and build folders. The navigation and library cards use this same list.
- `site/index.html`: dashboard layout.
- `site/play.html`: game page layout. The shared bar sits above the game, without covering its controls.
- `site/styles.css`: dashboard and shared navigation styles.
- `scripts/build-site.js`: build each game and assemble one static website in `dist/`.
- `scripts/serve-site.js`: serve the combined site locally.
- [Anime Launch editing guide](anime-launch/README.md).
- [Polytrack launcher guide](polytrack/README.md) — uses the supplied HTML and requires its external CDN.
- [Drive Mad launcher guide](drive-mad/README.md) — uses the supplied HTML and requires its external CDN.

The combined output contains dashboard `/`, player pages `/anime-launch/`, `/polytrack/`, and `/drive-mad/`, and the games' independent builds under `/games/`. The player frames give each game its own viewport and keyboard focus. Relative URLs support a GitHub Pages project path such as `/scratexperiment/`.

## Verify

```sh
npm test
npm run format:check
npm run build
```

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) installs all games' dependencies, checks formatting, runs tests, and publishes the combined root `dist/` directory. When these changes are explicitly committed and pushed to `main`, the root URL becomes the game dashboard:

https://jas-bop.github.io/scratexperiment/

The publishing source in **Settings → Pages** should remain **GitHub Actions**. Local development and build commands do not commit, push, or deploy. Until the changes are pushed and deployment completes, the existing online site continues to show its previous version.
