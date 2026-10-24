import { defineCharacter } from './schema.js';

/** Goku settings. Attack names identify the original animation branches. */
export const GOKU = defineCharacter({
  id: 'goku',
  name: 'Goku',
  description: '"Kame-hame ... "',
  roster: {
    slot: 4,
    x: 50,
    y: 80,
  },
  attackIds: ['normal'],
  attacks: {
    normal: {
      power: 60,
      vertical: 40,
      cooldownSeconds: 10,
    },
    ultraInstinct: {
      power: 550,
      vertical: 55,
      cooldownSeconds: 9,
    },
  },
  ammunition: {
    progressionOffset: -3,
    capThreshold: 3,
    maximum: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distanceRuns',
    minimumDistance: 1200,
    runs: 3,
  },
  saveToken: 'zp',
  upgradedForm: {
    id: 'goku2',
    name: 'Ultra Instinct',
    description: '"That form ... that glow"',
    attackIds: ['normal', 'ultraInstinct'],
    ammunition: {
      maximum: 2,
    },
    unlock: {
      kind: 'equippedCharacter',
      minimumDistance: 10000,
      equippedCharacter: 'goku',
    },
    saveToken: 'c',
  },
});
