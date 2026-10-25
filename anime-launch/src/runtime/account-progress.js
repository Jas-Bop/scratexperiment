import { isProgressVariable } from '../shared/progress.js';
import { MESSAGE_TYPE } from '../shared/protocol.js';

/** Restore after the original Scratch startup scripts finish, then observe permanent unlocks. */
export function installAccountProgress(vm, notify) {
  let profile = null;
  let needsRestore = false;
  let previous = '';
  const variables = () => Object.values(vm.runtime.getTargetForStage?.()?.variables ?? {});
  const set = (name, value) => {
    const variable = variables().find((item) => item.name === name);
    if (variable) variable.value = value;
  };

  function setProfile(progress, active) {
    profile = active ? { ...progress } : null;
    needsRestore = true;
    previous = '';
    set('web_account_active', active ? 1 : 0);
  }

  function beforeRestart() {
    if (profile && !needsRestore) profile = snapshot();
    needsRestore = true;
    set('web_accounts_tasks_ready', 0);
    set('web_accounts_characters_ready', 0);
  }

  function snapshot() {
    return Object.fromEntries(
      variables()
        .filter((item) => isProgressVariable(item.name))
        .map((item) => [item.name, Number(item.value)]),
    );
  }

  function afterStep() {
    const all = variables();
    if (
      !['web_accounts_tasks_ready', 'web_accounts_characters_ready'].every((name) =>
        all.some((item) => item.name === name && Number(item.value) === 1),
      )
    )
      return;
    if (needsRestore) {
      for (const [name, value] of Object.entries(profile ?? {})) set(name, value);
      set('web_account_active', profile ? 1 : 0);
      needsRestore = false;
    }
    if (!profile) return;
    const progress = snapshot();
    const serialized = JSON.stringify(progress);
    if (serialized === previous) return;
    previous = serialized;
    profile = progress;
    notify(MESSAGE_TYPE.PROGRESS, { progress });
  }

  vm.runtime.on('AFTER_EXECUTE', afterStep);
  return { setProfile, beforeRestart, dispose: () => vm.runtime.off('AFTER_EXECUTE', afterStep) };
}
