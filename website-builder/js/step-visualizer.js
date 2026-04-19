/**
 * Step Visualizer - Merender langkah-langkah algoritma ke dalam DOM
 */

/**
 * Merender langkah-langkah pembuatan kunci ke elemen target
 * @param {object} steps - KeyGenerationSteps object
 * @param {HTMLElement} targetElement
 */
function renderKeyGenerationSteps(steps, targetElement) {
  const stepsData = [
    {
      number: 1,
      title: 'Pemilihan Bilangan Prima p dan q',
      formula: null,
      value: `p = ${steps.step1_primes.p}, q = ${steps.step1_primes.q}`,
      description: steps.step1_primes.description,
    },
    {
      number: 2,
      title: 'Perhitungan Modulus n',
      formula: steps.step2_n.formula || null,
      value: steps.step2_n.value !== undefined ? `n = ${steps.step2_n.value}` : null,
      description: steps.step2_n.description,
    },
    {
      number: 3,
      title: 'Perhitungan Euler\'s Totient φ(n)',
      formula: steps.step3_phi.formula || null,
      value: steps.step3_phi.value !== undefined ? `φ(n) = ${steps.step3_phi.value}` : null,
      description: steps.step3_phi.description,
    },
    {
      number: 4,
      title: 'Pemilihan Eksponen Publik e',
      formula: null,
      value: steps.step4_e.value !== undefined ? `e = ${steps.step4_e.value}` : null,
      description: steps.step4_e.description,
    },
    {
      number: 5,
      title: 'Perhitungan Eksponen Privat d',
      formula: steps.step5_d.formula || null,
      value: steps.step5_d.value !== undefined ? `d = ${steps.step5_d.value}` : null,
      description: steps.step5_d.description,
    },
  ];

  let html = '';
  for (const step of stepsData) {
    html += `<div class="step step-key">`;
    html += `<div class="step-header"><span class="step-number">Langkah ${step.number}</span><span class="step-title">${step.title}</span></div>`;
    if (step.formula) {
      html += `<div class="step-formula">${step.formula}</div>`;
    }
    if (step.value) {
      html += `<div class="step-value">${step.value}</div>`;
    }
    html += `<div class="step-description">${step.description}</div>`;
    html += `</div>`;
  }

  targetElement.innerHTML = html;
}

/**
 * Merender langkah-langkah enkripsi ke elemen target
 * @param {object[]} steps - Array of EncryptionStep objects
 * @param {HTMLElement} targetElement
 */
function renderEncryptionSteps(steps, targetElement) {
  let html = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    html += `<div class="step step-encryption">`;
    html += `<div class="step-header"><span class="step-number">Langkah ${i + 1}</span><span class="step-char">Karakter: '${step.character}'</span></div>`;
    html += `<div class="step-ascii">Nilai ASCII: ${step.asciiValue}</div>`;
    html += `<div class="step-formula">Rumus: ${step.formula}</div>`;
    html += `<div class="step-substituted">Substitusi: ${step.substituted}</div>`;
    html += `<div class="step-result">Hasil: C = ${step.cipherValue}</div>`;
    html += `<div class="step-description">${step.description}</div>`;
    html += `</div>`;
  }

  targetElement.innerHTML = html;
}

/**
 * Merender langkah-langkah dekripsi ke elemen target
 * @param {object[]} steps - Array of DecryptionStep objects
 * @param {HTMLElement} targetElement
 */
function renderDecryptionSteps(steps, targetElement) {
  let html = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    html += `<div class="step step-decryption">`;
    html += `<div class="step-header"><span class="step-number">Langkah ${i + 1}</span><span class="step-cipher">Nilai Cipher: ${step.cipherValue}</span></div>`;
    html += `<div class="step-formula">Rumus: ${step.formula}</div>`;
    html += `<div class="step-substituted">Substitusi: ${step.substituted}</div>`;
    html += `<div class="step-ascii-result">Hasil ASCII: ${step.asciiValue}</div>`;
    html += `<div class="step-char">Karakter: '${step.character}'</div>`;
    html += `<div class="step-description">${step.description}</div>`;
    html += `</div>`;
  }

  targetElement.innerHTML = html;
}

/**
 * Menghapus semua langkah yang ditampilkan
 * @param {HTMLElement} targetElement
 */
function clearSteps(targetElement) {
  targetElement.innerHTML = '';
}

export { renderKeyGenerationSteps, renderEncryptionSteps, renderDecryptionSteps, clearSteps };
