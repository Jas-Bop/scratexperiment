# Drive Mad

`index.html` is the supplied `cldrivemad.html`, preserved as provided. It loads the Drive Mad game and artwork through the pinned CDN address declared in its `<base>` tag. This is the supplied game page, not a recreation of its gameplay.

## Play

From the repository root:

```sh
npm run dev
```

Open **http://127.0.0.1:4173/drive-mad/**, or select **Drive Mad** in the dashboard's top navigation. An internet connection is required: the supplied HTML references its JavaScript, WebAssembly runtime, audio, and artwork on an external CDN. Those assets are not contained in the HTML file or bundled into this repository.

## Files

- `index.html`: the supplied game launcher. Its pinned `<base>` address resolves the game's asset paths.
- `scripts/build.js`: preserves the supplied source and adds a bundled profile adapter to the built page, between the native storage definitions and game startup.
- `package.json`: build command used by Game Hub; the shared esbuild tool is installed by the root setup command.
- `src/profile-storage.js`: selects a storage namespace for the active account.
- `game/progression.js`: pinned game identifier, 200-level count, and native completion schema.
- `game/base-save.json`: the default native database from the supplied pinned game asset.

The compiled game's internal source is not included in the supplied file. This folder provides its HTML launcher, not editable vehicle physics or level definitions.

The repository root build places this player under `/games/drive-mad/` and adds the shared dashboard/navigation page at `/drive-mad/`. Local build commands do not commit, push, or publish changes.

## Account progress

Use **Account** in the shared top bar to sign in. Drive Mad reads the same browser-local session as Anime Launch before the game starts. Each account has a separate `game-hub.drive-mad/<account-id>/` storage namespace. Old native saves are copied into Guest storage on first launch; account saves do not inherit them.

On first launch as **Shadesters**, the build-provided native save marks every one of the pinned game's 200 levels completed. Completion is stored under `gc[gameId].s` with zero-based level keys and native value `-1`, as observed after finishing a level. Existing later achievements and settings are preserved on subsequent launches. Sign out through Account before switching players; navigation reloads the game with the next profile's own save.

The master seed is game progression, not a fake completion label on the dashboard. Runtime code, art, and physics continue to come from the supplied CDN game.
