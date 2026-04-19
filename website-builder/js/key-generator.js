/**
 * Key Generator - Pembuatan dan validasi pasangan kunci RSA
 */

import { isPrime, generatePrime, gcd, modInverse, validateKeyPair } from './rsa-math.js';

// Error codes
const ERR_NOT_PRIME = 'ERR_NOT_PRIME';
const ERR_NOT_POSITIVE_INT = 'ERR_NOT_POSITIVE_INT';
const ERR_INVALID_KEY = 'ERR_INVALID_KEY';

/**
 * Menghasilkan pasangan kunci RSA.
 * Jika p dan q diberikan, gunakan nilai tersebut; jika tidak, hasilkan prima acak.
 * @param {number} [p] - Bilangan prima pertama (opsional)
 * @param {number} [q] - Bilangan prima kedua (opsional)
 * @returns {{ keyPair: RSAKeyPair, steps: KeyGenerationSteps }}
 * @throws {Error} ERR_NOT_PRIME jika p atau q bukan bilangan prima
 */
function generateKeyPair(p, q) {
  // Step 1: Tentukan p dan q
  if (p !== undefined && q !== undefined) {
    // Validasi bahwa p dan q adalah prima
    if (!isPrime(p)) {
      const err = new Error('Nilai p harus berupa bilangan prima');
      err.code = ERR_NOT_PRIME;
      throw err;
    }
    if (!isPrime(q)) {
      const err = new Error('Nilai q harus berupa bilangan prima');
      err.code = ERR_NOT_PRIME;
      throw err;
    }
  } else {
    // Hasilkan prima acak dalam rentang [11, 100]
    p = generatePrime(11, 100);
    // Pastikan q berbeda dari p
    do {
      q = generatePrime(11, 100);
    } while (q === p);
  }

  const step1_primes = {
    p,
    q,
    description: `Pilih dua bilangan prima: p = ${p} dan q = ${q}`
  };

  // Step 2: Hitung n = p * q
  const n = p * q;
  const step2_n = {
    value: n,
    formula: 'n = p × q',
    description: `Hitung modulus: n = ${p} × ${q} = ${n}`
  };

  // Step 3: Hitung phi = (p-1) * (q-1)
  const phi = (p - 1) * (q - 1);
  const step3_phi = {
    value: phi,
    formula: 'φ(n) = (p-1) × (q-1)',
    description: `Hitung Euler's totient: φ(n) = (${p}-1) × (${q}-1) = ${p - 1} × ${q - 1} = ${phi}`
  };

  // Step 4: Cari e sehingga gcd(e, phi) = 1, mulai dari 2
  let e = 2;
  while (e < phi) {
    if (gcd(e, phi) === 1) break;
    e++;
  }
  const step4_e = {
    value: e,
    description: `Cari e sehingga gcd(e, φ(n)) = 1: e = ${e}, gcd(${e}, ${phi}) = ${gcd(e, phi)}`
  };

  // Step 5: Hitung d = modInverse(e, phi)
  const d = modInverse(e, phi);
  const step5_d = {
    value: d,
    formula: 'd = e⁻¹ mod φ(n)',
    description: `Hitung private exponent: d = ${e}⁻¹ mod ${phi} = ${d}, verifikasi: (${e} × ${d}) mod ${phi} = ${(e * d) % phi}`
  };

  const keyPair = {
    p,
    q,
    n,
    phi,
    e,
    d,
    publicKey: { n, e },
    privateKey: { n, d }
  };

  const steps = {
    step1_primes,
    step2_n,
    step3_phi,
    step4_e,
    step5_d
  };

  return { keyPair, steps };
}

/**
 * Memvalidasi input kunci manual dari pengguna.
 * @param {number} n
 * @param {number} e
 * @param {number} d
 * @returns {{ valid: boolean, keyPair?: object, error?: string }}
 */
function validateManualKey(n, e, d) {
  // Validasi bahwa n, e, d adalah bilangan bulat positif
  if (!Number.isInteger(n) || n <= 0) {
    return { valid: false, error: ERR_NOT_POSITIVE_INT };
  }
  if (!Number.isInteger(e) || e <= 0) {
    return { valid: false, error: ERR_NOT_POSITIVE_INT };
  }
  if (!Number.isInteger(d) || d <= 0) {
    return { valid: false, error: ERR_NOT_POSITIVE_INT };
  }

  // Validasi konsistensi matematis kunci menggunakan validateKeyPair
  if (!validateKeyPair(n, e, d)) {
    return { valid: false, error: ERR_INVALID_KEY };
  }

  return {
    valid: true,
    keyPair: {
      publicKey: { n, e },
      privateKey: { n, d }
    }
  };
}

export { generateKeyPair, validateManualKey, ERR_NOT_PRIME, ERR_NOT_POSITIVE_INT, ERR_INVALID_KEY };
