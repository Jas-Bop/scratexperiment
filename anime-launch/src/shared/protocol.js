import { GAME_KEYS } from './controls.js';

// This is the only contract between the website and its embedded game runtime.
export const MESSAGE_TYPE = Object.freeze({
  COMMAND: 'anime-control',
  READY: 'anime-ready',
  ERROR: 'anime-error',
});

export const COMMAND = Object.freeze({
  RESTART: 'restart',
  MUTE: 'mute',
  KEY: 'key',
  FOCUS: 'focus',
});

/** Reject unknown commands and invalid payloads before touching the game VM. */
export function isGameCommand(message) {
  if (!message || message.type !== MESSAGE_TYPE.COMMAND) return false;

  switch (message.action) {
    case COMMAND.RESTART:
    case COMMAND.FOCUS:
      return true;
    case COMMAND.MUTE:
      return typeof message.muted === 'boolean';
    case COMMAND.KEY:
      return GAME_KEYS.includes(message.key) && typeof message.down === 'boolean';
    default:
      return false;
  }
}
