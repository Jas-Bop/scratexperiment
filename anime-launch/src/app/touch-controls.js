import { GAME_CONTROLS } from '../shared/controls.js';

/** Create accessible buttons from the same input definitions the runtime accepts. */
export function mountTouchControls(container, player, signal) {
  for (const control of GAME_CONTROLS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = control.label;
    button.dataset.key = control.key;
    button.setAttribute('aria-label', control.description);
    if (control.primary) button.classList.add('launch-key');
    container.appendChild(button);

    const press = () => player.setKey(control.key, true);
    const release = () => player.setKey(control.key, false);
    const options = { signal };

    button.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        press();
      },
      options,
    );
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, release, options);
    }
    button.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        press();
      },
      options,
    );
    button.addEventListener('keyup', release, options);
    button.addEventListener('blur', release, options);
  }
}
