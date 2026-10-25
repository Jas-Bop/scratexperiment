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

Character design values live in `game/characters/`: one file for each of the 14 roster characters, including six upgraded forms in their parent's file. `index.js` defines the roster and resolves related stats, such as Nami having twice Saitama's power.

The build pipeline is explicit:

1. `prepare-game.js` reads the original SB3 archive into memory.
2. `apply-character-settings.js` validates the catalog and applies combat, ammo, task, roster, and save values through `legacy-character-bindings.json`.
3. `apply-nami.js` adds missing engine wiring for the unfinished imported Nami sprite.
4. `apply-accounts.js` adds startup markers and the Admin load-code branch.
5. `character-cards.js` generates every character/form tooltip from those same definitions and adds Nami's reward quote.
6. `scripts/build.js` packages the prepared game, bundles the runtime adapter, and writes the complete site into `dist/`.

The compatibility map contains engine addresses, not editable balance values. No character file contains Scratch block IDs. Default settings retain original combat/task behavior; tests compare the imported inputs against a default build. Unsupported rule shapes fail validation rather than silently changing just the displayed description.

The build reads `game/project.sb3` without modifying it. Animations, movement, form-selection logic, and task orchestration still execute through the imported Scratch engine. The character catalog is not a claim that these systems have been rewritten into native JavaScript.

Keeping generated output outside source control avoids reviews dominated by machine-generated runtime changes. `src/`, `game/characters/`, `config/`, `public/`, and `scripts/` are the editable source. Only the runtime adapter is bundled for classic-script insertion; the website application stays as native ES modules.

## Player lifecycle

`GamePlayer` exposes `load`, `restart`, `toggleMute`, `setKey`, `focus`, `setProfile`, and `destroy`. It emits `statechange`, `volumechange`, and `progresschange`. Its iframe and state are private; UI code reads state through getters.

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

## Local accounts

`src/accounts/` owns the account UI, salted password hashes, session storage, and character saves. `src/shared/progress.js` validates permanent progression; transient position, speed, and animation state are excluded. Account switches remove the old game iframe before loading the next profile, so late messages cannot save another player's progress.

`account-progress.js` uses the runtime's `AFTER_EXECUTE` event and build-added readiness markers to restore unlocks after the original startup resets. It reports changed snapshots only. Restart retains the latest snapshot and restores it after initialization. Guest progress is not written into any account. Usernames in the packaged Scratch game stay stable to preserve original save-code compatibility.

The protocol additionally accepts a `profile` command containing validated progression and an `active` boolean, and returns `anime-progress` snapshots from the current game. Origin and window checks also apply to these messages. This is browser-local game state, not server authentication or authorization.

## Editing guidance

Add a control in `src/shared/controls.js` to generate its on-screen button and allow that key through the runtime adapter. The Scratch game must already handle that key, or you must add its behavior to `game/project.sb3`.

Change UI copy in `src/app/config.js`, page content in `src/index.html`, and visual tokens in `src/styles/theme.css`. Change character values in `game/characters/`. Change stage size, frame rate, or packaging identity in `config/game.js`. Keep VM-specific implementation details inside `scratch-adapter.js`.

To implement a native JavaScript game engine later, replace `game/project.sb3` and the TurboWarp adapter with authored gameplay systems. Refactoring the player does not perform that separate migration.
