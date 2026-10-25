import { isProgress } from '../shared/progress.js';

const STORAGE_KEY = 'anime-launch.accounts.v1';
const SESSION_KEY = 'anime-launch.session.v1';
const ITERATIONS = 210_000;
const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Browser-local credentials and character saves. This is not server authentication. */
export class AccountStore {
  constructor(storage = localStorage, session = sessionStorage, cryptoProvider = crypto) {
    this.storage = storage;
    this.session = session;
    this.crypto = cryptoProvider;
  }

  readAccounts() {
    const records = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(records)) throw new Error('Account storage is damaged.');
    return records;
  }

  current() {
    const id = this.session.getItem(SESSION_KEY);
    const account = this.readAccounts().find((record) => record.id === id);
    return account ? this.publicAccount(account) : null;
  }

  async create(username, password) {
    username = username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) {
      throw new Error(
        'Use 3–24 letters, numbers, dots, underscores, or hyphens for your username.',
      );
    }
    if (password.length < 8 || password.length > 128) {
      throw new Error('Choose a password between 8 and 128 characters.');
    }
    const salt = hex(this.crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await this.hash(password, salt);
    // Read after hashing to catch another tab registering the same name in the meantime.
    const accounts = this.readAccounts();
    if (accounts.some((record) => record.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('That username already exists in this browser.');
    }
    const account = { id: this.crypto.randomUUID(), username, salt, passwordHash, progress: {} };
    this.storage.setItem(STORAGE_KEY, JSON.stringify([...accounts, account]));
    this.session.setItem(SESSION_KEY, account.id);
    return this.publicAccount(account);
  }

  async signIn(username, password) {
    const account = this.readAccounts().find(
      (record) => record.username.toLowerCase() === username.trim().toLowerCase(),
    );
    if (!account || (await this.hash(password, account.salt)) !== account.passwordHash) {
      throw new Error('Incorrect username or password.');
    }
    this.session.setItem(SESSION_KEY, account.id);
    return this.publicAccount(account);
  }

  signOut() {
    this.session.removeItem(SESSION_KEY);
  }

  saveProgress(accountId, progress) {
    if (!isProgress(progress)) throw new Error('The game sent invalid progress.');
    if (this.session.getItem(SESSION_KEY) !== accountId) return;
    const accounts = this.readAccounts();
    const account = accounts.find((record) => record.id === accountId);
    if (!account) throw new Error('This account no longer exists.');
    account.progress = { ...progress };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }

  publicAccount(account) {
    return {
      id: account.id,
      username: account.username,
      progress: isProgress(account.progress) ? { ...account.progress } : {},
    };
  }

  async hash(password, salt) {
    const key = await this.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await this.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      key,
      256,
    );
    return hex(new Uint8Array(bits));
  }
}
