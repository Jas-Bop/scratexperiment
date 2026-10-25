/** Verified against the game asset in the pinned CDN build supplied with this project. */
export const DRIVE_MAD = Object.freeze({
  gameId: '5F084A0BCE06B710',
  levelCount: 200,
  storageVersion: 1,
  saveFiles: Object.freeze(['sandbox/db', 'sandbox/db.bak', 'sandbox/db.lod']),
  nativePrefix: 'com.martinmagni.drivemad/',
  profilePrefix: 'game-hub.drive-mad/',
});

/** Native completion uses zero-based level keys and -1 for a finished non-score level. */
export function completeAllLevels(baseSave) {
  const save = structuredClone(baseSave);
  const scores = Object.fromEntries(
    Array.from({ length: DRIVE_MAD.levelCount }, (_, index) => [index, -1]),
  );
  // Use the same completion metadata observed after a native level win.
  save.gc[DRIVE_MAD.gameId] = { bt: 1, bd: 1, s: scores };
  return save;
}
