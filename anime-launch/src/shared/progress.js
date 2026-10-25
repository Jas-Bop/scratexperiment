/** Only permanent character progression crosses the player/runtime boundary. */
export function isProgressVariable(name) {
  return (
    /^char_[a-z0-9]+_yn$/.test(name) ||
    /^task_[a-z0-9]+_complete$/.test(name) ||
    name === 'task_ammo_increase' ||
    name === 'web_admin_yn'
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
        (name === 'task_ammo_increase' ? value >= 1 && value <= 7 : value === 0 || value === 1),
    )
  );
}
