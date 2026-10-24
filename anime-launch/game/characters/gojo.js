import { defineCharacter } from './schema.js';

/** Gojo settings. Attack names identify the original animation branches. */
export const GOJO = defineCharacter({
  id: 'gojo',
  name: 'Gojo',
  description: '"Nah, I\'d win"',
  roster: {
    slot: 12,
    x: 0,
    y: -20,
  },
  attacks: {
    hollowPurple: {
      power: 500,
      vertical: 60,
      cooldownSeconds: 15,
    },
  },
  ammunition: {
    perRun: 1,
    costPerUse: 1,
  },
  unlock: {
    kind: 'onlyCharacters',
    minimumDistance: 700,
    onlyCharacters: ['itadori'],
  },
  saveToken: 'fh',
});
