/**
 * Character files contain game design values, never Scratch block IDs.
 * See README.md in this folder for fields, examples, and the engine boundary.
 */
export function defineCharacter(character) {
  if (!character.id || !character.name || typeof character.description !== 'string') {
    throw new Error('Every character needs an id, name, and description');
  }
  if (!character.roster || !Number.isInteger(character.roster.slot)) {
    throw new Error(`${character.id}: roster.slot must be an integer`);
  }
  if (!Object.keys(character.attacks ?? {}).length) {
    throw new Error(`${character.id}: define at least one named attack`);
  }
  if (!character.unlock?.kind) throw new Error(`${character.id}: define an unlock rule`);
  return deepFreeze(character);
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
