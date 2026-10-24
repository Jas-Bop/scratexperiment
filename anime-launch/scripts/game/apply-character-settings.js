import { readFileSync } from 'node:fs';
import { CHARACTERS, resolveAttackStat } from '../../game/characters/index.js';
import { targetNamed } from './scratch-blocks.js';

// Compatibility map for the supplied SB3. Rows: sprite, block ID, input, setting path, conversion.
// Opaque engine addresses belong here, never in editable character definitions.
const bindings = JSON.parse(
  readFileSync(new URL('./legacy-character-bindings.json', import.meta.url)),
);

export function applyCharacterSettings(project, characters = CHARACTERS) {
  validateCatalog(characters);
  for (const character of characters) {
    // Nami needs additional engine wiring, handled by apply-nami.js after the original cast.
    if (character.id === 'nami') {
      validateEngineContract(character, { unlockKind: 'characterUsed', characterListSizes: [] });
      if (
        !Number.isInteger(character.unlock.distanceExclusive) ||
        !character.unlock.characterUsed ||
        !Number.isFinite(character.ammunition.perRun)
      ) {
        throw new Error('nami: define distanceExclusive, characterUsed, and ammunition.perRun');
      }
      continue;
    }
    if (!bindings[character.id]) throw new Error(`Missing engine bindings for ${character.id}`);
    validateEngineContract(character, bindings[character.id].contract);
    for (const [sprite, id, input, setting, conversion] of bindings[character.id].inputs) {
      let value = readSetting(character, setting);
      const [section, attack, stat] = setting.split('.');
      if (section === 'attacks') value = resolveAttackStat(character.id, attack, stat, characters);
      if (value === undefined) throw new Error(`${character.id}: missing setting ${setting}`);
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new Error(`${character.id}: ${setting} must be finite`);
      }
      if (conversion === 'minusOne') value -= 1;
      if (conversion === 'negate') value *= -1;
      if (conversion === 'withBaseSaveToken') value = character.saveToken + value;
      const block = targetNamed(project, sprite).blocks[id];
      const importedInput = block?.inputs[input];
      if (
        importedInput?.[0] !== 1 ||
        !Array.isArray(importedInput[1]) ||
        importedInput[1][0] < 4 ||
        importedInput[1][0] > 10
      ) {
        throw new Error(`${character.id}: the imported project changed at ${sprite}/${setting}`);
      }
      block.inputs[input] = [1, [10, String(value)]];
    }
  }
}

export function readSetting(character, path) {
  return path.split('.').reduce((value, key) => value?.[key], character);
}

function validateCatalog(characters) {
  const slots = new Set();
  const ids = new Set();
  for (const character of characters) {
    for (const id of [character.id, character.upgradedForm?.id].filter(Boolean)) {
      if (ids.has(id)) throw new Error(`Duplicate character/form ID: ${id}`);
      ids.add(id);
    }
    if (
      !Number.isInteger(character.roster.slot) ||
      character.roster.slot < 1 ||
      !Number.isFinite(character.roster.x) ||
      !Number.isFinite(character.roster.y)
    ) {
      throw new Error(`${character.id}: roster needs a positive integer slot and numeric x/y`);
    }
    if (slots.has(character.roster.slot))
      throw new Error(`Duplicate roster slot: ${character.roster.slot}`);
    slots.add(character.roster.slot);
    for (const [attack, stats] of Object.entries(character.attacks)) {
      for (const stat of Object.keys(stats)) {
        if (!['power', 'vertical', 'verticalBoost', 'cooldownSeconds'].includes(stat)) {
          throw new Error(`${character.id}: unknown attack setting ${stat}`);
        }
        resolveAttackStat(character.id, attack, stat, characters);
      }
    }
    for (const [section, settings] of Object.entries({
      launch: character.launch,
      timing: character.timing,
    })) {
      for (const [field, value] of Object.entries(settings ?? {})) {
        if (!Number.isFinite(value) || value < 0)
          throw new Error(`${character.id}: invalid ${section}.${field}`);
      }
    }
    for (const form of [character, character.upgradedForm].filter(Boolean)) {
      if (typeof form.name !== 'string' || typeof form.description !== 'string') {
        throw new Error(`${character.id}: form name and description must be strings`);
      }
      if (form.saveToken !== undefined && (typeof form.saveToken !== 'string' || !form.saveToken)) {
        throw new Error(`${character.id}: saveToken must be a non-empty string`);
      }
      for (const attack of form.attackIds ?? []) {
        if (!character.attacks[attack])
          throw new Error(`${character.id}: unknown form attack ${attack}`);
      }
      for (const [setting, value] of Object.entries(form.ammunition ?? {})) {
        if (!Number.isFinite(value) || (setting !== 'progressionOffset' && value < 0)) {
          throw new Error(`${character.id}: invalid ammunition setting ${setting}`);
        }
      }
      for (const field of ['minimumDistance', 'distanceExclusive', 'runs']) {
        const value = form.unlock[field];
        if (
          value !== undefined &&
          (!Number.isInteger(value) || value < 0 || (field === 'runs' && value === 0))
        ) {
          throw new Error(`${character.id}: invalid unlock ${field}`);
        }
      }
      const requirements = [
        ...(form.unlock.onlyCharacters ?? []),
        form.unlock.characterUsed,
        form.unlock.equippedCharacter,
      ].filter(Boolean);
      for (const id of requirements) {
        if (!characters.some((item) => item.id === id))
          throw new Error(`${character.id}: unknown unlock character ${id}`);
      }
    }
  }
  const orderedSlots = [...slots].sort((left, right) => left - right);
  if (orderedSlots.some((slot, index) => slot !== index + 1)) {
    throw new Error('Roster slots must be contiguous; exchange slots when reordering characters');
  }
}

function validateEngineContract(character, contract) {
  if (
    character.unlock.kind !== contract.unlockKind ||
    character.upgradedForm?.id !== contract.upgradedFormId ||
    character.upgradedForm?.unlock.kind !== contract.upgradedUnlockKind
  ) {
    throw new Error(
      `${character.id}: changing imported form IDs or unlock rule kinds requires an engine adapter change`,
    );
  }
  const sizes = [character.unlock, character.upgradedForm?.unlock]
    .filter((rule) => rule?.onlyCharacters)
    .map((rule) => rule.onlyCharacters.length);
  if (JSON.stringify(sizes) !== JSON.stringify(contract.characterListSizes)) {
    throw new Error(
      `${character.id}: changing the number of allowed characters requires an engine adapter change`,
    );
  }
}
