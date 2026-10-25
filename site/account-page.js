import { mountAccountPanel } from '../shared/accounts/panel.js';

const lifecycle = new AbortController();
mountAccountPanel(document.getElementById('accounts'), null, lifecycle.signal);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) lifecycle.abort();
});
