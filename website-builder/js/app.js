/**
 * App Controller - Menghubungkan semua komponen dan menangani event UI
 */

import { generateKeyPair, validateManualKey } from './key-generator.js?v=2';
import { encrypt, getLastError as getEncryptLastError, ERR_KEY_TOO_SMALL } from './encryptor.js?v=2';
import { parseCiphertext, decrypt, getLastError as getDecryptLastError } from './decryptor.js?v=2';
import { renderKeyGenerationSteps, renderEncryptionSteps, renderDecryptionSteps } from './step-visualizer.js?v=2';
import { addEntry, clearAll, renderHistory } from './history-manager.js?v=3';
import { signFile, verifySignature, readFileAsText, isTextFile, formatFileSize } from './digital-signature.js';

/**
 * State aplikasi global
 * @type {{ currentKeyPair: object|null, isProcessing: boolean }}
 */
const AppState = {
  currentKeyPair: null,  // RSAKeyPair | null
  isProcessing: false,
};

// ─── Helper: Notifikasi ────────────────────────────────────────────────────────

/**
 * Menampilkan notifikasi kepada pengguna.
 * @param {string} message - Pesan yang ditampilkan
 * @param {'success'|'error'|'warning'} type - Jenis notifikasi
 */
function showNotification(message, type) {
  const el = document.getElementById('notification');
  if (!el) return;

  // Hapus kelas tipe sebelumnya
  el.classList.remove('success', 'error', 'warning', 'hidden');

  el.innerHTML = message;
  el.classList.add(type);

  // Auto-sembunyikan setelah 5 detik
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('success', 'error', 'warning');
  }, 5000);
}

// ─── Helper: Indikator Proses ──────────────────────────────────────────────────

/**
 * Menampilkan indikator proses.
 */
function showProcessing() {
  const el = document.getElementById('processing-indicator');
  if (el) {
    el.classList.remove('hidden');
  }
}

/**
 * Menyembunyikan indikator proses.
 */
function hideProcessing() {
  const el = document.getElementById('processing-indicator');
  if (el) {
    el.classList.add('hidden');
  }
}

// ─── Helper: Tampilkan Nilai Kunci ─────────────────────────────────────────────

/**
 * Merender nilai kunci aktif ke dalam elemen #key-display.
 * @param {object} keyPair - RSAKeyPair
 */
function displayKeyValues(keyPair) {
  const el = document.getElementById('key-display');
  if (!el) return;

  // Normalise: support both full RSAKeyPair (has top-level n/e/d) and
  // the slim object returned by validateManualKey (only has publicKey/privateKey)
  const n   = keyPair.n   !== undefined ? keyPair.n   : keyPair.publicKey.n;
  const e   = keyPair.e   !== undefined ? keyPair.e   : keyPair.publicKey.e;
  const d   = keyPair.d   !== undefined ? keyPair.d   : keyPair.privateKey.d;
  const phi = keyPair.phi !== undefined ? keyPair.phi : undefined;

  el.innerHTML = `
    <h3 class="card-title">Kunci Aktif</h3>
    <dl class="key-values">
      ${keyPair.p !== undefined ? `<div class="key-row"><dt>p</dt><dd>${keyPair.p}</dd></div>` : ''}
      ${keyPair.q !== undefined ? `<div class="key-row"><dt>q</dt><dd>${keyPair.q}</dd></div>` : ''}
      <div class="key-row"><dt>n</dt><dd>${n}</dd></div>
      ${phi !== undefined ? `<div class="key-row"><dt>φ(n)</dt><dd>${phi}</dd></div>` : ''}
      <div class="key-row"><dt>e (public exponent)</dt><dd>${e}</dd></div>
      <div class="key-row"><dt>d (private exponent)</dt><dd>${d}</dd></div>
      <div class="key-row"><dt>Public Key</dt><dd>{ n: ${n}, e: ${e} }</dd></div>
      <div class="key-row"><dt>Private Key</dt><dd>{ n: ${n}, d: ${d} }</dd></div>
    </dl>
  `;
}

// ─── Inisialisasi ──────────────────────────────────────────────────────────────

/**
 * Inisialisasi aplikasi: bind event listeners, set state awal.
 */
