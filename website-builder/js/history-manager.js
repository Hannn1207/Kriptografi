/**
 * History Manager - Mengelola riwayat operasi dalam memori sesi
 */

// In-memory storage untuk riwayat operasi
const _entries = [];

/**
 * Menambahkan entri riwayat baru
 * @param {{ type: string, key: object, input: string, output: string }} entry
 * @returns {{ id: string, timestamp: Date, type: string, key: object, input: string, output: string }}
 */
function addEntry(entry) {
  const id = crypto.randomUUID();
  const timestamp = new Date();
  const fullEntry = { ...entry, id, timestamp };
  _entries.push(fullEntry);
  return fullEntry;
}

/**
 * Mengambil semua entri, diurutkan dari terbaru ke terlama
 * @returns {object[]}
 */
function getEntries() {
  return [..._entries].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Menghapus semua entri riwayat
 */
function clearAll() {
  _entries.length = 0;
}

/**
 * Merender daftar riwayat ke elemen target
 * @param {HTMLElement} targetElement
 */
function renderHistory(targetElement) {
  if (!targetElement) return;

  const entries = getEntries();

  if (entries.length === 0) {
    targetElement.innerHTML = '<p class="empty-history">Belum ada riwayat operasi</p>';
    return;
  }

  const listItems = entries.map(entry => {
    const ts = entry.timestamp instanceof Date
      ? entry.timestamp.toLocaleString('id-ID')
      : new Date(entry.timestamp).toLocaleString('id-ID');

    const keyInfo = entry.type === 'Enkripsi'
      ? `n=${entry.key.n}, e=${entry.key.e}`
      : `n=${entry.key.n}, d=${entry.key.d}`;

    return `<li class="history-item">
      <div class="history-item-header">
        <span class="history-type ${entry.type === 'Enkripsi' ? 'enkripsi' : 'dekripsi'}">${entry.type}</span>
        <span class="history-timestamp">${ts}</span>
      </div>
      <div class="history-item-body">
        <div class="history-key"><span class="history-label">Kunci:</span> ${keyInfo}</div>
        <div class="history-input"><span class="history-label">Input:</span> <span class="history-value">${entry.input}</span></div>
        <div class="history-output"><span class="history-label">Output:</span> <span class="history-value mono">${entry.output}</span></div>
      </div>
    </li>`;
  }).join('');

  targetElement.innerHTML = `<ul class="history-list">${listItems}</ul>`;
}

export { addEntry, getEntries, clearAll, renderHistory };
