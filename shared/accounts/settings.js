/**
 * Account rules and persisted-format settings.
 * Storage keys and password parameters must stay stable unless saves are migrated.
 */
export const ACCOUNT_STORAGE = Object.freeze({
  records: 'anime-launch.accounts.v1',
  session: 'anime-launch.session.v1',
});

export const ACCOUNT_RULES = Object.freeze({
  usernamePattern: /^[a-zA-Z0-9_.-]{3,24}$/,
  minimumPasswordLength: 8,
  maximumPasswordLength: 128,
});

export const PASSWORD_FORMAT = Object.freeze({
  algorithm: 'PBKDF2',
  hash: 'SHA-256',
  iterations: 210_000,
  saltBytes: 16,
  resultBits: 256,
});

export function usernameKey(username) {
  return username.trim().toLowerCase();
}

export function validateNewAccount(username, password) {
  if (!ACCOUNT_RULES.usernamePattern.test(username)) {
    throw new Error('Use 3–24 letters, numbers, dots, underscores, or hyphens for your username.');
  }
  if (
    password.length < ACCOUNT_RULES.minimumPasswordLength ||
    password.length > ACCOUNT_RULES.maximumPasswordLength
  ) {
    throw new Error(
      `Choose a password between ${ACCOUNT_RULES.minimumPasswordLength} and ${ACCOUNT_RULES.maximumPasswordLength} characters.`,
    );
  }
}
