/**
 * RSA Math - Fungsi matematika inti untuk algoritma RSA
 */

/**
 * Mengecek apakah sebuah bilangan adalah prima menggunakan trial division
 * @param {number} n
 * @returns {boolean}
 */
function isPrime(n) {
  if (n <= 1) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Menghasilkan bilangan prima acak dalam rentang [min, max]
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function generatePrime(min, max) {
  const primes = [];
  for (let i = min; i <= max; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }
  if (primes.length === 0) {
    throw new Error(`Tidak ada bilangan prima dalam rentang [${min}, ${max}]`);
  }
  const randomIndex = Math.floor(Math.random() * primes.length);
  return primes[randomIndex];
}

/**
 * Menghitung GCD menggunakan algoritma Euclidean
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Menghitung modular inverse menggunakan Extended Euclidean Algorithm
 * Mengembalikan d sehingga (e * d) mod phi === 1
 * @param {number} e
 * @param {number} phi
 * @returns {number|null}
 */
function modInverse(e, phi) {
  if (gcd(e, phi) !== 1) return null;

  let [old_r, r] = [e, phi];
  let [old_s, s] = [1, 0];

  while (r !== 0) {
    const quotient = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }

  // old_s is the inverse; ensure it's positive
  return ((old_s % phi) + phi) % phi;
}

/**
 * Menghitung modular exponentiation: base^exp mod mod
 * Menggunakan algoritma fast exponentiation (square-and-multiply) dengan BigInt
 * @param {number} base
 * @param {number} exp
 * @param {number} mod
 * @returns {number}
 */
function modPow(base, exp, mod) {
  if (mod === 1) return 0;

  let result = BigInt(1);
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);

  while (e > BigInt(0)) {
    if (e % BigInt(2) === BigInt(1)) {
      result = (result * b) % m;
    }
    e = e / BigInt(2);
    b = (b * b) % m;
  }

  return Number(result);
}

/**
 * Memvalidasi konsistensi kunci RSA dengan melakukan encrypt-decrypt round trip
 * Karena kita tidak memiliki p dan q, validasi dilakukan dengan round trip test
 * @param {number} n
 * @param {number} e
 * @param {number} d
 * @returns {boolean}
 */
function validateKeyPair(n, e, d) {
  // Validate that e and d are positive integers
  if (!Number.isInteger(e) || !Number.isInteger(d) || !Number.isInteger(n)) return false;
  if (e <= 0 || d <= 0 || n <= 0) return false;

  // Test with a few sample values: encrypt then decrypt should give back original
  const testValues = [2, 65, 72];
  for (const m of testValues) {
    if (m >= n) continue;
    const encrypted = modPow(m, e, n);
    const decrypted = modPow(encrypted, d, n);
    if (decrypted !== m) return false;
  }
  return true;
}

export { isPrime, generatePrime, gcd, modInverse, modPow, validateKeyPair };
