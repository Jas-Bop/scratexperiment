/** Packaging settings, independent of page layout and player UI. */
export const GAME_CONFIG = Object.freeze({
  projectFile: 'game/project.sb3',
  title: 'Anime Launch',
  packageName: 'anime-launch',
  // Keep this ID stable: it is the namespace for browser-local high scores.
  storageId: 'anime-launch-web-v1',
  // Original save/load codes use the username. Changing it may invalidate old codes.
  username: 'Player',
  frameRate: 30,
  stage: { width: 480, height: 360 },
  appearance: { background: '#101217', accent: '#ccff64' },
});
