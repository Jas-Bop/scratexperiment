import { defineCharacter } from './schema.js';

/** Tanjiro settings. Attack names identify the original animation branches. */
export const TANJIRO = defineCharacter({
  id: 'tanjiro',
  name: 'Tanjiro',
  description: '"MUZAN!"',
  roster: {
    slot: 6,
    x: -100,
    y: 30,
  },
  attackIds: ['waterBreathing', 'sunBreathing'],
  attacks: {
    waterBreathing: {
      power: 50,
      vertical: 40,
      cooldownSeconds: 9,
    },
    sunBreathing: {
      power: 55,
      vertical: 30,
      cooldownSeconds: 9,
    },
    tripleOpening: {
      power: 50,
      vertical: 50,
      cooldownSeconds: 9,
    },
    tripleRush: {
      power: 180,
    },
    tripleSlash: {
      power: 100,
      vertical: 40,
    },
    tripleFinish: {
      power: 200,
      verticalBoost: 10,
    },
  },
  ammunition: {
    perRun: 3,
    costPerUse: 1,
  },
  unlock: {
    kind: 'onlyCharacters',
    minimumDistance: 500,
    onlyCharacters: ['ichigo'],
  },
  saveToken: 'sk',
  upgradedForm: {
    id: 'tanjiro2',
    name: 'InoZenTan',
    description: 'Triple Breathing Styles',
    attackIds: ['tripleOpening', 'tripleRush', 'tripleSlash', 'tripleFinish'],
    ammunition: {
      perRun: 1,
    },
    unlock: {
      kind: 'onlyCharacterRuns',
      minimumDistance: 500,
      onlyCharacters: ['tanjiro'],
      runs: 3,
    },
    saveToken: 'b',
  },
});
