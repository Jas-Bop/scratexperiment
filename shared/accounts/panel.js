import { AccountStore } from './account-store.js';
import { AccountPanelView, ACCOUNT_COPY, progressMessage } from './panel-view.js';

/** Connect the shared form to accounts. The optional player supplies Anime Launch progress. */
export function mountAccountPanel(root, player, signal) {
  const view = new AccountPanelView(root);
  const options = { signal };
  let store;
  let account = null;
  let busy = false;

  try {
    store = new AccountStore();
    account = store.current();
    player?.setProfile(account?.progress ?? null);
    let message = ACCOUNT_COPY.guest;
    if (account) message = account.role === 'master' ? ACCOUNT_COPY.master : ACCOUNT_COPY.signedIn;
    view.message(message);
  } catch {
    view.message(ACCOUNT_COPY.storageUnavailable);
  }
  view.render(account);

  function saveProgress() {
    if (!player || !account || !store) return;
    const progress = player.progress;
    if (progress === null) return;
    try {
      store.saveProgress(account.id, progress);
      account.progress = progress;
      view.message(progressMessage(account));
      view.render(account);
    } catch {
      view.message(ACCOUNT_COPY.saveFailed);
    }
  }

  async function submitCredentials(event) {
    event.preventDefault();
    if (busy) return;
    if (!store) return view.message(ACCOUNT_COPY.storageRequired);
    const creatingAccount = event.submitter?.value === 'create';
    const { username, password } = view.credentials();
    busy = true;
    view.setBusy(true);
    view.message(creatingAccount ? 'Creating account…' : 'Signing in…');
    try {
      account = creatingAccount
        ? await store.create(username, password)
        : await store.signIn(username, password);
      if (signal.aborted) return;
      player?.setProfile(account.progress);
      view.form.reset();
      view.message(
        account.role === 'master'
          ? ACCOUNT_COPY.master
          : 'Signed in. Your profile is ready across Game Hub.',
      );
      view.render(account);
    } catch (error) {
      view.message(error.message);
    } finally {
      view.password.value = '';
      busy = false;
      view.setBusy(false);
    }
  }

  function signOut() {
    saveProgress();
    try {
      store.signOut();
      account = null;
      player?.setProfile(null);
      view.message(ACCOUNT_COPY.signedOut);
      view.render(account);
    } catch {
      view.message(ACCOUNT_COPY.signOutFailed);
    }
  }

  player?.addEventListener('progresschange', saveProgress, options);
  view.form.addEventListener('submit', submitCredentials, options);
  view.signOut.addEventListener('click', signOut, options);
}
