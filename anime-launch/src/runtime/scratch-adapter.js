import { installAccountProgress } from './account-progress.js';
import { COMMAND, MESSAGE_TYPE, isGameCommand } from '../shared/protocol.js';
import { GAME_KEYS } from '../shared/controls.js';

/**
 * The only module that knows TurboWarp's VM API.
 * Keep this boundary when replacing the game engine or changing player controls.
 */
export function installScratchAdapter(vm, host = window) {
  let muted = false;
  const origin = host.location.origin;
  const notify = (type, payload = {}) => host.parent.postMessage({ type, ...payload }, origin);
  const accounts = installAccountProgress(vm, notify);

  function applyVolume() {
    const output = vm.runtime.audioEngine?.inputNode;
    if (output) output.gain.value = muted ? 0 : 1;
  }

  function handleMessage(event) {
    if (event.origin !== origin || event.source !== host.parent) return;
    if (!isGameCommand(event.data)) return;
    const { action, key, down } = event.data;

    switch (action) {
      case COMMAND.PROFILE:
        accounts.setProfile(event.data.progress, event.data.active);
        break;
      case COMMAND.RESTART:
        accounts.beforeRestart();
        vm.stopAll();
        vm.greenFlag();
        applyVolume();
        break;
      case COMMAND.MUTE:
        muted = event.data.muted;
        applyVolume();
        break;
      case COMMAND.KEY:
        vm.postIOData('keyboard', { key, isDown: down });
        break;
      case COMMAND.FOCUS:
        host.focus();
        break;
    }
  }

  function releaseKeys() {
    for (const key of GAME_KEYS) {
      vm.postIOData('keyboard', { key, isDown: false });
    }
  }

  function handleReady() {
    notify(MESSAGE_TYPE.READY);
  }

  function handleError() {
    notify(MESSAGE_TYPE.ERROR);
  }

  host.addEventListener('message', handleMessage);
  host.addEventListener('blur', releaseKeys);
  host.addEventListener('error', handleError);
  host.addEventListener('unhandledrejection', handleError);
  vm.runtime.on('PROJECT_LOADED', handleReady);

  return function dispose() {
    accounts.dispose();
    releaseKeys();
    host.removeEventListener('message', handleMessage);
    host.removeEventListener('blur', releaseKeys);
    host.removeEventListener('error', handleError);
    host.removeEventListener('unhandledrejection', handleError);
    vm.runtime.off('PROJECT_LOADED', handleReady);
  };
}
