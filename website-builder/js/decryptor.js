/**
 * Decryptor - Dekripsi ciphertext menggunakan RSA
 */

import { modPow } from './rsa-math.js';

// Error codes
const ERR_NO_PRIVATE_KEY = 'ERR_NO_PRIVATE_KEY';
const ERR_INVALID_CIPHERTEXT = 'ERR_INVALID_CIPHERTEXT';

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
 * Mem-parse string ciphertext menjadi array angka.
 * Split berdasarkan whitespace, parse setiap token ke integer.
 *
 * @param {string} ciphertextString - String ciphertext dipisah spasi
 * @returns {number[]|null} Array angka, atau null jika format tidak valid
 */
function parseCiphertext(ciphertextString) {
  // Kembalikan null jika string kosong atau hanya whitespace
  if (typeof ciphertextString !== 'string' || ciphertextString.trim() === '') {
    return null;
  }

  const tokens = ciphertextString.trim().split(/\s+/);
  const result = [];

  for (const token of tokens) {
    // Token harus berupa angka (hanya digit, boleh diawali tanda minus untuk negatif)
    if (!/^-?\d+$/.test(token)) {
      return null;
    }
    const num = parseInt(token, 10);
    if (isNaN(num)) {
      return null;
    }
    result.push(num);
  }

  return result;
}

/**
 * Mendekripsi ciphertext menggunakan private key RSA.
 * Setiap angka didekripsi: M = C^d mod n
 *
 * @param {number[]} ciphertext - Array angka ciphertext
 * @param {{ n: number, d: number }|null|undefined} privateKey - Kunci privat RSA
 * @returns {{ plaintext: string, steps: object[] }|null}
 */
function decrypt(ciphertext, privateKey) {
  // Validasi: private key harus tersedia
  if (privateKey == null) {
    lastError = ERR_NO_PRIVATE_KEY;
    return null;
  }

  const { n, d } = privateKey;
  const steps = [];
  let plaintext = '';

  for (const cipherValue of ciphertext) {
    const asciiValue = modPow(cipherValue, d, n);
    const character = String.fromCharCode(asciiValue);

    const formula = 'M = C^d mod n';
    const substituted = `M = ${cipherValue}^${d} mod ${n}`;
    const description = `Angka ciphertext ${cipherValue} didekripsi: M = ${cipherValue}^${d} mod ${n} = ${asciiValue}, karakter: '${character}'`;

    steps.push({
      cipherValue,
      asciiValue,
      character,
      formula,
      substituted,
      description
    });

    plaintext += character;
  }

  lastError = null;
  return { plaintext, steps };
}

export { parseCiphertext, decrypt, getLastError, ERR_NO_PRIVATE_KEY, ERR_INVALID_CIPHERTEXT };
