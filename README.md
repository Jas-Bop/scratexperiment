# Game Hub

One dashboard for **Anime Launch** and **Polytrack**, with a shared game-switching bar at the top of every game page. Each game keeps its own source folder and build.

## Play locally

Run these commands from this repository's root folder, rather than inside either game:

```sh
npm run setup  # First-time setup: install both games' dependencies
npm run dev
```

Open **http://127.0.0.1:4173/**. Select either game from the dashboard or the top navigation.

| Page           | Local URL                           |
| -------------- | ----------------------------------- |
| Game dashboard | http://127.0.0.1:4173/              |
| Anime Launch   | http://127.0.0.1:4173/anime-launch/ |
| Polytrack      | http://127.0.0.1:4173/polytrack/    |

If dependencies are already installed, skip `npm run setup`. `npm run preview` serves the existing combined build; `npm run build` rebuilds the dashboard and both games. Game development commands inside each game folder still launch that game alone.

## Edit the site

- `site/games.js`: the game registry, dashboard text, previews, and build folders. The navigation and library cards use this same list.
- `site/index.html`: dashboard layout.
- `site/play.html`: game page layout. The shared bar sits above the game, without covering its controls.
- `site/styles.css`: dashboard and shared navigation styles.
- `scripts/build-site.js`: build each game and assemble one static website in `dist/`.
- `scripts/serve-site.js`: serve the combined site locally.
- [Anime Launch editing guide](anime-launch/README.md).
- [Polytrack editing guide](polytrack/README.md).

The combined output contains dashboard `/`, player pages `/anime-launch/` and `/polytrack/`, and the games' independent builds under `/games/`. The player frames give each game its own viewport and keyboard focus. Relative URLs support a GitHub Pages project path such as `/scratexperiment/`.

## Verify

```sh
npm test
npm run format:check
npm run build
```

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) installs both games' dependencies, checks formatting, runs tests, and publishes the combined root `dist/` directory. When these changes are explicitly committed and pushed to `main`, the root URL becomes the game dashboard:

https://jas-bop.github.io/scratexperiment/

The publishing source in **Settings → Pages** should remain **GitHub Actions**. Local development and build commands do not commit, push, or deploy. Until the changes are pushed and deployment completes, the existing online site continues to show its previous version.
