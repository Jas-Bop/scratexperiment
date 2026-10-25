/** Scratch variable names are a saved-game contract; keep them stable. */
export const ANIME_PROGRESS = Object.freeze({
  adminFlag: 'web_admin_yn',
  ammunitionLevel: 'task_ammo_increase',
  maximumAmmunitionLevel: 7,
  activeAccount: 'web_account_active',
  startupMarkers: Object.freeze(['web_accounts_tasks_ready', 'web_accounts_characters_ready']),
});

export function isCharacterUnlock(name) {
  return /^char_[a-z0-9]+_yn$/.test(name) || /^task_[a-z0-9]+_complete$/.test(name);
}

/** Works with the native VM's variable objects; no renderer or account storage is involved. */
export function unlockAllCharacters(variables) {
  for (const variable of variables) {
    if (isCharacterUnlock(variable.name)) variable.value = 1;
    if (variable.name === ANIME_PROGRESS.ammunitionLevel)
      variable.value = ANIME_PROGRESS.maximumAmmunitionLevel;
  }
}

/** Only permanent character progression crosses the player/runtime boundary. */
export function isProgressVariable(name) {
  return (
    isCharacterUnlock(name) ||
    name === ANIME_PROGRESS.ammunitionLevel ||
    name === ANIME_PROGRESS.adminFlag
  );
}

export function isProgress(progress) {
  return (
    progress !== null &&
    typeof progress === 'object' &&
    !Array.isArray(progress) &&
    Object.keys(progress).length <= 80 &&
    Object.entries(progress).every(
      ([name, value]) =>
        isProgressVariable(name) &&
        Number.isInteger(value) &&
        (name === ANIME_PROGRESS.ammunitionLevel
          ? value >= 1 && value <= ANIME_PROGRESS.maximumAmmunitionLevel
          : value === 0 || value === 1),
    )
  );
}
