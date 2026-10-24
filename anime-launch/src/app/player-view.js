import { PLAYER_COPY } from './config.js';

/** Update only presentation; the player remains the source of lifecycle state. */
export function renderPlayer(player, elements) {
  const { state, muted } = player;
  const ready = state === 'ready';
  const loading = state === 'loading';
  const copy = PLAYER_COPY[state];

  elements.status.textContent = copy.status;
  elements.note.textContent = copy.note;
  elements.stage.setAttribute('aria-busy', String(loading));
  elements.launchScreen.hidden = ready;
  elements.play.disabled = loading;
  elements.play.textContent = loading
    ? 'Loading game…'
    : state === 'error'
      ? 'Try again ↗'
      : 'Play game ↗';
  elements.restart.disabled = !ready;
  elements.sound.disabled = !ready;
  elements.sound.setAttribute('aria-pressed', String(muted));
  elements.sound.querySelector('span').textContent = muted ? 'Sound off' : 'Sound on';

  for (const button of elements.touchControls.querySelectorAll('button')) {
    button.disabled = !ready;
  }
}
