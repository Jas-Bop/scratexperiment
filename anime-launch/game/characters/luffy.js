import { defineCharacter } from './schema.js';

/** Luffy settings. Attack names identify the original animation branches. */
export const LUFFY = defineCharacter({
  id: 'luffy',
  name: 'Luffy',
  description: '"Gumo Gumo no ... "',
  roster: {
    slot: 2,
    x: -50,
    y: 80,
  },
  attackIds: ['normal'],
  attacks: {
    normal: {
      power: 50,
      vertical: 30,
      cooldownSeconds: 8,
    },
    gearFifth: {
      power: 500,
      vertical: 50,
      cooldownSeconds: 8,
    },
  },
  ammunition: {
    progressionOffset: -1,
    capThreshold: 3,
    maximum: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distanceRuns',
    minimumDistance: 200,
    runs: 3,
  },
  saveToken: 'qm',
  upgradedForm: {
    id: 'luffy2',
    name: 'Gear Fifth',
    description: '"Gear 5th"',
    attackIds: ['normal', 'gearFifth'],
    unlock: {
      kind: 'equippedCharacter',
      minimumDistance: 5555,
      equippedCharacter: 'luffy',
    },
    saveToken: 'z',
  },
});
