# Anime Launch

Play Anime Launch in your browser. The application source, game project, build scripts, and tests are in [`anime-launch/`](anime-launch/).

## Develop locally

```sh
cd anime-launch
npm ci
npm run dev
```

See the [editing guide](anime-launch/README.md) for the file to change for each feature, and the [architecture](anime-launch/docs/architecture.md) for module responsibilities.

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) installs dependencies, checks formatting, runs tests, builds the game, and deploys `anime-launch/dist/` on every push to `main`. All game URLs are relative, so the site supports GitHub Pages repository paths.

In the repository's **Settings → Pages**, the publishing source must be **GitHub Actions**. Once deployment succeeds, the game is available at:

https://jas-bop.github.io/scratexperiment/

Generated files and dependencies are excluded from source control. Edit source files, commit, and push; the workflow rebuilds the website automatically.
