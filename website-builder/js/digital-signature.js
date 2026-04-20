/**
 * Digital Signature - Tanda Tangan Digital menggunakan RSA + SHA-256
 * Menggunakan Web Crypto API untuk hashing SHA-256
 * Mendukung semua jenis file (teks, PDF, DOCX, gambar, dll.)
 */

import { modPow } from './rsa-math.js';

/**
 * Hitung SHA-256 dari ArrayBuffer, kembalikan hex string
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} hex string
 */
async function sha256FromBuffer(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Baca file sebagai ArrayBuffer
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Baca file sebagai teks (hanya untuk file teks)
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}

/**
 * Cek apakah file adalah file teks yang bisa ditampilkan
 * @param {File} file
 * @returns {boolean}
 */
function isTextFile(file) {
  const textTypes = ['text/', 'application/json', 'application/javascript', 'application/xml'];
  const textExtensions = ['.txt', '.md', '.csv', '.json', '.js', '.py', '.html', '.css', '.xml', '.log'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return textTypes.some(t => file.type.startsWith(t)) || textExtensions.includes(ext);
}

/**
 * Format ukuran file
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Konversi hex string ke angka desimal (ambil 8 karakter pertama)
 * @param {string} hex
 * @returns {number}
 */
function hexToDecimalTruncated(hex) {
  const truncated = hex.substring(0, 8);
  return parseInt(truncated, 16);
}

/**
 * Buat tanda tangan digital dari file
 * S = hash^d mod n  (menggunakan kunci privat)
 *
 * @param {File} file
 * @param {{ n: number, d: number }} privateKey
 * @returns {Promise<object>}
 */
async function signFile(file, privateKey) {
  const { n, d } = privateKey;

  // Baca file sebagai buffer (mendukung semua jenis file)
  const buffer = await readFileAsBuffer(file);

  // Hitung SHA-256 dari buffer
  const hashHex = await sha256FromBuffer(buffer);

  // Konversi ke desimal dan mod n
  const hashDecimal = hexToDecimalTruncated(hashHex);
  const hashMod = hashDecimal % n;

  // Tanda tangani: S = hash^d mod n
  const signature = modPow(hashMod, d, n);

  const steps = [
    `<div class="step-formula">SHA-256("${file.name}", ${formatFileSize(file.size)})</div>
     <div class="step-substituted">= ${hashHex}</div>
     <div class="step-description">Hash SHA-256 dihitung dari seluruh byte file (mendukung semua format file)</div>`,

    `<div class="step-formula">Hash (8 hex pertama) = 0x${hashHex.substring(0, 8)}</div>
     <div class="step-substituted">= ${hashDecimal}</div>
     <div class="step-description">Ambil 8 karakter hex pertama dan konversi ke desimal untuk RSA edukasi</div>`,

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
 *
 * @param {File} file
 * @param {number} signature
 * @param {{ n: number, e: number }} publicKey
 * @returns {Promise<object>}
 */
async function verifySignature(file, signature, publicKey) {
  const { n, e } = publicKey;

  // Baca file sebagai buffer
  const buffer = await readFileAsBuffer(file);

  // Hitung hash file
  const hashHex = await sha256FromBuffer(buffer);
  const hashDecimal = hexToDecimalTruncated(hashHex);
  const hashMod = hashDecimal % n;

  // Pulihkan hash dari tanda tangan: hash_recovered = S^e mod n
  const hashRecovered = modPow(signature, e, n);

  // Bandingkan
  const valid = hashMod === hashRecovered;

  const steps = [
    `<div class="step-formula">SHA-256("${file.name}", ${formatFileSize(file.size)})</div>
     <div class="step-substituted">= ${hashHex}</div>
     <div class="step-description">Hitung ulang hash SHA-256 dari file yang diterima</div>`,

    `<div class="step-formula">Hash mod n = ${hashDecimal} mod ${n}</div>
     <div class="step-substituted">= ${hashMod}</div>
     <div class="step-description">Konversi hash ke desimal dan ambil mod n</div>`,

    `<div class="step-formula">hash_recovered = S^e mod n</div>
     <div class="step-substituted">= ${signature}^${e} mod ${n} = ${hashRecovered}</div>
     <div class="step-description">Pulihkan hash dari tanda tangan menggunakan kunci publik e</div>`,

    `<div class="step-formula">hash_file == hash_recovered ?</div>
     <div class="step-substituted">${hashMod} == ${hashRecovered} → ${valid ? '✅ SAMA' : '❌ BERBEDA'}</div>
     <div class="step-description">${valid
       ? 'Tanda tangan VALID — file tidak diubah dan berasal dari pengirim yang benar'
       : 'Tanda tangan TIDAK VALID — file mungkin telah diubah atau tanda tangan salah'}</div>`,
  ];

  return { valid, hashHex, hashDecimal, hashMod, hashRecovered, steps };
}

export { signFile, verifySignature, readFileAsText, isTextFile, formatFileSize };
