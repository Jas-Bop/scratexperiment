import { defineCharacter } from './schema.js';

/** Saitama settings. Attack names identify the original animation branches. */
export const SAITAMA = defineCharacter({
  id: 'saitama',
  name: 'Saitama',
  description: '"I\'m a hero for fun"',
  roster: {
    slot: 11,
    x: -50,
    y: -20,
  },
  attacks: {
    seriousPunch: {
      power: 600,
      vertical: 50,
      cooldownSeconds: 15,
    },
  },
  ammunition: {
    perRun: 1,
    costPerUse: 1,
  },
  unlock: {
    kind: 'onlyCharacters',
    minimumDistance: 650,
    onlyCharacters: ['goku'],
  },
  saveToken: 'rv',
});
