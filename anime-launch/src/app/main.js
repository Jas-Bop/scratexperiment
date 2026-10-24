import { PLAYER_CONFIG } from './config.js';
import { GamePlayer } from '../player/game-player.js';
import { renderPlayer } from './player-view.js';
import { mountTouchControls } from './touch-controls.js';

const elements = {
  stage: document.getElementById('stage'),
  arcade: document.querySelector('.arcade'),
  launchScreen: document.getElementById('launch-screen'),
  status: document.getElementById('status'),
  note: document.getElementById('stage-note'),
  play: document.getElementById('play'),
  restart: document.getElementById('restart'),
  sound: document.getElementById('sound'),
  fullscreen: document.getElementById('fullscreen'),
  touchControls: document.getElementById('touch-controls'),
};

const player = new GamePlayer(elements.stage, PLAYER_CONFIG);
const listeners = new AbortController();
const options = { signal: listeners.signal };
const render = () => renderPlayer(player, elements);

mountTouchControls(elements.touchControls, player, listeners.signal);
player.addEventListener('statechange', render, options);
player.addEventListener('volumechange', render, options);
elements.play.addEventListener('click', () => player.load(), options);
elements.restart.addEventListener('click', () => player.restart(), options);
elements.sound.addEventListener('click', () => player.toggleMute(), options);
elements.fullscreen.addEventListener('click', toggleFullscreen, options);
document.addEventListener(
  'fullscreenchange',
  () => {
    const active = Boolean(document.fullscreenElement);
    elements.fullscreen.setAttribute('aria-pressed', String(active));
    elements.fullscreen.querySelector('span').textContent = active
      ? 'Exit fullscreen'
      : 'Fullscreen';
  },
  options,
);

// Unload listeners and game resources together; browser back/forward cache stays usable.
window.addEventListener(
  'pagehide',
  (event) => {
    if (event.persisted) return;
    listeners.abort();
    player.destroy();
  },
  options,
);

render();

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await elements.arcade.requestFullscreen();
    }
    player.focus();
  } catch {
    elements.note.textContent = 'Fullscreen is unavailable in this browser';
  }
}
