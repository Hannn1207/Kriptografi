/**
 * Unit tests dan property tests untuk rsa-math.js
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isPrime, generatePrime, gcd, modInverse, modPow, validateKeyPair } from './rsa-math.js';

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('isPrime', () => {
  it('isPrime(2) → true', () => expect(isPrime(2)).toBe(true));
  it('isPrime(3) → true', () => expect(isPrime(3)).toBe(true));
  it('isPrime(5) → true', () => expect(isPrime(5)).toBe(true));
  it('isPrime(7) → true', () => expect(isPrime(7)).toBe(true));
  it('isPrime(11) → true', () => expect(isPrime(11)).toBe(true));
  it('isPrime(1) → false', () => expect(isPrime(1)).toBe(false));
  it('isPrime(0) → false', () => expect(isPrime(0)).toBe(false));
  it('isPrime(-5) → false', () => expect(isPrime(-5)).toBe(false));
  it('isPrime(4) → false', () => expect(isPrime(4)).toBe(false));
  it('isPrime(9) → false', () => expect(isPrime(9)).toBe(false));
  it('isPrime(100) → false', () => expect(isPrime(100)).toBe(false));
});

describe('generatePrime', () => {
  it('menghasilkan bilangan prima dalam rentang [2, 10]', () => {
    const p = generatePrime(2, 10);
    expect(isPrime(p)).toBe(true);
    expect(p).toBeGreaterThanOrEqual(2);
    expect(p).toBeLessThanOrEqual(10);
  });

  it('melempar error jika tidak ada prima dalam rentang', () => {
    expect(() => generatePrime(8, 10)).toThrow();
  });
});

describe('gcd', () => {
  it('gcd(17, 3120) → 1', () => expect(gcd(17, 3120)).toBe(1));
  it('gcd(12, 8) → 4', () => expect(gcd(12, 8)).toBe(4));
  it('gcd(0, 5) → 5', () => expect(gcd(0, 5)).toBe(5));
  it('gcd(5, 0) → 5', () => expect(gcd(5, 0)).toBe(5));
  it('gcd(100, 75) → 25', () => expect(gcd(100, 75)).toBe(25));
});

describe('modInverse', () => {
  it('modInverse(17, 3120) → 2753', () => expect(modInverse(17, 3120)).toBe(2753));
  it('verifikasi: (17 * 2753) mod 3120 === 1', () => {
    const d = modInverse(17, 3120);
    expect((17 * d) % 3120).toBe(1);
  });
  it('mengembalikan null jika tidak ada inverse (gcd !== 1)', () => {
    expect(modInverse(4, 8)).toBeNull();
  });
});

describe('modPow', () => {
  it('modPow(65, 17, 3233) → 2790', () => expect(modPow(65, 17, 3233)).toBe(2790));
  it('modPow(2790, 2753, 3233) → 65 (dekripsi)', () => expect(modPow(2790, 2753, 3233)).toBe(65));
  it('modPow(2, 10, 1000) → 24', () => expect(modPow(2, 10, 1000)).toBe(24));
  it('modPow(base, 0, mod) → 1', () => expect(modPow(5, 0, 7)).toBe(1));
  it('modPow(base, exp, 1) → 0', () => expect(modPow(5, 3, 1)).toBe(0));
});

describe('validateKeyPair', () => {
  it('kunci RSA valid (n=3233, e=17, d=2753) → true', () => {
    expect(validateKeyPair(3233, 17, 2753)).toBe(true);
  });
  it('kunci tidak valid → false', () => {
    expect(validateKeyPair(3233, 17, 100)).toBe(false);
  });
});

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: website-builder, Property 10: Modular exponentiation
// For any base, exp, mod valid, modPow harus sama dengan perhitungan BigInt
describe('Property 10: Modular exponentiation', () => {
  it('modPow(base, exp, mod) === Number(BigInt(base) ** BigInt(exp) % BigInt(mod))', () => {
    // Validates: Requirements 3.2, 4.2
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 2, max: 1000 }),
        (base, exp, mod) => {
          const expected = Number(BigInt(base) ** BigInt(exp) % BigInt(mod));
          return modPow(base, exp, mod) === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: website-builder, Property 3: Deteksi bilangan non-prima
// For any bilangan komposit atau ≤ 1, isPrime harus mengembalikan false
describe('Property 3: Deteksi bilangan non-prima', () => {
  it('isPrime mengembalikan false untuk semua bilangan komposit dan ≤ 1', () => {
    // Validates: Requirements 1.5, 2.4
    fc.assert(
      fc.property(
        fc.oneof(
          // Bilangan komposit: 4 ke atas yang bukan prima
          fc.integer({ min: 4, max: 10000 }).filter(n => {
            for (let i = 2; i <= Math.sqrt(n); i++) {
              if (n % i === 0) return true;
            }
            return false;
          }),
          // Bilangan ≤ 1
          fc.integer({ max: 1 })
        ),
        (nonPrime) => isPrime(nonPrime) === false
      ),
      { numRuns: 100 }
    );
  });
});
