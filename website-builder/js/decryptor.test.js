/**
 * Unit tests dan property tests untuk decryptor.js
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseCiphertext, decrypt, getLastError, ERR_NO_PRIVATE_KEY } from './decryptor.js';
import { encrypt } from './encryptor.js';
import { modPow } from './rsa-math.js';
import { generateKeyPair } from './key-generator.js';

// Kunci RSA contoh untuk pengujian: p=61, q=53 → n=3233, e=17, d=2753
const TEST_PRIVATE_KEY = { n: 3233, d: 2753 };
const TEST_PUBLIC_KEY = { n: 3233, e: 17 };

// ─── Unit Tests: parseCiphertext ──────────────────────────────────────────────

describe('parseCiphertext — unit tests', () => {
  it('parseCiphertext("2790 2345") → [2790, 2345]', () => {
    expect(parseCiphertext('2790 2345')).toEqual([2790, 2345]);
  });

  it('parseCiphertext("2790") → [2790]', () => {
    expect(parseCiphertext('2790')).toEqual([2790]);
  });

  it('parseCiphertext("abc def") → null', () => {
    expect(parseCiphertext('abc def')).toBeNull();
  });

  it('parseCiphertext("") → null', () => {
    expect(parseCiphertext('')).toBeNull();
  });

  it('parseCiphertext("   ") → null (hanya whitespace)', () => {
    expect(parseCiphertext('   ')).toBeNull();
  });

  it('parseCiphertext("123 abc") → null (campuran valid dan tidak valid)', () => {
    expect(parseCiphertext('123 abc')).toBeNull();
  });

  it('parseCiphertext("0") → [0]', () => {
    expect(parseCiphertext('0')).toEqual([0]);
  });

  it('parseCiphertext dengan spasi ganda antar token → tetap valid', () => {
    expect(parseCiphertext('2790  2345')).toEqual([2790, 2345]);
  });

  it('parseCiphertext dengan tab antar token → tetap valid', () => {
    expect(parseCiphertext('2790\t2345')).toEqual([2790, 2345]);
  });
});

// ─── Unit Tests: decrypt ──────────────────────────────────────────────────────

describe('decrypt — unit tests', () => {
  it('dekripsi [2790] dengan kunci (n=3233, d=2753) → "A"', () => {
    const result = decrypt([2790], TEST_PRIVATE_KEY);
    expect(result).not.toBeNull();
    expect(result.plaintext).toBe('A');
  });

  it('dekripsi menghasilkan satu langkah dengan field yang benar', () => {
    const result = decrypt([2790], TEST_PRIVATE_KEY);
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.cipherValue).toBe(2790);
    expect(step.asciiValue).toBe(65); // ASCII 'A'
    expect(step.character).toBe('A');
    expect(step.formula).toBe('M = C^d mod n');
    expect(step.substituted).toBe('M = 2790^2753 mod 3233');
    expect(step.description).toContain('2790');
    expect(step.description).toContain('65');
    expect(step.description).toContain('A');
  });

  it('dekripsi tanpa private key (null) → null + ERR_NO_PRIVATE_KEY', () => {
    const result = decrypt([2790], null);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_NO_PRIVATE_KEY);
  });

  it('dekripsi tanpa private key (undefined) → null + ERR_NO_PRIVATE_KEY', () => {
    const result = decrypt([2790], undefined);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_NO_PRIVATE_KEY);
  });

  it('dekripsi array kosong → plaintext kosong dengan steps kosong', () => {
    const result = decrypt([], TEST_PRIVATE_KEY);
    expect(result).not.toBeNull();
    expect(result.plaintext).toBe('');
    expect(result.steps).toHaveLength(0);
  });

  it('jumlah langkah sesuai panjang array ciphertext', () => {
    const result = decrypt([2790, 2790, 2790], TEST_PRIVATE_KEY);
    expect(result.steps).toHaveLength(3);
  });
});

// ─── Helper: arbitrary untuk pasangan prima valid ─────────────────────────────

function validPrimeArbitrary() {
  const smallPrimes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  return fc.tuple(
    fc.constantFrom(...smallPrimes),
    fc.constantFrom(...smallPrimes)
  ).filter(([p, q]) => p !== q);
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: website-builder, Property 5: Kebenaran langkah dekripsi per angka
// For any ciphertext dan kunci valid, setiap step harus menggunakan rumus M = C^d mod n
describe('Property 5: Kebenaran langkah dekripsi per angka', () => {
  it('steps.length === ciphertext.length dan setiap asciiValue === modPow(cipherValue, d, n)', () => {
    // Validates: Requirements 4.2, 4.4, 5.2, 5.5
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 3232 }), { minLength: 1 }),
        validPrimeArbitrary(),
        (cipherArr, [p, q]) => {
          const { keyPair } = generateKeyPair(p, q);
          const result = decrypt(cipherArr, keyPair.privateKey);
          if (result === null) return false;

          const { n, d } = keyPair.privateKey;

          return (
            result.steps.length === cipherArr.length &&
            result.steps.every(step =>
              step.asciiValue === modPow(step.cipherValue, d, n) &&
              step.formula.length > 0 &&
              step.substituted.length > 0 &&
              step.description.length > 0
            )
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: website-builder, Property 7: Round-trip parsing ciphertext
// For any array bilangan bulat non-negatif, parseCiphertext(numbers.join(' ')) === array semula
describe('Property 7: Round-trip parsing ciphertext', () => {
  it('parseCiphertext(numbers.join(" ")) menghasilkan array yang identik', () => {
    // Validates: Requirements 4.6, 3.3
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 99999 }), { minLength: 1 }),
        (numbers) => {
          const str = numbers.join(' ');
          const parsed = parseCiphertext(str);
          return (
            parsed !== null &&
            parsed.length === numbers.length &&
            parsed.every((v, i) => v === numbers[i])
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: website-builder, Property 1: Round-trip enkripsi-dekripsi
// For any plaintext tidak kosong dan kunci RSA valid, decrypt(encrypt(plaintext).ciphertext, privateKey).plaintext === plaintext
describe('Property 1: Round-trip enkripsi-dekripsi', () => {
  it('decrypt(encrypt(plaintext).ciphertext, privateKey).plaintext === plaintext', () => {
    // Validates: Requirements 4.7, 4.2, 4.3
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        validPrimeArbitrary(),
        (plaintext, [p, q]) => {
          const { keyPair } = generateKeyPair(p, q);
          const encrypted = encrypt(plaintext, keyPair.publicKey);
          if (encrypted === null) return true; // skip jika enkripsi gagal (seharusnya tidak terjadi)

          const decrypted = decrypt(encrypted.ciphertext, keyPair.privateKey);
          if (decrypted === null) return false;

          return decrypted.plaintext === plaintext;
        }
      ),
      { numRuns: 100 }
    );
  });
});
