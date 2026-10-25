import { ACCOUNT_STORAGE } from './settings.js';

/** The only account module that reads or writes browser storage. Never clears damaged saves. */
export class AccountRepository {
  constructor(storage, session) {
    this.storage = storage;
    this.session = session;
  }

  readAll() {
    const raw = this.storage.getItem(ACCOUNT_STORAGE.records);
    let records;
    try {
      records = JSON.parse(raw ?? '[]');
    } catch {
      throw new Error('Account storage is damaged.');
    }
    if (
      !Array.isArray(records) ||
      records.some(
        (record) => !record || typeof record.id !== 'string' || typeof record.username !== 'string',
      )
    ) {
      throw new Error('Account storage is damaged.');
    }
    return records;
  }

  saveAll(records) {
    this.storage.setItem(ACCOUNT_STORAGE.records, JSON.stringify(records));
  }

  activeId() {
    return this.session.getItem(ACCOUNT_STORAGE.session);
  }

  startSession(accountId) {
    this.session.setItem(ACCOUNT_STORAGE.session, accountId);
  }

  endSession() {
    this.session.removeItem(ACCOUNT_STORAGE.session);
  }
}
