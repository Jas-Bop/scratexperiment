# Polytrack

`index.html` is the supplied `clpolytrackworksnow.html`, preserved exactly. It replaces the previous custom racing game.

## Play

From the repository root, run `npm run dev`, then open **http://127.0.0.1:4173/polytrack/** or choose Polytrack in the dashboard.

An internet connection is required. The supplied launcher loads game scripts, fonts, images, and simulation assets from its external CDN, and redirects game service requests through the proxy configured in the HTML. These services are controlled externally and are not bundled here.

During local verification, the official track list loaded, but the track leaderboard returned “Failed to load leaderboard.” Online rankings depend on the supplied launcher's external service.

## Files

- `index.html`: the supplied HTML launcher and its existing compatibility code.
- `scripts/build.js`: copies the launcher unchanged to `dist/index.html`.
- `package.json`: dependency-free build command used by the shared dashboard build.

The game's internal source and assets are not included in the supplied HTML. The previous custom physics, courses, renderer, editor, tests, and dependencies have been removed. Edit `site/games.js` in the repository root to change its dashboard card.

The shared build creates `/polytrack/` for the dashboard wrapper and `/games/polytrack/` for the game itself. Local commands do not commit, push, or publish.
