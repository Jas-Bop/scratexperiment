# Polytrack — Local Edition

An original low-poly time-trial racing game, built as a separate project from `anime-launch/`. Inspired by the gameplay of Kodub's PolyTrack; this project does not contain Kodub's source code, tracks, models, audio, or original track-code format.

## Run

Use Node.js 22.17 or later:

```sh
cd polytrack
npm ci
npm run dev
```

Open **http://127.0.0.1:4174/**. The game needs a browser with WebGL and hardware acceleration.

```sh
npm test              # Physics, checkpoint, replay, storage, and import checks
npm run format:check  # Check source formatting
npm run build         # Produce a standalone static website in dist/
npm run preview       # Preview the production build
```

## Included

- Three original circuits: Alpine Sprint, Canyon Run, and Skyline Circuit.
- Procedural 3D environments, an open-wheel racing car, chase/cockpit cameras, boost pads, jumps, barriers, and off-track falls.
- Acceleration, braking/reverse, steering, handbrake, restart, pause, and checkpoint respawn.
- Ordered checkpoints, timed finishes, medal targets, local best times, and an interpolated ghost of your best run.
- Car colors, graphics and sound settings, synthesised engine audio, and touch controls.
- A spline track editor: drag/add/delete points, change elevation, road width, environment and barriers, undo, test drive, save locally, and import/export your own JSON circuits.

This is a self-contained reconstruction of the racing concept, not a one-to-one copy of the original game's physics or features. The editor builds spline circuits rather than reproducing Kodub's block editor. Multiplayer, online leaderboards, original track imports, and vertical loops are not implemented.

## Controls

| Input             | Action                                                     |
| ----------------- | ---------------------------------------------------------- |
| WASD / arrow keys | Accelerate, brake/reverse, steer                           |
| Space             | Handbrake                                                  |
| R                 | Restart the full run                                       |
| Backspace         | Respawn at the most recent checkpoint; the clock continues |
| Escape            | Pause/resume                                               |
| C                 | Chase/cockpit camera                                       |
| M                 | Toggle sound                                               |
| Enter             | Start the selected circuit from the menu                   |

## Edit the game

| Change                                                   | File                                              |
| -------------------------------------------------------- | ------------------------------------------------- |
| Acceleration, braking, grip response, top speed, gravity | `src/game/config.js`                              |
| Car dynamics and road-relative movement                  | `src/game/car.js`                                 |
| Timing, checkpoints, finish, respawn                     | `src/game/race.js`                                |
| Keyboard and touch bindings                              | `src/game/input.js`                               |
| Course points, width, boosts, jumps and medal times      | `src/tracks/alpine.js`, `canyon.js`, `skyline.js` |
| Track schema and shared geometry sampling                | `src/tracks/track.js`                             |
| Car geometry and livery                                  | `src/render/car-model.js`                         |
| Road, scenery, gates and environment colors              | `src/render/level.js`                             |
| Camera, lighting, ghosts and quality settings            | `src/render/world.js`                             |
| Menus and HUD markup                                     | `index.html`                                      |
| Menu, HUD and responsive appearance                      | `src/ui/styles.css`                               |
| UI wiring and game loop                                  | `src/main.js`                                     |
| Track editor                                             | `src/editor/editor.js`                            |
| Best runs, tracks and settings persistence               | `src/storage/save.js`                             |
| Ghost interpolation                                      | `src/game/ghost.js`                               |
| Engine and checkpoint sounds                             | `src/audio/engine.js`                             |

## How the simulation works

Each road is a closed Catmull–Rom centreline with elevation. Physics advances at a fixed 120 Hz, independently of rendering. Cars have forward speed, lateral position, steering response, heading relative to the road, and a vertical jump/fall state. Steering must counter the road's curvature; the car does not automatically follow corners. This arcade model keeps suspension/collision logic manageable and editable, rather than claiming to be a general-purpose rigid-body vehicle simulator.

The renderer reads the race state and builds its own low-poly meshes. The same sampled road drives rendering, car positioning, checkpoint distances, minimaps, and ghost playback. A faster finished run replaces the stored ghost. Ghost samples are interpolated during the next race.

Everything persists locally under `polytrack-local-v1`. There is no backend or account system. Editing a saved circuit invalidates its old record, because its geometry may have changed. Editor test drives do not overwrite records. Exported JSON files use the `polytrack-local` format; imported files are validated before creating geometry.

## Static hosting

Deploy the contents of `dist/` to a static host. The build uses relative asset URLs and works under a GitHub Pages project subpath. The repository root Game Hub build includes this game at `/polytrack/` and publishes both games together. Run `npm run dev` from the repository root to use the shared dashboard and navigation. No files are committed, pushed, or deployed automatically by local development commands.
