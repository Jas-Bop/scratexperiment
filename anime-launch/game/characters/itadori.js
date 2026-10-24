import { defineCharacter } from './schema.js';

/** Itadori settings. Attack names identify the original animation branches. */
export const ITADORI = defineCharacter({
  id: 'itadori',
  name: 'Itadori',
  description: '"Give my body back ..."',
  roster: {
    slot: 7,
    x: -50,
    y: 30,
  },
  attackIds: ['normal', 'blackFlash'],
  attacks: {
    blackFlash: {
      power: 60,
      vertical: 40,
    },
    normal: {
      power: 40,
      vertical: 40,
      cooldownSeconds: 7,
    },
    sukuna: {
      power: 500,
      vertical: 60,
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
    onlyCharacters: ['grey'],
  },
  saveToken: 'xo',
  timing: {
    blackFlashWindowSeconds: 0.2,
  },
  upgradedForm: {
    id: 'itadori2',
    name: 'Sukuna',
    description: '"Fuga"',
    attackIds: ['sukuna'],
    ammunition: {
      perRun: 1,
    },
    unlock: {
      kind: 'onlyCharacters',
      minimumDistance: 3000,
      onlyCharacters: ['itadori', 'gojo'],
    },
    saveToken: 'n',
  },
});
