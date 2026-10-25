import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { AccountStore } from '../src/accounts/account-store.js';
import { installAccountProgress } from '../src/runtime/account-progress.js';
import { isProgress } from '../src/shared/progress.js';
import { MESSAGE_TYPE } from '../src/shared/protocol.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function accountHarness() {
  const storage = memoryStorage();
  const session = memoryStorage();
  return { storage, session, store: new AccountStore(storage, session, webcrypto) };
}

test('accounts hash passwords with unique salts, reject duplicates, and authenticate case-insensitive usernames', async () => {
  const { store, storage, session } = accountHarness();
  const first = await store.create('Admin', 'a-long-password');
  const second = await store.create('Player', 'a-long-password');
  const records = JSON.parse(storage.getItem('anime-launch.accounts.v1'));
  assert.notEqual(records[0].passwordHash, records[1].passwordHash);
  assert.equal(JSON.stringify(records).includes('a-long-password'), false);
  assert.equal(first.passwordHash, undefined);
  assert.notEqual(first.id, second.id);
  await assert.rejects(store.create('ADMIN', 'another-password'), /already exists/);
  store.signOut();
  await assert.rejects(store.signIn('Admin', 'wrong-password'), /Incorrect/);
  assert.equal(store.current(), null);
  assert.equal((await store.signIn('admin', 'a-long-password')).id, first.id);
  const recreated = new AccountStore(storage, session, webcrypto);
  assert.equal(recreated.current().id, first.id);
});

test('character and admin progression belongs to the signed-in account only', async () => {
  const { store } = accountHarness();
  const admin = await store.create('Admin', 'admin-password');
  const progress = { char_nami_yn: 1, web_admin_yn: 1, task_ammo_increase: 7 };
  store.saveProgress(admin.id, progress);
  store.signOut();
  const normal = await store.create('Player', 'player-password');
  assert.deepEqual(normal.progress, {});
  store.saveProgress(admin.id, { char_nami_yn: 0 });
  store.signOut();
  assert.deepEqual((await store.signIn('Admin', 'admin-password')).progress, progress);
  const copy = store.current();
  copy.progress.char_nami_yn = 0;
  assert.equal(store.current().progress.char_nami_yn, 1);
});

test('invalid accounts and transient game state are rejected without changing saves', async () => {
  const { store } = accountHarness();
  await assert.rejects(store.create('<script>', 'long-password'), /username/);
  await assert.rejects(store.create('Player', 'short'), /password/);
  const account = await store.create('Player', 'long-password');
  for (const progress of [
    null,
    [],
    { 'power X': 99999 },
    { char_nami_yn: 2 },
    { task_ammo_increase: 99 },
  ]) {
    assert.equal(isProgress(progress), false);
    assert.throws(() => store.saveProgress(account.id, progress), /invalid progress/);
  }
  assert.deepEqual(store.current().progress, {});
});

test('storage failure does not pretend an account was created', async () => {
  const { storage, session } = accountHarness();
  storage.setItem = () => {
    throw new Error('Quota exceeded');
  };
  const store = new AccountStore(storage, session, webcrypto);
  await assert.rejects(store.create('Player', 'long-password'), /Quota/);
  assert.equal(store.current(), null);
});

test('runtime waits for Scratch initialization, restores admin, and retains it across restart', () => {
  const runtime = new EventEmitter();
  const variables = Object.fromEntries(
    Object.entries({
      char_nami_yn: 0,
      task_nami_complete: 0,
      task_ammo_increase: 1,
      web_admin_yn: 0,
      web_account_active: 0,
      web_accounts_tasks_ready: 0,
      web_accounts_characters_ready: 0,
    }).map(([name, value]) => [name, { name, value }]),
  );
  runtime.getTargetForStage = () => ({ variables });
  const notifications = [];
  const accounts = installAccountProgress({ runtime }, (type, payload) =>
    notifications.push({ type, ...payload }),
  );
  accounts.setProfile(
    { char_nami_yn: 1, task_nami_complete: 1, web_admin_yn: 1, task_ammo_increase: 7 },
    true,
  );
  runtime.emit('AFTER_EXECUTE');
  assert.equal(notifications.length, 0);
  // A restart before the first restoration must preserve the pending saved profile.
  accounts.beforeRestart();
  variables.web_accounts_tasks_ready.value = 1;
  variables.web_accounts_characters_ready.value = 1;
  runtime.emit('AFTER_EXECUTE');
  assert.equal(variables.char_nami_yn.value, 1);
  assert.equal(notifications.at(-1).type, MESSAGE_TYPE.PROGRESS);
  accounts.beforeRestart();
  variables.char_nami_yn.value = 0;
  runtime.emit('AFTER_EXECUTE');
  assert.equal(variables.char_nami_yn.value, 0);
  variables.web_accounts_tasks_ready.value = 1;
  variables.web_accounts_characters_ready.value = 1;
  runtime.emit('AFTER_EXECUTE');
  assert.equal(variables.char_nami_yn.value, 1);
  assert.equal(variables.task_ammo_increase.value, 7);
  accounts.dispose();
  assert.equal(runtime.listenerCount('AFTER_EXECUTE'), 0);
});

test('damaged stored accounts are reported without replacing the original data', () => {
  const { store, storage } = accountHarness();
  for (const raw of ['not JSON', '{"wrong":"shape"}', '[{"id":"missing-name"}]']) {
    storage.setItem('anime-launch.accounts.v1', raw);
    assert.throws(() => store.current(), /storage is damaged/);
    assert.equal(storage.getItem('anime-launch.accounts.v1'), raw);
  }
});
