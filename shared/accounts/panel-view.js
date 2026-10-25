import { ANIME_PROGRESS } from '../anime-progress.js';

/** Account wording and DOM updates. This module never reads browser storage. */
export const ACCOUNT_COPY = Object.freeze({
  guest: 'Sign in to save character progress, or play as Guest.',
  signedIn: 'Signed in across Game Hub. Character progress saves automatically.',
  master: 'Master Admin · All Anime Launch characters and Drive Mad levels completed.',
  adminSaved: 'Admin mode · Every character unlocked. Progress saved.',
  saved: 'Character progress saved in this browser.',
  storageUnavailable: 'Account storage is unavailable. You can still play as Guest.',
  storageRequired: 'Allow browser storage to use accounts.',
  saveFailed: 'Could not save progress. Keep a game save code before leaving.',
  signedOut: 'Signed out. Your character progress is saved.',
  signOutFailed: 'Could not sign out. Check browser storage permissions.',
});

export function accountLabel(account) {
  if (!account) return 'Playing as Guest';
  if (account.role === 'master') return `${account.username} · Master Admin`;
  if (account.progress[ANIME_PROGRESS.adminFlag] === 1) return `${account.username} · Admin`;
  return account.username;
}

export function progressMessage(account) {
  if (account.role === 'master') return ACCOUNT_COPY.master;
  if (account.progress[ANIME_PROGRESS.adminFlag] === 1) return ACCOUNT_COPY.adminSaved;
  return ACCOUNT_COPY.saved;
}

export class AccountPanelView {
  constructor(root) {
    this.form = root.querySelector('form');
    this.username = root.querySelector('[name="username"]');
    this.password = root.querySelector('[name="password"]');
    this.name = root.querySelector('[data-account-name]');
    this.status = root.querySelector('[data-account-status]');
    this.signOut = root.querySelector('[data-sign-out]');
  }

  render(account) {
    this.name.textContent = accountLabel(account);
    this.form.hidden = Boolean(account);
    this.signOut.hidden = !account;
  }

  message(text) {
    this.status.textContent = text;
  }

  credentials() {
    return { username: this.username.value, password: this.password.value };
  }

  setBusy(busy) {
    for (const button of this.form.querySelectorAll('button')) button.disabled = busy;
  }
}
