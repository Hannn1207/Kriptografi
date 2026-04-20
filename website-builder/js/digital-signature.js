/**
 * Digital Signature - Tanda Tangan Digital menggunakan RSA + SHA-256
 * Menggunakan Web Crypto API untuk hashing SHA-256
 */

import { modPow } from './rsa-math.js';

/**
 * Hitung SHA-256 dari string, kembalikan hex string
 * @param {string} text
 * @returns {Promise<string>} hex string
 */
async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Konversi hex string ke angka desimal (ambil 8 karakter pertama agar muat di RSA edukasi)
 * @param {string} hex
 * @returns {number}
 */
function hexToDecimalTruncated(hex) {
  // Ambil 8 karakter hex pertama = 32-bit number, cukup untuk RSA edukasi
  const truncated = hex.substring(0, 8);
  return parseInt(truncated, 16);
}

/**
 * Buat tanda tangan digital
 * S = hash^d mod n  (menggunakan kunci privat)
 *
 * @param {string} fileContent - Isi file
 * @param {{ n: number, d: number }} privateKey
 * @returns {Promise<{ hash: string, hashDecimal: number, signature: number, steps: string[] }>}
 */
async function signDocument(fileContent, privateKey) {
  const { n, d } = privateKey;

  // Step 1: Hitung hash SHA-256
  const hashHex = await sha256Hex(fileContent);

  // Step 2: Konversi ke desimal (dipotong agar muat di RSA edukasi)
  const hashDecimal = hexToDecimalTruncated(hashHex);

  // Pastikan hash < n (syarat RSA)
  const hashMod = hashDecimal % n;

  // Step 3: Tanda tangani: S = hash^d mod n
  const signature = modPow(hashMod, d, n);

  const steps = [
    `<div class="step-formula">SHA-256("${fileContent.substring(0, 30)}${fileContent.length > 30 ? '...' : ''}")</div>
     <div class="step-substituted">= ${hashHex}</div>
     <div class="step-description">Hash SHA-256 dari isi file (256-bit, ditampilkan dalam heksadesimal)</div>`,

    `<div class="step-formula">Hash (desimal, 8 hex pertama) = 0x${hashHex.substring(0, 8)}</div>
     <div class="step-substituted">= ${hashDecimal}</div>
     <div class="step-description">Konversi 8 karakter hex pertama ke desimal untuk digunakan dalam RSA edukasi</div>`,

    `<div class="step-formula">Hash mod n = ${hashDecimal} mod ${n}</div>
     <div class="step-substituted">= ${hashMod}</div>
     <div class="step-description">Pastikan nilai hash lebih kecil dari n (syarat RSA: M &lt; n)</div>`,

    `<div class="step-formula">S = hash^d mod n</div>
     <div class="step-substituted">S = ${hashMod}^${d} mod ${n} = ${signature}</div>
     <div class="step-description">Tanda tangan digital dibuat dengan mengenkripsi hash menggunakan kunci privat d</div>`,
  ];

  return { hashHex, hashDecimal, hashMod, signature, steps };
}

/**
 * Verifikasi tanda tangan digital
 * hash_recovered = S^e mod n  (menggunakan kunci publik)
 * Bandingkan dengan hash file yang diupload
 *
 * @param {string} fileContent - Isi file yang akan diverifikasi
 * @param {number} signature - Tanda tangan yang diterima
 * @param {{ n: number, e: number }} publicKey
 * @returns {Promise<{ valid: boolean, hashFile: string, hashRecovered: number, steps: string[] }>}
 */
async function verifySignature(fileContent, signature, publicKey) {
  const { n, e } = publicKey;

  // Step 1: Hitung hash file yang diupload
  const hashHex = await sha256Hex(fileContent);
  const hashDecimal = hexToDecimalTruncated(hashHex);
  const hashMod = hashDecimal % n;

  // Step 2: Pulihkan hash dari tanda tangan: hash_recovered = S^e mod n
  const hashRecovered = modPow(signature, e, n);

  // Step 3: Bandingkan
  const valid = hashMod === hashRecovered;

  const steps = [
    `<div class="step-formula">SHA-256(file yang diverifikasi)</div>
     <div class="step-substituted">= ${hashHex}</div>
     <div class="step-description">Hitung ulang hash SHA-256 dari file yang diterima</div>`,

    `<div class="step-formula">Hash mod n = ${hashDecimal} mod ${n}</div>
     <div class="step-substituted">= ${hashMod}</div>
     <div class="step-description">Konversi hash ke desimal dan ambil mod n</div>`,

    `<div class="step-formula">hash_recovered = S^e mod n</div>
     <div class="step-substituted">= ${signature}^${e} mod ${n} = ${hashRecovered}</div>
     <div class="step-description">Pulihkan hash dari tanda tangan menggunakan kunci publik e</div>`,

    `<div class="step-formula">Perbandingan: hash_file == hash_recovered?</div>
     <div class="step-substituted">${hashMod} == ${hashRecovered} → ${valid ? '✅ SAMA' : '❌ BERBEDA'}</div>
     <div class="step-description">${valid
       ? 'Tanda tangan VALID — file tidak diubah dan berasal dari pengirim yang benar'
       : 'Tanda tangan TIDAK VALID — file mungkin telah diubah atau tanda tangan salah'}</div>`,
  ];

  return { valid, hashHex, hashDecimal, hashMod, hashRecovered, steps };
}

export { signDocument, verifySignature, sha256Hex };
