import { AccountStore } from './account-store.js';

/** Account UI is separate from the game player and never receives password hashes. */
export function mountAccountPanel(root, player, signal) {
  const form = root.querySelector('form');
  const username = root.querySelector('[name="username"]');
  const password = root.querySelector('[name="password"]');
  const current = root.querySelector('[data-account-name]');
  const status = root.querySelector('[data-account-status]');
  const signOut = root.querySelector('[data-sign-out]');
  const options = { signal };
  let store;
  let account = null;
  let busy = false;

  function render() {
    const admin = account?.progress.web_admin_yn === 1;
    current.textContent = account
      ? `${account.username}${admin ? ' · Admin' : ''}`
      : 'Playing as Guest';
    form.hidden = Boolean(account);
    signOut.hidden = !account;
  }

  try {
    store = new AccountStore();
    account = store.current();
    player.setProfile(account?.progress ?? null);
    status.textContent = account
      ? 'Your character progress saves automatically.'
      : 'Sign in to save character progress, or play as Guest.';
  } catch {
    status.textContent = 'Account storage is unavailable. You can still play as Guest.';
  }
  render();

  function saveProgress() {
    if (!account || !store || player.progress === null) return;
    try {
      store.saveProgress(account.id, player.progress);
      account.progress = player.progress;
      status.textContent =
        account.progress.web_admin_yn === 1
          ? 'Admin mode · Every character unlocked. Progress saved.'
          : 'Character progress saved in this browser.';
      render();
    } catch {
      status.textContent = 'Could not save progress. Keep a game save code before leaving.';
    }
  }

  player.addEventListener('progresschange', saveProgress, options);
  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();
      if (busy) return;
      if (!store) {
        status.textContent = 'Allow browser storage to use accounts.';
        return;
      }
      busy = true;
      const action = event.submitter?.value ?? 'sign-in';
      for (const button of form.querySelectorAll('button')) button.disabled = true;
      status.textContent = action === 'create' ? 'Creating account…' : 'Signing in…';
      try {
        account =
          action === 'create'
            ? await store.create(username.value, password.value)
            : await store.signIn(username.value, password.value);
        if (signal.aborted) return;
        player.setProfile(account.progress);
        form.reset();
        status.textContent = 'Signed in. Click Play game to continue with your character progress.';
        render();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        password.value = '';
        busy = false;
        for (const button of form.querySelectorAll('button')) button.disabled = false;
      }
    },
    options,
  );

  signOut.addEventListener(
    'click',
    () => {
      saveProgress();
      try {
        store.signOut();
        account = null;
        player.setProfile(null);
        status.textContent = 'Signed out. Your character progress is saved.';
        render();
      } catch {
        status.textContent = 'Could not sign out. Check browser storage permissions.';
      }
    },
    options,
  );
}
