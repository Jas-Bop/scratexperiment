import { defineCharacter } from './schema.js';

/** Levi settings. Attack names identify the original animation branches. */
export const LEVI = defineCharacter({
  id: 'levi',
  name: 'Levi',
  description: '"KENNY!"',
  roster: {
    slot: 9,
    x: 50,
    y: 30,
  },
  attacks: {
    normal: {
      power: 55,
      vertical: 40,
      cooldownSeconds: 10,
    },
  },
  ammunition: {
    perRun: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distance',
    minimumDistance: 4500,
  },
  saveToken: 'dj',
});
