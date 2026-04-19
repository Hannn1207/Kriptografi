/**
 * Encryptor - Enkripsi plaintext menggunakan RSA
 */

import { modPow } from './rsa-math.js';

// Error codes
const ERR_NO_KEY = 'ERR_NO_KEY';
const ERR_EMPTY_PLAINTEXT = 'ERR_EMPTY_PLAINTEXT';
const ERR_KEY_TOO_SMALL = 'ERR_KEY_TOO_SMALL';

// Menyimpan error terakhir
let lastError = null;

/**
 * Mengambil kode error terakhir
 * @returns {string|null}
 */
function getLastError() {
  return lastError;
}

/**
 * Mengenkripsi plaintext menggunakan public key RSA.
 * Setiap karakter dienkripsi secara terpisah: C = M^e mod n
 *
 * @param {string} plaintext - Teks yang akan dienkripsi
 * @param {{ n: number, e: number }|null|undefined} publicKey - Kunci publik RSA
 * @returns {{ ciphertext: number[], ciphertextString: string, steps: object[] }|null}
 */
function encrypt(plaintext, publicKey) {
  // Validasi: kunci harus tersedia
  if (publicKey == null) {
    lastError = ERR_NO_KEY;
    return null;
  }

  // Validasi: plaintext tidak boleh kosong atau hanya whitespace
  if (typeof plaintext !== 'string' || plaintext.trim() === '') {
    lastError = ERR_EMPTY_PLAINTEXT;
    return null;
  }

  const { n, e } = publicKey;

  // Validasi: n harus lebih besar dari semua nilai ASCII dalam plaintext
  for (let i = 0; i < plaintext.length; i++) {
    const asciiValue = plaintext.charCodeAt(i);
    if (asciiValue >= n) {
      lastError = ERR_KEY_TOO_SMALL;
      return null;
    }
  }

  const steps = [];
  const ciphertext = [];

  for (let i = 0; i < plaintext.length; i++) {
    const character = plaintext[i];
    const asciiValue = plaintext.charCodeAt(i);
    const cipherValue = modPow(asciiValue, e, n);

    const formula = 'C = M^e mod n';
    const substituted = `C = ${asciiValue}^${e} mod ${n}`;
    const description = `Karakter '${character}' memiliki nilai ASCII ${asciiValue}. Enkripsi: C = ${asciiValue}^${e} mod ${n} = ${cipherValue}`;

    steps.push({
      character,
      asciiValue,
      cipherValue,
      formula,
      substituted,
      description
    });

    ciphertext.push(cipherValue);
  }

  lastError = null;
  return {
    ciphertext,
    ciphertextString: ciphertext.join(' '),
    steps
  };
}

export { encrypt, getLastError, ERR_NO_KEY, ERR_EMPTY_PLAINTEXT, ERR_KEY_TOO_SMALL };
