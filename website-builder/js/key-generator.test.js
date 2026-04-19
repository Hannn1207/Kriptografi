/**
 * Unit tests dan property tests untuk key-generator.js
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateKeyPair, validateManualKey, ERR_NOT_PRIME, ERR_NOT_POSITIVE_INT, ERR_INVALID_KEY } from './key-generator.js';
import { gcd } from './rsa-math.js';

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('generateKeyPair', () => {
  it('kunci yang dihasilkan memenuhi (e * d) mod phi === 1', () => {
    const { keyPair } = generateKeyPair();
    expect((keyPair.e * keyPair.d) % keyPair.phi).toBe(1);
  });

  it('kunci yang dihasilkan memiliki semua field wajib', () => {
    const { keyPair } = generateKeyPair();
    expect(keyPair).toHaveProperty('p');
    expect(keyPair).toHaveProperty('q');
    expect(keyPair).toHaveProperty('n');
    expect(keyPair).toHaveProperty('phi');
    expect(keyPair).toHaveProperty('e');
    expect(keyPair).toHaveProperty('d');
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('privateKey');
  });

  it('kunci yang dihasilkan memiliki n = p * q', () => {
    const { keyPair } = generateKeyPair();
    expect(keyPair.n).toBe(keyPair.p * keyPair.q);
  });

  it('kunci yang dihasilkan memiliki phi = (p-1)*(q-1)', () => {
    const { keyPair } = generateKeyPair();
    expect(keyPair.phi).toBe((keyPair.p - 1) * (keyPair.q - 1));
  });

  it('kunci yang dihasilkan memiliki gcd(e, phi) = 1', () => {
    const { keyPair } = generateKeyPair();
    expect(gcd(keyPair.e, keyPair.phi)).toBe(1);
  });

  it('menggunakan p dan q yang diberikan (p=61, q=53)', () => {
    const { keyPair } = generateKeyPair(61, 53);
    expect(keyPair.p).toBe(61);
    expect(keyPair.q).toBe(53);
    expect(keyPair.n).toBe(3233);
    expect(keyPair.phi).toBe(3120);
  });

  it('input p=4 (bukan prima) → melempar error ERR_NOT_PRIME', () => {
    expect(() => generateKeyPair(4, 7)).toThrow();
    try {
      generateKeyPair(4, 7);
    } catch (err) {
      expect(err.code).toBe(ERR_NOT_PRIME);
    }
  });

  it('input q=6 (bukan prima) → melempar error ERR_NOT_PRIME', () => {
    expect(() => generateKeyPair(7, 6)).toThrow();
    try {
      generateKeyPair(7, 6);
    } catch (err) {
      expect(err.code).toBe(ERR_NOT_PRIME);
    }
  });

  it('steps memiliki semua field yang diperlukan', () => {
    const { steps } = generateKeyPair();
    expect(steps).toHaveProperty('step1_primes');
    expect(steps).toHaveProperty('step2_n');
    expect(steps).toHaveProperty('step3_phi');
    expect(steps).toHaveProperty('step4_e');
    expect(steps).toHaveProperty('step5_d');
    expect(steps.step1_primes).toHaveProperty('description');
    expect(steps.step2_n).toHaveProperty('description');
    expect(steps.step2_n).toHaveProperty('formula');
    expect(steps.step3_phi).toHaveProperty('description');
    expect(steps.step3_phi).toHaveProperty('formula');
    expect(steps.step4_e).toHaveProperty('description');
    expect(steps.step5_d).toHaveProperty('description');
    expect(steps.step5_d).toHaveProperty('formula');
  });
});

describe('validateManualKey', () => {
  it('kunci valid (n=3233, e=17, d=2753) → { valid: true }', () => {
    const result = validateManualKey(3233, 17, 2753);
    expect(result.valid).toBe(true);
    expect(result.keyPair).toBeDefined();
    expect(result.keyPair.publicKey).toEqual({ n: 3233, e: 17 });
    expect(result.keyPair.privateKey).toEqual({ n: 3233, d: 2753 });
  });

  it('input n=0 → error ERR_NOT_POSITIVE_INT', () => {
    const result = validateManualKey(0, 17, 2753);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERR_NOT_POSITIVE_INT);
  });

  it('input e=-1 → error ERR_NOT_POSITIVE_INT', () => {
    const result = validateManualKey(3233, -1, 2753);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERR_NOT_POSITIVE_INT);
  });

  it('input d=1.5 (bukan integer) → error ERR_NOT_POSITIVE_INT', () => {
    const result = validateManualKey(3233, 17, 1.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERR_NOT_POSITIVE_INT);
  });

  it('kunci tidak konsisten → error ERR_INVALID_KEY', () => {
    const result = validateManualKey(3233, 17, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(ERR_INVALID_KEY);
  });
});

// ─── Property Tests ───────────────────────────────────────────────────────────

// Arbitrary untuk menghasilkan pasangan prima valid
// Menggunakan prima kecil agar komputasi cepat
const SMALL_PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

function validPrimeArbitrary() {
  return fc.tuple(
    fc.constantFrom(...SMALL_PRIMES),
    fc.constantFrom(...SMALL_PRIMES)
  ).filter(([p, q]) => p !== q).map(([p, q]) => ({ p, q }));
}

// Feature: website-builder, Property 2: Konsistensi matematis kunci RSA yang dihasilkan
// For any pasangan prima valid, kunci yang dihasilkan harus memenuhi semua relasi matematis RSA
describe('Property 2: Konsistensi matematis kunci RSA yang dihasilkan', () => {
  it('kunci yang dihasilkan memenuhi semua relasi matematis RSA', () => {
    // Validates: Requirements 1.1, 1.2, 1.3
    fc.assert(
      fc.property(
        validPrimeArbitrary(),
        ({ p, q }) => {
          const { keyPair } = generateKeyPair(p, q);
          return (
            keyPair.n === p * q &&
            keyPair.phi === (p - 1) * (q - 1) &&
            gcd(keyPair.e, keyPair.phi) === 1 &&
            (keyPair.e * keyPair.d) % keyPair.phi === 1 &&
            ['p', 'q', 'n', 'phi', 'e', 'd', 'publicKey', 'privateKey'].every(f => f in keyPair)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
