import { defineCharacter } from './schema.js';

/** Asta settings. Attack names identify the original animation branches. */
export const ASTA = defineCharacter({
  id: 'asta',
  name: 'Asta',
  description: '"Never give up magic"',
  roster: {
    slot: 10,
    x: 100,
    y: 30,
  },
  attacks: {
    normal: {
      power: 50,
      vertical: 40,
      cooldownSeconds: 7,
    },
  },
  ammunition: {
    perRun: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'onlyCharacters',
    minimumDistance: 500,
    onlyCharacters: ['ichigo'],
  },
  saveToken: 'ci',
});
