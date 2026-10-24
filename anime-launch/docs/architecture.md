# Architecture

The website and game have separate ownership. The website owns loading and controls. The Scratch project owns gameplay. TurboWarp executes the project; its generated runtime is isolated inside a same-origin iframe.

```text
src/index.html + styles/             Page markup and presentation
              |
src/app/main.js                     Connect DOM events to the player
       |              |
player-view.js   touch-controls.js   Render state and send game inputs
              |
src/player/game-player.js           Iframe lifecycle; idle/loading/ready/error
              |
src/shared/protocol.js              Validated message contract
              |
src/runtime/scratch-adapter.js       Translate commands into TurboWarp VM calls
              |
game/project.sb3                    Original gameplay, costumes, sounds
```

## Source and generated output

`src/`, `config/`, `public/`, `game/`, and `scripts/` are authored inputs. `scripts/game/apply-nami.js` applies Nami’s readable character settings to a copy of the original project, fixing her roster, attack, unlock, tooltips, reward, and save/load support. The supplied SB3 remains untouched. `scripts/build.js` copies browser modules and public assets, bundles the runtime adapter, packages the original game, and writes `dist/`. Only the adapter requires bundling because TurboWarp inserts it as a classic script. The browser application stays as native ES modules.

Keeping generated files out of source control avoids reviews dominated by machine-generated runtime changes. Builds read the original project without modifying it; packaging does not translate the Scratch blocks into maintainable native game-engine source.

## Player lifecycle

`GamePlayer` exposes `load`, `restart`, `toggleMute`, `setKey`, `focus`, and `destroy`. It emits `statechange` and `volumechange`. Its iframe and state are private; UI code reads state through getters.

- **idle:** no game exists; Play is available.
- **loading:** one iframe exists; duplicate loads and game inputs are ignored.
- **ready:** reached only after the runtime reports that the project loaded; controls are enabled.
- **error:** failed or timed-out iframe is removed; Play becomes Try again.

A document `load` event does not prove the game is ready. The player waits for a runtime message and checks both its origin and exact source window. Replies from failed or replaced frames are ignored. Timeout cleanup makes retry possible without reloading the page.

## Message contract

`src/shared/protocol.js` defines message types, commands, and validation. Change it when introducing new player actions. Both sides import it, so accepted commands cannot drift silently.

| Direction         | Message                                               | Purpose                    |
| ----------------- | ----------------------------------------------------- | -------------------------- |
| Website → runtime | `anime-control`, `restart`                            | Restart the original game  |
| Website → runtime | `anime-control`, `mute`, boolean `muted`              | Set volume explicitly      |
| Website → runtime | `anime-control`, `key`, allowed `key`, boolean `down` | Press/release a game input |
| Website → runtime | `anime-control`, `focus`                              | Return keyboard focus      |
| Runtime → website | `anime-ready`                                         | Project finished loading   |
| Runtime → website | `anime-error`                                         | Runtime failed             |

Each receiver checks origin and sender identity before accepting messages. The runtime releases keys on blur; touch controls also release keys on pointer cancellation and loss of capture. Restart reapplies mute so VM volume resets cannot silently unmute the player.

## Editing guidance

Add a control in `src/shared/controls.js` to generate its on-screen button and allow that key through the runtime adapter. The Scratch game must already handle that key, or you must add its behavior to `game/project.sb3`.

Change UI copy in `src/app/config.js`, page content in `src/index.html`, and visual tokens in `src/styles/theme.css`. Change the stage size, frame rate, or packaging identity in `config/game.js`. Keep VM-specific implementation details inside `scratch-adapter.js`.

To implement a native JavaScript game engine later, replace `game/project.sb3` and the TurboWarp adapter with authored gameplay systems. Refactoring the player does not perform that separate migration.
