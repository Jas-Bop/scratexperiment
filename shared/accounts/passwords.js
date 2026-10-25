import { PASSWORD_FORMAT } from './settings.js';

const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Web Crypto stays here; account workflows only create and verify credentials. */
export class PasswordHasher {
  constructor(cryptoProvider) {
    this.crypto = cryptoProvider;
  }

  async create(password) {
    const salt = toHex(this.crypto.getRandomValues(new Uint8Array(PASSWORD_FORMAT.saltBytes)));
    return { salt, passwordHash: await this.hash(password, salt) };
  }

  async verify(password, credentials) {
    return (await this.hash(password, credentials.salt)) === credentials.passwordHash;
  }

  async hash(password, salt) {
    const encode = (value) => new TextEncoder().encode(value);
    const key = await this.crypto.subtle.importKey(
      'raw',
      encode(password),
      PASSWORD_FORMAT.algorithm,
      false,
      ['deriveBits'],
    );
    const bits = await this.crypto.subtle.deriveBits(
      {
        name: PASSWORD_FORMAT.algorithm,
        salt: encode(salt),
        iterations: PASSWORD_FORMAT.iterations,
        hash: PASSWORD_FORMAT.hash,
      },
      key,
      PASSWORD_FORMAT.resultBits,
    );
    return toHex(new Uint8Array(bits));
  }
}
