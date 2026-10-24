/** Keyboard and touch share one state. Clear held inputs whenever focus is lost. */
export class Input {
  constructor(onAction) {
    this.keys = new Set();
    this.touch = new Set();
    window.addEventListener('keydown', (event) => {
      if (event.target.matches('input, textarea, select')) return;
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Backspace'].includes(
          event.code,
        )
      )
        event.preventDefault();
      this.keys.add(event.code);
      if (!event.repeat) onAction(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.clear());
  }
  clear() {
    this.keys.clear();
    this.touch.clear();
  }
  read() {
    const pressed = (...codes) => codes.some((code) => this.keys.has(code) || this.touch.has(code));
    return {
      throttle: Number(pressed('KeyW', 'ArrowUp')) - Number(pressed('KeyS', 'ArrowDown')),
      steer: Number(pressed('KeyD', 'ArrowRight')) - Number(pressed('KeyA', 'ArrowLeft')),
      brake: pressed('Space'),
    };
  }
  bindTouch(container) {
    for (const button of container.querySelectorAll('[data-control]')) {
      const key = button.dataset.control;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.touch.add(key);
      });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
        button.addEventListener(event, () => this.touch.delete(key));
    }
  }
}
