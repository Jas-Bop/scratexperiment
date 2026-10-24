/** Game inputs shared by the on-screen controls and the runtime adapter. */
export const GAME_CONTROLS = Object.freeze([
  { key: ' ', label: 'SPACE · LAUNCH', description: 'Launch or hit', primary: true },
  { key: 'f', label: 'F', description: 'Character controls' },
  { key: '1', label: '1', description: 'Skill slot 1' },
  { key: '2', label: '2', description: 'Skill slot 2' },
  { key: '3', label: '3', description: 'Skill slot 3' },
  { key: '4', label: '4', description: 'Skill slot 4' },
  { key: 'r', label: 'R', description: 'End the current run' },
]);

export const GAME_KEYS = Object.freeze(GAME_CONTROLS.map(({ key }) => key));
