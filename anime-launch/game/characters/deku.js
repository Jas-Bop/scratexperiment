import { defineCharacter } from './schema.js';

/** Deku settings. Attack names identify the original animation branches. */
export const DEKU = defineCharacter({
  id: 'deku',
  name: 'Deku',
  description: '"One for All ..."',
  roster: {
    slot: 8,
    x: 0,
    y: 30,
  },
  attacks: {
    firstHit: {
      power: 40,
    },
    secondHit: {
      power: 50,
    },
    thirdHit: {
      power: 60,
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
    minimumDistance: 4000,
  },
  saveToken: 'eb',
});
