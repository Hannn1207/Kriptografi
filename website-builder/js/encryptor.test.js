/**
 * Unit tests dan property tests untuk encryptor.js
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { encrypt, getLastError, ERR_NO_KEY, ERR_EMPTY_PLAINTEXT } from './encryptor.js';
import { modPow } from './rsa-math.js';
import { generateKeyPair } from './key-generator.js';

// Kunci RSA contoh untuk pengujian: p=61, q=53 → n=3233, e=17, d=2753
const TEST_PUBLIC_KEY = { n: 3233, e: 17 };

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('encrypt — unit tests', () => {
  it('enkripsi "A" dengan kunci (n=3233, e=17) → ciphertext[0] = 2790', () => {
    const result = encrypt('A', TEST_PUBLIC_KEY);
    expect(result).not.toBeNull();
    expect(result.ciphertext[0]).toBe(2790);
  });

  it('enkripsi "A" menghasilkan ciphertextString "2790"', () => {
    const result = encrypt('A', TEST_PUBLIC_KEY);
    expect(result.ciphertextString).toBe('2790');
  });

  it('enkripsi "A" menghasilkan satu langkah dengan field yang benar', () => {
    const result = encrypt('A', TEST_PUBLIC_KEY);
    expect(result.steps).toHaveLength(1);
    const step = result.steps[0];
    expect(step.character).toBe('A');
    expect(step.asciiValue).toBe(65);
    expect(step.cipherValue).toBe(2790);
    expect(step.formula).toBe('C = M^e mod n');
    expect(step.substituted).toBe('C = 65^17 mod 3233');
    expect(step.description).toContain('A');
    expect(step.description).toContain('65');
    expect(step.description).toContain('2790');
  });

  it('enkripsi tanpa kunci (null) → null + ERR_NO_KEY', () => {
    const result = encrypt('Hello', null);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_NO_KEY);
  });

  it('enkripsi tanpa kunci (undefined) → null + ERR_NO_KEY', () => {
    const result = encrypt('Hello', undefined);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_NO_KEY);
  });

  it('enkripsi string kosong → null + ERR_EMPTY_PLAINTEXT', () => {
    const result = encrypt('', TEST_PUBLIC_KEY);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_EMPTY_PLAINTEXT);
  });

  it('enkripsi string hanya spasi → null + ERR_EMPTY_PLAINTEXT', () => {
    const result = encrypt('   ', TEST_PUBLIC_KEY);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_EMPTY_PLAINTEXT);
  });

  it('enkripsi string hanya tab → null + ERR_EMPTY_PLAINTEXT', () => {
    const result = encrypt('\t\t', TEST_PUBLIC_KEY);
    expect(result).toBeNull();
    expect(getLastError()).toBe(ERR_EMPTY_PLAINTEXT);
  });

  it('enkripsi multi-karakter menghasilkan jumlah langkah yang sesuai', () => {
    const result = encrypt('Hello', TEST_PUBLIC_KEY);
    expect(result).not.toBeNull();
    expect(result.steps).toHaveLength(5);
    expect(result.ciphertext).toHaveLength(5);
  });

  it('ciphertextString adalah nilai ciphertext dipisah spasi', () => {
    const result = encrypt('AB', TEST_PUBLIC_KEY);
    expect(result).not.toBeNull();
    const expected = result.ciphertext.join(' ');
    expect(result.ciphertextString).toBe(expected);
  });
});

// ─── Property Tests ───────────────────────────────────────────────────────────

// Helper: arbitrary untuk pasangan prima valid
function validPrimeArbitrary() {
  const smallPrimes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  return fc.tuple(
    fc.constantFrom(...smallPrimes),
    fc.constantFrom(...smallPrimes)
  ).filter(([p, q]) => p !== q);
}

// Feature: website-builder, Property 4: Kebenaran langkah enkripsi per karakter
// For any plaintext dan kunci valid, setiap step harus menggunakan rumus C = M^e mod n
describe('Property 4: Kebenaran langkah enkripsi per karakter', () => {
  it('steps.length === plaintext.length dan setiap cipherValue === modPow(asciiValue, e, n)', () => {
    // Validates: Requirements 3.2, 3.4, 5.2, 5.5
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        validPrimeArbitrary(),
        (plaintext, [p, q]) => {
          // Skip whitespace-only strings — those are covered by Property 6
          if (plaintext.trim() === '') return true;
          const { keyPair } = generateKeyPair(p, q);
          const result = encrypt(plaintext, keyPair.publicKey);
          if (result === null) return false;

          const { n, e } = keyPair.publicKey;

          return (
            result.steps.length === plaintext.length &&
            result.steps.every(step =>
              step.cipherValue === modPow(step.asciiValue, e, n) &&
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

// Feature: website-builder, Property 6: Penolakan plaintext kosong atau whitespace
// For any string whitespace-only, enkripsi harus ditolak (mengembalikan null)
describe('Property 6: Penolakan plaintext kosong atau whitespace', () => {
  it('encrypt mengembalikan null untuk semua string whitespace-only', () => {
    // Validates: Requirements 3.6
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespace) => {
          const result = encrypt(whitespace, TEST_PUBLIC_KEY);
          return result === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});
