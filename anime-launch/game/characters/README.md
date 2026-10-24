# Character definitions

Every roster character has an editable JavaScript file here. These are the values used by the build, including character tooltips; they are not an unused copy of the Scratch data.

| File         | Character and forms   | Named attacks                             |
| ------------ | --------------------- | ----------------------------------------- |
| `grey.js`    | Grey, the starter     | Normal hit; initial launch                |
| `luffy.js`   | Luffy / Gear Fifth    | Normal, Gear Fifth                        |
| `ichigo.js`  | Ichigo / Vasto Lorde  | Normal, Vasto Lorde                       |
| `goku.js`    | Goku / Ultra Instinct | Normal, Ultra Instinct                    |
| `naruto.js`  | Naruto / Kurama Link  | Quick summon, shadow clone, Kurama        |
| `tanjiro.js` | Tanjiro / InoZenTan   | Water, sun, and four triple-attack phases |
| `itadori.js` | Itadori / Sukuna      | Normal, Black Flash, Sukuna               |
| `deku.js`    | Deku                  | First, second, third hit                  |
| `levi.js`    | Levi                  | Normal                                    |
| `asta.js`    | Asta                  | Normal                                    |
| `saitama.js` | Saitama               | Serious punch                             |
| `gojo.js`    | Gojo                  | Hollow Purple                             |
| `shadow.js`  | Shadow                | Normal, atomic                            |
| `nami.js`    | Nami                  | Staff                                     |

`index.js` collects the complete roster and resolves related stats. `schema.js` declares character definitions. Upgraded forms share their parent's sprite and file; they are described in `upgradedForm`, with explicit `attackIds` for each form. The 14 files cover 20 playable forms.

## Make an edit

Change values inside the character definition, then run `npm run build` from `anime-launch/`. Refresh your local preview. For example, change Luffy's normal attack in `luffy.js`:

```js
normal: {
  power: 75,
  vertical: 30,
  cooldownSeconds: 6,
},
```

That changes the actual hit strength, cooldown, and tooltip. You do not need to edit a Scratch block, generated file, or separate tooltip image.

## Fields

- `id`: stable engine identity. Keep this unchanged.
- `name` and `description`: text shown in the character tooltip.
- `roster`: slot number and Scratch stage coordinates. Slots must be unique; exchange slot values to reorder characters.
- `attacks`: named attack branches or combo phases. `power` adds horizontal force, `vertical` sets vertical force, and `verticalBoost` adds vertical force. `cooldownSeconds` controls the corresponding attack timer.
- `attackIds`: attacks shown for the base form. All named phases still live in `attacks`.
- `ammunition`: `perRun` sets fixed ammo. Early characters use `progressionOffset`, optional `progressionMultiplier`, and `maximum` with the original shared ammo progression. `capThreshold` is the comparison that triggers the cap branch; it can differ from `maximum`, as it does for Naruto. `costPerUse` controls ammo consumed by a summon.
- `unlock`: requirements for the existing task. `minimumDistance` is inclusive; `distanceExclusive` means strictly past that distance. `runs` sets the original progression counter threshold. `onlyCharacters` preserves the original rule that every used character must come from that list; it does not require every listed character to be used. `equippedCharacter` and `characterUsed` mean different things.
- `upgradedForm`: the form's identity, name, description, attack list, unlock rule, save fragment, and any different ammo settings.
- `saveToken`: the existing save-code fragment. Keep it stable for old save codes to continue working.
- `launch` / `timing`: character-specific settings, such as Grey's starting launch or Itadori's Black Flash timing window.

Nami's power and vertical values reference Saitama's `seriousPunch` with a multiplier of two. Editing Saitama updates Nami automatically. Replace a related value with a number to make it independent.

## Engine boundary

The original animations, clone behavior, movement sequences, form-selection logic, and task orchestration remain in `../project.sb3`. This is not a complete native JavaScript engine rewrite.

The build adapter in `../../scripts/game/` connects these definitions to that imported engine. It keeps opaque Scratch addresses out of character files and fails with an error if required inputs disappear. Normal balance, descriptions, existing task thresholds/participants, roster positions, and save fragments are editable here. Adding a brand-new character, changing an unlock rule's kind or participant count, or changing form-selection behavior also needs adapter/engine work. The adapter rejects unsupported rule shapes instead of displaying a task the engine cannot execute.

The current defaults preserve original combat values, task predicates, save fragments, and roster positions. Tooltips are generated from actual attack values, correcting stale numbers in some imported tooltip artwork.
