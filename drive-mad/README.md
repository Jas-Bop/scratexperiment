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
- `scripts/build.js`: copies the supplied page into `dist/` without modifying it.
- `package.json`: dependency-free build command used by the shared Game Hub build.

The compiled game's internal source is not included in the supplied file. This folder provides its HTML launcher, not editable vehicle physics or level definitions.

The repository root build places this player under `/games/drive-mad/` and adds the shared dashboard/navigation page at `/drive-mad/`. Local build commands do not commit, push, or publish changes.
