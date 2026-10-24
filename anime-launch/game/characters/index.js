import { GREY } from './grey.js';
import { LUFFY } from './luffy.js';
import { ICHIGO } from './ichigo.js';
import { GOKU } from './goku.js';
import { NARUTO } from './naruto.js';
import { TANJIRO } from './tanjiro.js';
import { ITADORI } from './itadori.js';
import { DEKU } from './deku.js';
import { LEVI } from './levi.js';
import { ASTA } from './asta.js';
import { SAITAMA } from './saitama.js';
import { GOJO } from './gojo.js';
import { SHADOW } from './shadow.js';
import { NAMI } from './nami.js';

/** The complete roster. Upgraded forms live with the character whose sprite they share. */
export const CHARACTERS = Object.freeze([
  GREY,
  LUFFY,
  ICHIGO,
  GOKU,
  NARUTO,
  TANJIRO,
  ITADORI,
  DEKU,
  LEVI,
  ASTA,
  SAITAMA,
  GOJO,
  SHADOW,
  NAMI,
]);

export function getCharacter(id, characters = CHARACTERS) {
  const character = characters.find((item) => item.id === id);
  if (!character) throw new Error(`Unknown character: ${id}`);
  return character;
}

/** Resolve a numeric stat or a relationship such as Nami = Saitama × 2. */
export function resolveAttackStat(
  characterId,
  attackId,
  stat,
  characters = CHARACTERS,
  visited = new Set(),
) {
  const key = `${characterId}.${attackId}.${stat}`;
  if (visited.has(key)) throw new Error(`Circular attack-stat reference: ${key}`);
  visited.add(key);
  const value = getCharacter(characterId, characters).attacks[attackId]?.[stat];
  const resolved =
    typeof value === 'object' && value !== null
      ? resolveAttackStat(value.character, value.attack, stat, characters, visited) *
        value.multiplier
      : value;
  if (!Number.isFinite(resolved) || resolved < 0) throw new Error(`Invalid attack stat: ${key}`);
  return resolved;
}

export function describeUnlock(rule, characters = CHARACTERS) {
  if (rule.kind === 'starter') return 'Available from the start';
  const distance =
    rule.distanceExclusive !== undefined
      ? `Get past ${rule.distanceExclusive}`
      : `Reach ${rule.minimumDistance}`;
  const name = (id) => getCharacter(id, characters).name;
  const repetitions = rule.runs ? ` — ${rule.runs} times` : '';
  if (rule.characterUsed) return `${distance} using ${name(rule.characterUsed)}${repetitions}`;
  if (rule.equippedCharacter)
    return `${distance} with ${name(rule.equippedCharacter)} equipped${repetitions}`;
  if (rule.onlyCharacters)
    return `${distance} using only ${rule.onlyCharacters.map(name).join(' or ')}${repetitions}`;
  return distance + repetitions;
}
