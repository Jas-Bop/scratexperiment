import { defineCharacter } from './schema.js';

/** Ichigo settings. Attack names identify the original animation branches. */
export const ICHIGO = defineCharacter({
  id: 'ichigo',
  name: 'Ichigo',
  description: '"BAN-KAI!" ...',
  roster: {
    slot: 3,
    x: 0,
    y: 80,
  },
  attackIds: ['normal'],
  attacks: {
    normal: {
      power: 50,
      vertical: 40,
      cooldownSeconds: 9,
    },
    vastoLorde: {
      power: 450,
      vertical: 65,
      cooldownSeconds: 9,
    },
  },
  ammunition: {
    progressionOffset: -2,
    capThreshold: 3,
    maximum: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'distanceRuns',
    minimumDistance: 500,
    runs: 3,
  },
  saveToken: 'al',
  upgradedForm: {
    id: 'ichigo2',
    name: 'Vasto Lorde',
    description: '"AARRGGHH" ...',
    attackIds: ['normal', 'vastoLorde'],
    unlock: {
      kind: 'equippedCharacter',
      minimumDistance: 6666,
      equippedCharacter: 'ichigo',
    },
    saveToken: 'x',
  },
});
