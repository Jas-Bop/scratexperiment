import { ANIME_PROGRESS, isProgress } from '../anime-progress.js';

/** Account roles grant local game progress; they are not server authorization. */
export function isMasterAccount(record, masterCredentials) {
  return (
    record.role === 'master' &&
    record.username === masterCredentials.username &&
    record.passwordHash === masterCredentials.passwordHash
  );
}

export function masterProgress(progress = {}) {
  return { ...progress, [ANIME_PROGRESS.adminFlag]: 1 };
}

/** Return display/game data only. Credential hashes never enter the UI. */
export function accountProfile(record, masterCredentials) {
  return {
    id: record.id,
    username: record.username,
    role: isMasterAccount(record, masterCredentials) ? 'master' : 'player',
    progress: isProgress(record.progress) ? { ...record.progress } : {},
  };
}
