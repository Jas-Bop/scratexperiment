import { isProgress } from '../shared/progress.js';
import { COMMAND, MESSAGE_TYPE, isGameCommand } from '../shared/protocol.js';

/**
 * Owns the iframe lifecycle and the message boundary to the game.
 * UI rendering and button bindings belong to the application layer.
 */
export class GamePlayer extends EventTarget {
  #frame = null;
  #state = 'idle';
  #muted = false;
  #profile = null;
  #timeoutId;
  #mount;
  #config;
  #host;

  constructor(mount, config, host = window) {
    super();
    this.#mount = mount;
    this.#config = config;
    this.#host = host;
    this.#host.addEventListener('message', this.#handleMessage);
  }

  get state() {
    return this.#state;
  }

  get muted() {
    return this.#muted;
  }

  /** A failed attempt may be retried; repeated clicks during loading are ignored. */
  load() {
    if (this.#state === 'loading' || this.#state === 'ready') return;

    this.#removeFrame();
    this.#setState('loading');
    const frame = this.#host.document.createElement('iframe');
    frame.title = this.#config.title;
    frame.allow = 'autoplay; fullscreen';
    frame.src = this.#config.source;
    frame.addEventListener('error', () => {
      if (frame === this.#frame) this.#fail();
    });

    this.#frame = frame;
    this.#timeoutId = this.#host.setTimeout(() => this.#fail(), this.#config.loadTimeoutMs);
    this.#mount.appendChild(frame);
  }

  setProfile(progress = null) {
    if (progress !== null && !isProgress(progress)) throw new Error('Invalid account progress');
    this.#removeFrame();
    this.#profile = progress === null ? null : { ...progress };
    this.#setState('idle');
  }

  get progress() {
    return this.#profile === null ? null : { ...this.#profile };
  }

  restart() {
    if (this.#state !== 'ready') return;
    this.#send(COMMAND.RESTART);
    this.#send(COMMAND.MUTE, { muted: this.#muted });
    this.focus();
  }

  toggleMute() {
    if (this.#state !== 'ready') return;
    this.#muted = !this.#muted;
    this.#send(COMMAND.MUTE, { muted: this.#muted });
    this.dispatchEvent(new Event('volumechange'));
    this.focus();
  }

  setKey(key, down) {
    this.#send(COMMAND.KEY, { key, down });
  }

  focus() {
    this.#send(COMMAND.FOCUS);
    this.#frame?.focus();
  }

  destroy() {
    this.#host.removeEventListener('message', this.#handleMessage);
    this.#removeFrame();
    this.#setState('idle');
  }

  #send(action, payload = {}) {
    const message = { type: MESSAGE_TYPE.COMMAND, action, ...payload };
    if (this.#state !== 'ready' || !isGameCommand(message)) return;
    this.#frame?.contentWindow?.postMessage(message, this.#host.location.origin);
  }

  #handleMessage = (event) => {
    if (event.origin !== this.#host.location.origin) return;
    if (!this.#frame || event.source !== this.#frame.contentWindow) return;

    if (
      event.data?.type === MESSAGE_TYPE.PROGRESS &&
      this.#state === 'ready' &&
      this.#profile !== null
    ) {
      if (!isProgress(event.data.progress)) return;
      this.#profile = { ...event.data.progress };
      this.dispatchEvent(new Event('progresschange'));
      return;
    }

    if (event.data?.type === MESSAGE_TYPE.ERROR) {
      this.#fail();
      return;
    }

    if (event.data?.type !== MESSAGE_TYPE.READY || this.#state !== 'loading') return;
    this.#host.clearTimeout(this.#timeoutId);
    this.#setState('ready');
    this.#send(COMMAND.PROFILE, { active: this.#profile !== null, progress: this.#profile ?? {} });
    this.#send(COMMAND.MUTE, { muted: this.#muted });
    this.focus();
  };

  #fail() {
    this.#removeFrame();
    this.#setState('error');
  }

  #removeFrame() {
    this.#host.clearTimeout(this.#timeoutId);
    this.#frame?.remove();
    this.#frame = null;
  }

  #setState(state) {
    this.#state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}
