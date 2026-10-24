import { defineCharacter } from './schema.js';

/** Final roster character; her staff scales from Saitama's serious punch. */
export const NAMI = defineCharacter({
  id: 'nami',
  name: 'Nami',
  description: 'Money is life',
  roster: { slot: 14, x: 100, y: -20 },
  attacks: {
    staff: {
      power: { character: 'saitama', attack: 'seriousPunch', multiplier: 2 },
      vertical: { character: 'saitama', attack: 'seriousPunch', multiplier: 2 },
      cooldownSeconds: 7,
    },
  },
  ammunition: { perRun: 10, costPerUse: 1 },
  unlock: { kind: 'characterUsed', distanceExclusive: 600, characterUsed: 'luffy' },
  // Delimiters keep existing legacy save codes from matching Nami accidentally.
  saveToken: '~nami~',
});
