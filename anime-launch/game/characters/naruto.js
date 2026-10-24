import { defineCharacter } from './schema.js';

/** Naruto settings. Attack names identify the original animation branches. */
export const NARUTO = defineCharacter({
  id: 'naruto',
  name: 'Naruto',
  description: '"Dattebayo!"',
  roster: {
    slot: 5,
    x: 100,
    y: 80,
  },
  attackIds: ['quickSummon', 'shadowClone'],
  attacks: {
    quickSummon: {
      power: 30,
      vertical: 30,
      cooldownSeconds: 3,
    },
    shadowClone: {
      power: 30,
      vertical: 30,
      cooldownSeconds: 4,
    },
    kurama: {
      power: 450,
      vertical: 65,
      cooldownSeconds: 10,
    },
  },
  ammunition: {
    progressionOffset: -4,
    progressionMultiplier: 2,
    capThreshold: 5,
    maximum: 6,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distanceRuns',
    minimumDistance: 2500,
    runs: 3,
  },
  saveToken: 'wn',
  upgradedForm: {
    id: 'naruto2',
    name: 'Kurama Link',
    description: '"KURAMA!"',
    attackIds: ['quickSummon', 'shadowClone', 'kurama'],
    ammunition: {
      maximum: 3,
    },
    unlock: {
      kind: 'onlyCharacters',
      minimumDistance: 800,
      onlyCharacters: ['naruto'],
    },
    saveToken: 'v',
  },
});
