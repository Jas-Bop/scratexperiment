import { AccountStore } from '../../shared/accounts/account-store.js';
import { DRIVE_MAD } from '../game/progression.js';

/** Run between the native storage script and game startup. Order matters. */
export function installProfileStorage(host, masterSaveBase64) {
  const account = new AccountStore(host.localStorage, host.sessionStorage, host.crypto).current();
  const paths = profilePaths(account);
  initializeProfile(host.localStorage, paths, account);
  seedMasterCompletion(host.localStorage, paths, account, masterSaveBase64);
  host.Storage.PREFIX = paths.data;
  host.Storage.PATH_VERSION = paths.version;
}

function profilePaths(account) {
  const root = `${DRIVE_MAD.profilePrefix}${account?.id ?? 'guest'}/`;
  return {
    data: `${root}data/`,
    version: `${root}version`,
    masterSeed: `${root}master-completion-v1`,
  };
}

function initializeProfile(storage, paths, account) {
  if (storage.getItem(paths.version) !== null) return;
  if (!account) migrateOriginalGuestSave(storage, paths.data);
  storage.setItem(paths.version, JSON.stringify({ version: DRIVE_MAD.storageVersion }));
}

function migrateOriginalGuestSave(storage, destinationPrefix) {
  const originalPrefix = `${DRIVE_MAD.nativePrefix}data/`;
  for (const key of Object.keys(storage)) {
    if (!key.startsWith(originalPrefix)) continue;
    storage.setItem(destinationPrefix + key.slice(originalPrefix.length), storage.getItem(key));
  }
}

function seedMasterCompletion(storage, paths, account, masterSaveBase64) {
  if (account?.role !== 'master' || storage.getItem(paths.masterSeed) !== null) return;
  for (const file of DRIVE_MAD.saveFiles) storage.setItem(paths.data + file, masterSaveBase64);
  // Write the marker last: later launches preserve achievements earned after seeding.
  storage.setItem(paths.masterSeed, String(DRIVE_MAD.levelCount));
}