function init() {
  // 1. Tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;

      // Update aria-selected pada semua tab
      tabButtons.forEach(b => {
        b.setAttribute('aria-selected', 'false');
        b.classList.remove('active');
      });
      btn.setAttribute('aria-selected', 'true');
      btn.classList.add('active');

      // Tampilkan seksi yang sesuai, sembunyikan yang lain
      document.querySelectorAll('.section').forEach(section => {
        if (section.id === targetId) {
          section.classList.remove('hidden');
          section.classList.add('active');
        } else {
          section.classList.add('hidden');
          section.classList.remove('active');
        }
      });
    });
  });

  // 2. Tombol "Buat Kunci"
  const btnGenerateKey = document.getElementById('btn-generate-key');
  if (btnGenerateKey) {
    btnGenerateKey.addEventListener('click', () => {
      AppState.isProcessing = true;
      showProcessing();

      try {
        const { keyPair, steps } = generateKeyPair();
        AppState.currentKeyPair = keyPair;

        // Tampilkan nilai kunci
        displayKeyValues(keyPair);

        // Render langkah-langkah pembuatan kunci
        const keyStepsEl = document.getElementById('key-steps');
        if (keyStepsEl) {
          renderKeyGenerationSteps(steps, keyStepsEl);
        }

        showNotification('Kunci RSA berhasil dibuat!', 'success');
      } catch (err) {
        showNotification(`Gagal membuat kunci: ${err.message}`, 'error');
      } finally {
        AppState.isProcessing = false;
        hideProcessing();
      }
    });
  }

  // 3. Tombol "Gunakan Kunci Manual"
  const btnManualKey = document.getElementById('btn-manual-key');
  if (btnManualKey) {
    btnManualKey.addEventListener('click', () => {
      const nInput = document.getElementById('input-n');
      const eInput = document.getElementById('input-e');
      const dInput = document.getElementById('input-d');

      const n = parseInt(nInput ? nInput.value : '', 10);
      const e = parseInt(eInput ? eInput.value : '', 10);
      const d = parseInt(dInput ? dInput.value : '', 10);

      const result = validateManualKey(n, e, d);

      if (result.valid) {
        AppState.currentKeyPair = result.keyPair;
        displayKeyValues(result.keyPair);
        showNotification('Kunci manual berhasil digunakan!', 'success');
      } else {
        const errorMessages = {
          ERR_NOT_POSITIVE_INT: 'Nilai kunci harus berupa bilangan bulat positif',
          ERR_INVALID_KEY: 'Kunci yang dimasukkan tidak valid secara matematis',
          ERR_NOT_PRIME: 'Nilai p dan q harus berupa bilangan prima',
        };
        const msg = errorMessages[result.error] || result.error || 'Kunci tidak valid';
        showNotification(msg, 'error');
      }
    });
  }

  // 4. Tombol "Enkripsi"
  const btnEncrypt = document.getElementById('btn-encrypt');
  if (btnEncrypt) {
    btnEncrypt.addEventListener('click', () => {
      if (!AppState.currentKeyPair) {
        showNotification('Harap masukkan atau buat kunci RSA terlebih dahulu', 'error');
        return;
      }

      const plaintextEl = document.getElementById('input-plaintext');
      const plaintext = plaintextEl ? plaintextEl.value : '';

      const encryptResult = encrypt(plaintext, AppState.currentKeyPair.publicKey);

      if (encryptResult === null) {
        const errCode = getEncryptLastError();
        const errorMessages = {
          ERR_NO_KEY: 'Harap masukkan atau buat kunci RSA terlebih dahulu',
          ERR_EMPTY_PLAINTEXT: 'Harap masukkan teks yang akan dienkripsi',
          ERR_KEY_TOO_SMALL: `Nilai n (${AppState.currentKeyPair?.publicKey?.n}) terlalu kecil. Untuk mengenkripsi teks biasa, n harus lebih besar dari 127. Gunakan kunci dengan n yang lebih besar (contoh: n=3233, e=17, d=2753).`,
        };
        const msg = errorMessages[errCode] || 'Enkripsi gagal';
        showNotification(msg, 'error');
        return;
      }

      // Tampilkan ciphertext
      const resultCiphertextEl = document.getElementById('result-ciphertext');
      if (resultCiphertextEl) {
        resultCiphertextEl.innerHTML = `<p class="result-text">${encryptResult.ciphertextString}</p>`;
      }

      // Render langkah-langkah enkripsi
      const encryptStepsEl = document.getElementById('encrypt-steps');
      if (encryptStepsEl) {
        renderEncryptionSteps(encryptResult.steps, encryptStepsEl);
      }

      // Simpan ke riwayat
      addEntry({
        type: 'Enkripsi',
        key: AppState.currentKeyPair.publicKey,
        input: plaintext,
        output: encryptResult.ciphertextString,
      });

      // Render riwayat
      const historyListEl = document.getElementById('history-list');
      if (historyListEl) {
        renderHistory(historyListEl);
      }

      showNotification('Enkripsi berhasil!', 'success');
    });
  }

  // 5. Tombol "Dekripsi"
  const btnDecrypt = document.getElementById('btn-decrypt');
  if (btnDecrypt) {
    btnDecrypt.addEventListener('click', () => {
      if (!AppState.currentKeyPair?.privateKey) {
        showNotification('Harap masukkan private key terlebih dahulu', 'error');
        return;
      }

      const ciphertextEl = document.getElementById('input-ciphertext');
      const ciphertextStr = ciphertextEl ? ciphertextEl.value : '';

      const ciphertext = parseCiphertext(ciphertextStr);
      if (ciphertext === null) {
        showNotification('Format ciphertext tidak valid', 'error');
        return;
      }

      const decryptResult = decrypt(ciphertext, AppState.currentKeyPair.privateKey);

      if (decryptResult === null) {
        const errCode = getDecryptLastError();
        const errorMessages = {
          ERR_NO_PRIVATE_KEY: 'Harap masukkan private key terlebih dahulu',
          ERR_INVALID_CIPHERTEXT: 'Format ciphertext tidak valid',
        };
        const msg = errorMessages[errCode] || 'Dekripsi gagal';
        showNotification(msg, 'error');
        return;
      }

      // Tampilkan plaintext hasil dekripsi
      const resultPlaintextEl = document.getElementById('result-plaintext');
      if (resultPlaintextEl) {
        resultPlaintextEl.innerHTML = `<p class="result-text">${decryptResult.plaintext}</p>`;
      }

      // Render langkah-langkah dekripsi
      const decryptStepsEl = document.getElementById('decrypt-steps');
      if (decryptStepsEl) {
        renderDecryptionSteps(decryptResult.steps, decryptStepsEl);
      }

      // Simpan ke riwayat
      addEntry({
        type: 'Dekripsi',
        key: AppState.currentKeyPair.privateKey,
        input: ciphertextStr.trim(),
        output: decryptResult.plaintext,
      });

      // Render riwayat
      const historyListEl = document.getElementById('history-list');
      if (historyListEl) {
        renderHistory(historyListEl);
      }

      showNotification('Dekripsi berhasil!', 'success');
    });
  }

  // 6. Tombol "Hapus Riwayat"
  const btnClearHistory = document.getElementById('btn-clear-history');
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      clearAll();

      const historyListEl = document.getElementById('history-list');
      if (historyListEl) {
        renderHistory(historyListEl);
      }

      showNotification('Riwayat berhasil dihapus.', 'success');
    });
  }

  // ─── TANDA TANGAN DIGITAL ────────────────────────────────────────────────

  let sigFile = null;
  let verifyFile = null;

  // 7. Upload file untuk ditandatangani
  const sigFileInput = document.getElementById('sig-file-input');
  if (sigFileInput) {
    sigFileInput.addEventListener('change', async (e) => {
      sigFile = e.target.files[0];
      if (!sigFile) return;

      const contentCard = document.getElementById('sig-file-content-card');
      const fileInfoEl = document.getElementById('sig-file-info');
      const textPreviewWrap = document.getElementById('sig-text-preview-wrap');
      const contentEl = document.getElementById('sig-file-content');

      if (fileInfoEl) {
        fileInfoEl.innerHTML = `<div class="sig-file-badge">
          <span>${getFileIcon(sigFile.name)}</span>
          <span class="sig-file-name">${sigFile.name}</span>
          <span class="sig-file-size">${formatFileSize(sigFile.size)}</span>
          <span class="sig-file-type">${sigFile.type || 'unknown'}</span>
        </div>`;
      }

      if (isTextFile(sigFile) && textPreviewWrap && contentEl) {
        try {
          const text = await readFileAsText(sigFile);
          contentEl.value = text;
          textPreviewWrap.classList.remove('hidden');
        } catch { textPreviewWrap.classList.add('hidden'); }
      } else if (textPreviewWrap) {
        textPreviewWrap.classList.add('hidden');
      }

      if (contentCard) contentCard.classList.remove('hidden');
    });
  }

  // 8. Tombol "Buat Tanda Tangan"
  const btnSign = document.getElementById('btn-sign');
  if (btnSign) {
    btnSign.addEventListener('click', async () => {
      if (!AppState.currentKeyPair?.privateKey) {
        showNotification('Harap buat atau masukkan kunci RSA terlebih dahulu di tab Pembuatan Kunci', 'error');
        return;
      }
      if (!sigFile) {
        showNotification('Harap upload file terlebih dahulu', 'error');
        return;
      }

      showProcessing();
      try {
        const result = await signFile(sigFile, AppState.currentKeyPair.privateKey);

        const hashDisplay = document.getElementById('sig-hash-display');
        const hashDecimalEl = document.getElementById('sig-hash-decimal');
        const sigDisplay = document.getElementById('sig-signature-display');
        const signSteps = document.getElementById('sig-sign-steps');
        const resultCard = document.getElementById('sig-result-card');

        if (hashDisplay) hashDisplay.textContent = result.hashHex;
        if (hashDecimalEl) hashDecimalEl.textContent = `${result.hashDecimal} → mod n = ${result.hashMod}`;
        if (sigDisplay) sigDisplay.textContent = result.signature;
        if (signSteps) signSteps.innerHTML = result.steps.join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:0.5rem 0">');
        if (resultCard) resultCard.classList.remove('hidden');

        const verifySigInput = document.getElementById('verify-signature-input');
        if (verifySigInput) verifySigInput.value = result.signature;

        showNotification('Tanda tangan digital berhasil dibuat!', 'success');
      } catch (err) {
        showNotification(`Gagal membuat tanda tangan: ${err.message}`, 'error');
      } finally {
        hideProcessing();
      }
    });
  }

  // 9. Upload file untuk diverifikasi
  const verifyFileInput = document.getElementById('verify-file-input');
  if (verifyFileInput) {
    verifyFileInput.addEventListener('change', (e) => {
      verifyFile = e.target.files[0];
      if (!verifyFile) return;
      const infoEl = document.getElementById('verify-file-info');
      if (infoEl) {
        infoEl.innerHTML = `<div class="sig-file-badge">
          <span>${getFileIcon(verifyFile.name)}</span>
          <span class="sig-file-name">${verifyFile.name}</span>
          <span class="sig-file-size">${formatFileSize(verifyFile.size)}</span>
        </div>`;
        infoEl.classList.remove('hidden');
      }
    });
  }

  // 10. Tombol "Verifikasi"
  const btnVerify = document.getElementById('btn-verify');
  if (btnVerify) {
    btnVerify.addEventListener('click', async () => {
      if (!AppState.currentKeyPair?.publicKey) {
        showNotification('Harap buat atau masukkan kunci RSA terlebih dahulu', 'error');
        return;
      }
      if (!verifyFile) {
        showNotification('Harap upload file yang akan diverifikasi', 'error');
        return;
      }

      const sigInput = document.getElementById('verify-signature-input');
      const signature = sigInput ? parseInt(sigInput.value, 10) : NaN;
      if (isNaN(signature) || signature <= 0) {
        showNotification('Harap masukkan nilai tanda tangan yang valid', 'error');
        return;
      }

      showProcessing();
      try {
        const result = await verifySignature(verifyFile, signature, AppState.currentKeyPair.publicKey);

        const resultDisplay = document.getElementById('verify-result-display');
        const verifySteps = document.getElementById('sig-verify-steps');
        const resultCard = document.getElementById('verify-result-card');

        if (resultDisplay) {
          resultDisplay.innerHTML = result.valid
            ? `<div class="verify-valid">✅ <strong>Tanda Tangan VALID</strong> — File asli dan tidak diubah</div>`
            : `<div class="verify-invalid">❌ <strong>Tanda Tangan TIDAK VALID</strong> — File mungkin telah diubah atau tanda tangan salah</div>`;
        }
        if (verifySteps) verifySteps.innerHTML = result.steps.join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:0.5rem 0">');
        if (resultCard) resultCard.classList.remove('hidden');

        showNotification(
          result.valid ? 'Verifikasi berhasil — tanda tangan valid!' : 'Verifikasi selesai — tanda tangan tidak valid',
          result.valid ? 'success' : 'error'
        );
      } catch (err) {
        showNotification(`Gagal memverifikasi: ${err.message}`, 'error');
      } finally {
        hideProcessing();
      }
    });
  }
}

// Helper: ikon berdasarkan ekstensi file
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
    pptx: '📊', ppt: '📊', txt: '📃', md: '📃', csv: '📊',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    mp4: '🎬', mp3: '🎵', zip: '🗜️', json: '📋', js: '📋',
    html: '🌐', css: '🎨', py: '🐍',
  };
  return icons[ext] || '📁';
}

// Jalankan init setelah DOM siap
document.addEventListener('DOMContentLoaded', init);

export { init, AppState };
