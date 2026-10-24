/** Browser-player settings. Game packaging settings live in config/game.js. */
export const PLAYER_CONFIG = Object.freeze({
  source: 'game/index.html',
  title: 'Anime Launch game',
  loadTimeoutMs: 45_000,
});

export const PLAYER_COPY = Object.freeze({
  idle: { status: "LET'S FLY", note: 'Click play to get started' },
  loading: { status: 'LOADING…', note: 'Loading the game and its artwork…' },
  ready: {
    status: 'READY TO LAUNCH',
    note: 'Press any key or tap Space to begin',
  },
  error: {
    status: 'COULD NOT LOAD',
    note: 'The game could not load. Check your connection and try again.',
  },
});
