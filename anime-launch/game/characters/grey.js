import { defineCharacter } from './schema.js';

/** Grey settings. Attack names identify the original animation branches. */
export const GREY = defineCharacter({
  id: 'grey',
  name: 'Grey',
  description: 'Just your ordinary guy',
  roster: {
    slot: 1,
    x: -100,
    y: 80,
  },
  attacks: {
    normal: {
      power: 40,
      vertical: 40,
      cooldownSeconds: 7,
    },
  },
  ammunition: {
    progressionOffset: 0,
    capThreshold: 3,
    maximum: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'starter',
  },
  launch: {
    power: 60,
    vertical: 40,
  },
});
