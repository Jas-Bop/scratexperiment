import { MASTER_ACCOUNT } from './master-account.js';
import { AccountRepository } from './repository.js';
import { PasswordHasher } from './passwords.js';
import { usernameKey, validateNewAccount } from './settings.js';
import { accountProfile, isMasterAccount, masterProgress } from './profiles.js';
import { isProgress } from '../anime-progress.js';

/** Public account workflows. Storage, cryptography, and role rules live in their own modules. */
export class AccountStore {
  constructor(
    storage = localStorage,
    session = sessionStorage,
    cryptoProvider = crypto,
    masterAccount = MASTER_ACCOUNT,
  ) {
    this.repository = new AccountRepository(storage, session);
    this.passwords = new PasswordHasher(cryptoProvider);
    this.crypto = cryptoProvider;
    this.masterAccount = masterAccount;
  }

  current() {
    const activeId = this.repository.activeId();
    const record = this.repository.readAll().find((account) => account.id === activeId);
    return record ? accountProfile(record, this.masterAccount) : null;
  }

  async create(username, password) {
    username = username.trim();
    validateNewAccount(username, password);
    if (usernameKey(username) === usernameKey(this.masterAccount.username)) {
      throw new Error('This is the master account. Choose Sign in.');
    }
    const credentials = await this.passwords.create(password);
    // Re-read after hashing so a name registered in another tab is noticed.
    const records = this.repository.readAll();
    if (records.some((record) => usernameKey(record.username) === usernameKey(username))) {
      throw new Error('That username already exists in this browser.');
    }
    const record = { id: this.crypto.randomUUID(), username, ...credentials, progress: {} };
    this.repository.saveAll([...records, record]);
    return this.startSession(record);
  }

  async signIn(username, password) {
    if (usernameKey(username) === usernameKey(this.masterAccount.username)) {
      return this.signInMaster(password);
    }
    const record = this.repository
      .readAll()
      .find((account) => usernameKey(account.username) === usernameKey(username));
    if (!record || !(await this.passwords.verify(password, record))) {
      throw new Error('Incorrect username or password.');
    }
    return this.startSession(record);
  }

  async signInMaster(password) {
    if (!(await this.passwords.verify(password, this.masterAccount))) {
      throw new Error('Incorrect username or password.');
    }
    const records = this.repository.readAll();
    let record = records.find(
      (account) => usernameKey(account.username) === usernameKey(this.masterAccount.username),
    );
    if (!record) {
      record = { id: this.crypto.randomUUID(), progress: {} };
      records.push(record);
    }
    Object.assign(record, this.masterAccount, {
      role: 'master',
      progress: masterProgress(record.progress),
    });
    this.repository.saveAll(records);
    return this.startSession(record);
  }

  signOut() {
    this.repository.endSession();
  }

  saveProgress(accountId, progress) {
    if (!isProgress(progress)) throw new Error('The game sent invalid progress.');
    if (this.repository.activeId() !== accountId) return;
    const records = this.repository.readAll();
    const record = records.find((account) => account.id === accountId);
    if (!record) throw new Error('This account no longer exists.');
    record.progress = isMasterAccount(record, this.masterAccount)
      ? masterProgress(progress)
      : { ...progress };
    this.repository.saveAll(records);
  }

  startSession(record) {
    this.repository.startSession(record.id);
    return accountProfile(record, this.masterAccount);
  }
}
