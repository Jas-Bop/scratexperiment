import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto, pbkdf2Sync } from 'node:crypto';
import { deflateSync, inflateSync } from 'node:zlib';
import { AccountStore } from '../shared/accounts/account-store.js';
import { MASTER_ACCOUNT } from '../shared/accounts/master-account.js';
import { completeAllLevels, DRIVE_MAD } from '../drive-mad/game/progression.js';
import { installProfileStorage } from '../drive-mad/src/profile-storage.js';

class MemoryStorage {
  getItem(key) {
    return Object.hasOwn(this, key) ? this[key] : null;
  }
  setItem(key, value) {
    this[key] = String(value);
  }
  removeItem(key) {
    delete this[key];
  }
}

const baseSave = JSON.parse(
  await readFile(new URL('../drive-mad/game/base-save.json', import.meta.url)),
);
const masterSave = deflateSync(JSON.stringify(completeAllLevels(baseSave))).toString('base64');

function driveHost(role = null) {
  const host = {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    crypto: webcrypto,
    Storage: {},
  };
  if (role) {
    const record = {
      id: `${role}-profile`,
      username: role === 'master' ? MASTER_ACCOUNT.username : 'Normal',
      passwordHash: role === 'master' ? MASTER_ACCOUNT.passwordHash : 'not-a-master',
      role,
      progress: {},
    };
    host.localStorage.setItem('anime-launch.accounts.v1', JSON.stringify([record]));
    host.sessionStorage.setItem('anime-launch.session.v1', record.id);
  }
  return host;
}

test('the reserved master account authenticates by its configured hash and grants automatic Anime Launch access', async () => {
  const password = 'test-only-master-password';
  const salt = 'test-only-master-salt';
  const fixture = {
    username: 'FixtureMaster',
    salt,
    passwordHash: pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex'),
  };
  const store = new AccountStore(new MemoryStorage(), new MemoryStorage(), webcrypto, fixture);
  await assert.rejects(store.create('fixturemaster', 'normal-player-password'), /master account/);
  await assert.rejects(store.signIn('FixtureMaster', 'wrong-password'), /Incorrect/);
  assert.equal(store.current(), null);
  const master = await store.signIn('fixturemaster', password);
  assert.equal(master.role, 'master');
  assert.equal(master.progress.web_admin_yn, 1);
  store.saveProgress(master.id, { web_admin_yn: 0 });
  assert.equal(store.current().progress.web_admin_yn, 1);
  store.signOut();
  const normal = await store.create('Normal', 'normal-player-password');
  assert.equal(normal.role, 'player');
  assert.deepEqual(normal.progress, {});
});

test('the supplied Drive Mad native save records completion of all 200 levels', () => {
  const completed = completeAllLevels(baseSave);
  const scores = completed.gc[DRIVE_MAD.gameId].s;
  assert.equal(Object.keys(scores).length, 200);
  assert.equal(scores[0], -1);
  assert.equal(scores[199], -1);
  assert.ok(Object.values(scores).every((value) => value === -1));
  assert.deepEqual(baseSave.gc, {}, 'The source template stays unchanged');
});

test('master Drive Mad completion is isolated and preserves later achievements on subsequent launches', () => {
  const host = driveHost('master');
  installProfileStorage(host, masterSave);
  const prefix = host.Storage.PREFIX;
  assert.ok(prefix.includes('master-profile'));
  const decoded = JSON.parse(
    inflateSync(Buffer.from(host.localStorage.getItem(prefix + 'sandbox/db'), 'base64')),
  );
  assert.equal(Object.keys(decoded.gc[DRIVE_MAD.gameId].s).length, 200);
  decoded.achievements = { wheelie: true };
  const updated = deflateSync(JSON.stringify(decoded)).toString('base64');
  host.localStorage.setItem(prefix + 'sandbox/db', updated);
  installProfileStorage(host, masterSave);
  assert.equal(host.localStorage.getItem(prefix + 'sandbox/db'), updated);
  host.sessionStorage.removeItem('anime-launch.session.v1');
  installProfileStorage(host, masterSave);
  assert.notEqual(host.Storage.PREFIX, prefix);
  assert.equal(host.localStorage.getItem(host.Storage.PREFIX + 'sandbox/db'), null);
  assert.equal(host.localStorage.getItem(prefix + 'sandbox/db'), updated);
});

test('old Drive Mad progress migrates to Guest only; a normal account starts independently', () => {
  const host = driveHost();
  host.localStorage.setItem(DRIVE_MAD.nativePrefix + 'data/sandbox/db', 'original-guest-save');
  installProfileStorage(host, masterSave);
  assert.equal(
    host.localStorage.getItem(host.Storage.PREFIX + 'sandbox/db'),
    'original-guest-save',
  );
  const normal = driveHost('player');
  installProfileStorage(normal, masterSave);
  assert.ok(normal.Storage.PREFIX.includes('player-profile'));
  assert.equal(normal.localStorage.getItem(normal.Storage.PREFIX + 'sandbox/db'), null);
});
