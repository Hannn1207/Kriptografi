/**
 * Unit tests (snapshot/HTML output) untuk step-visualizer.js
 */
import { describe, it, expect } from 'vitest';
import {
  renderEncryptionSteps,
  renderDecryptionSteps,
  renderKeyGenerationSteps,
  clearSteps,
} from './step-visualizer.js';

// Helper: buat mock DOM element dengan innerHTML
function createMockElement() {
  return { innerHTML: '' };
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('renderEncryptionSteps', () => {
  it('merender satu langkah enkripsi dengan HTML yang benar', () => {
    const steps = [
      {
        character: 'A',
        asciiValue: 65,
        cipherValue: 2790,
        formula: 'C = M^e mod n',
        substituted: 'C = 65^17 mod 3233',
        description: "Karakter 'A' memiliki nilai ASCII 65. Enkripsi: C = 65^17 mod 3233 = 2790",
      },
    ];
    const el = createMockElement();
    renderEncryptionSteps(steps, el);

    // Harus mengandung elemen step
    expect(el.innerHTML).toContain('class="step step-encryption"');
    // Harus menampilkan nomor langkah
    expect(el.innerHTML).toContain('Langkah 1');
    // Harus menampilkan karakter
    expect(el.innerHTML).toContain("'A'");
    // Harus menampilkan nilai ASCII
    expect(el.innerHTML).toContain('65');
    // Harus menampilkan rumus
    expect(el.innerHTML).toContain('C = M^e mod n');
    // Harus menampilkan substitusi
    expect(el.innerHTML).toContain('C = 65^17 mod 3233');
    // Harus menampilkan hasil cipher
    expect(el.innerHTML).toContain('2790');
    // Harus menampilkan deskripsi
    expect(el.innerHTML).toContain('ASCII 65');
  });

  it('merender beberapa langkah enkripsi secara berurutan', () => {
    const steps = [
      {
        character: 'H',
        asciiValue: 72,
        cipherValue: 1000,
        formula: 'C = M^e mod n',
        substituted: 'C = 72^17 mod 3233',
        description: "Karakter 'H' dienkripsi",
      },
      {
        character: 'i',
        asciiValue: 105,
        cipherValue: 2000,
        formula: 'C = M^e mod n',
        substituted: 'C = 105^17 mod 3233',
        description: "Karakter 'i' dienkripsi",
      },
    ];
    const el = createMockElement();
    renderEncryptionSteps(steps, el);

    expect(el.innerHTML).toContain('Langkah 1');
    expect(el.innerHTML).toContain('Langkah 2');
    expect(el.innerHTML).toContain("'H'");
    expect(el.innerHTML).toContain("'i'");
  });

  it('merender array kosong menghasilkan innerHTML kosong', () => {
    const el = createMockElement();
    renderEncryptionSteps([], el);
    expect(el.innerHTML).toBe('');
  });
});

describe('renderDecryptionSteps', () => {
  it('merender satu langkah dekripsi dengan HTML yang benar', () => {
    const steps = [
      {
        cipherValue: 2790,
        asciiValue: 65,
        character: 'A',
        formula: 'M = C^d mod n',
        substituted: 'M = 2790^2753 mod 3233',
        description: "Nilai cipher 2790 didekripsi menjadi ASCII 65, yaitu karakter 'A'",
      },
    ];
    const el = createMockElement();
    renderDecryptionSteps(steps, el);

    // Harus mengandung elemen step
    expect(el.innerHTML).toContain('class="step step-decryption"');
    // Harus menampilkan nomor langkah
    expect(el.innerHTML).toContain('Langkah 1');
    // Harus menampilkan nilai cipher
    expect(el.innerHTML).toContain('2790');
    // Harus menampilkan rumus
    expect(el.innerHTML).toContain('M = C^d mod n');
    // Harus menampilkan substitusi
    expect(el.innerHTML).toContain('M = 2790^2753 mod 3233');
    // Harus menampilkan hasil ASCII
    expect(el.innerHTML).toContain('65');
    // Harus menampilkan karakter hasil
    expect(el.innerHTML).toContain("'A'");
    // Harus menampilkan deskripsi
    expect(el.innerHTML).toContain('ASCII 65');
  });

  it('merender beberapa langkah dekripsi secara berurutan', () => {
    const steps = [
      {
        cipherValue: 1000,
        asciiValue: 72,
        character: 'H',
        formula: 'M = C^d mod n',
        substituted: 'M = 1000^2753 mod 3233',
        description: "Nilai cipher 1000 didekripsi",
      },
      {
        cipherValue: 2000,
        asciiValue: 105,
        character: 'i',
        formula: 'M = C^d mod n',
        substituted: 'M = 2000^2753 mod 3233',
        description: "Nilai cipher 2000 didekripsi",
      },
    ];
    const el = createMockElement();
    renderDecryptionSteps(steps, el);

    expect(el.innerHTML).toContain('Langkah 1');
    expect(el.innerHTML).toContain('Langkah 2');
    expect(el.innerHTML).toContain('1000');
    expect(el.innerHTML).toContain('2000');
  });

  it('merender array kosong menghasilkan innerHTML kosong', () => {
    const el = createMockElement();
    renderDecryptionSteps([], el);
    expect(el.innerHTML).toBe('');
  });
});

describe('renderKeyGenerationSteps', () => {
  it('merender semua 5 langkah pembuatan kunci', () => {
    const steps = {
      step1_primes: { p: 61, q: 53, description: 'Pilih dua bilangan prima p = 61 dan q = 53' },
      step2_n: { value: 3233, formula: 'n = p × q = 61 × 53', description: 'Hitung modulus n = 3233' },
      step3_phi: { value: 3120, formula: 'φ(n) = (p-1)(q-1) = 60 × 52', description: 'Hitung φ(n) = 3120' },
      step4_e: { value: 17, description: 'Pilih e = 17 sehingga gcd(17, 3120) = 1' },
      step5_d: { value: 2753, formula: 'd = e^(-1) mod φ(n)', description: 'Hitung d = 2753' },
    };
    const el = createMockElement();
    renderKeyGenerationSteps(steps, el);

    expect(el.innerHTML).toContain('Langkah 1');
    expect(el.innerHTML).toContain('Langkah 2');
    expect(el.innerHTML).toContain('Langkah 3');
    expect(el.innerHTML).toContain('Langkah 4');
    expect(el.innerHTML).toContain('Langkah 5');
    expect(el.innerHTML).toContain('61');
    expect(el.innerHTML).toContain('53');
    expect(el.innerHTML).toContain('3233');
    expect(el.innerHTML).toContain('3120');
    expect(el.innerHTML).toContain('17');
    expect(el.innerHTML).toContain('2753');
  });
});

describe('clearSteps', () => {
  it('mengosongkan innerHTML elemen target', () => {
    const el = createMockElement();
    el.innerHTML = '<div class="step">Langkah 1</div><div class="step">Langkah 2</div>';
    clearSteps(el);
    expect(el.innerHTML).toBe('');
  });

  it('tidak error jika elemen sudah kosong', () => {
    const el = createMockElement();
    el.innerHTML = '';
    expect(() => clearSteps(el)).not.toThrow();
    expect(el.innerHTML).toBe('');
  });

  it('mengosongkan elemen setelah renderEncryptionSteps', () => {
    const steps = [
      {
        character: 'A',
        asciiValue: 65,
        cipherValue: 2790,
        formula: 'C = M^e mod n',
        substituted: 'C = 65^17 mod 3233',
        description: "Karakter 'A' dienkripsi",
      },
    ];
    const el = createMockElement();
    renderEncryptionSteps(steps, el);
    expect(el.innerHTML).not.toBe('');

    clearSteps(el);
    expect(el.innerHTML).toBe('');
  });

  it('mengosongkan elemen setelah renderDecryptionSteps', () => {
    const steps = [
      {
        cipherValue: 2790,
        asciiValue: 65,
        character: 'A',
        formula: 'M = C^d mod n',
        substituted: 'M = 2790^2753 mod 3233',
        description: "Nilai cipher 2790 didekripsi",
      },
    ];
    const el = createMockElement();
    renderDecryptionSteps(steps, el);
    expect(el.innerHTML).not.toBe('');

    clearSteps(el);
    expect(el.innerHTML).toBe('');
  });
});
