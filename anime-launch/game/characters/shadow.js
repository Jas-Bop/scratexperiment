import { defineCharacter } from './schema.js';

/** Shadow settings. Attack names identify the original animation branches. */
export const SHADOW = defineCharacter({
  id: 'shadow',
  name: 'Shadow',
  description: '"I . AM . ATOMIC"',
  roster: {
    slot: 13,
    x: 50,
    y: -20,
  },
  attacks: {
    normal: {
      power: 40,
      vertical: 40,
      cooldownSeconds: 15,
    },
    atomic: {
      power: 450,
      vertical: 70,
      cooldownSeconds: 30,
    },
  },
  ammunition: {
    perRun: 2,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distance',
    minimumDistance: 8000,
  },
  saveToken: 'vu',
});
