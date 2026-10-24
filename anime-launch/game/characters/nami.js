/** Nami's balance and progression settings. Applied to the Scratch project at build time. */
export const NAMI = Object.freeze({
  id: 'nami',
  description: 'Money is life',
  referenceCharacter: 'saitama',
  powerMultiplier: 2,
  rosterPosition: 14,
  rosterX: 100,
  rosterY: -20,
  ammo: 10,
  cooldownSeconds: 7,
  unlock: {
    distanceExclusive: 600,
    characterUsed: 'luffy',
    task: 'Get past 600 using Luffy',
  },
  // Delimiters prevent older save-code fragments from accidentally matching Nami.
  saveToken: '~nami~',
});
